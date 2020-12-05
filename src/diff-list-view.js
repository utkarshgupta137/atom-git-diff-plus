const SelectListView = require("atom-select-list");

const helpers = require("./helpers.js");

class DiffListView {
  constructor() {
    this.selectListView = new SelectListView({
      items: [],
      elementForItem: (diff) => {
        const li = document.createElement("li");
        li.classList.add("two-lines");

        const primaryLine = document.createElement("div");
        primaryLine.classList.add("primary-line");
        primaryLine.textContent = diff.lineText;
        li.appendChild(primaryLine);

        const secondaryLine = document.createElement("div");
        secondaryLine.classList.add("secondary-line");
        secondaryLine.textContent = `-${diff.oldStart},${diff.oldLines} +${diff.newStart},${diff.newLines}`;
        li.appendChild(secondaryLine);

        return li;
      },
      filterKeyForItem: (diff) => {
        return diff.lineText;
      },
      didConfirmSelection: (diff) => {
        this.hide();
        const bufferRow = Math.max(diff.newStart - 1, 0);
        helpers.moveToLine(this.editor, bufferRow);
      },
      didCancelSelection: () => {
        this.hide();
      },
      emptyMessage: "No diffs in file",
    });
    this.selectListView.element.classList.add("diff-list-view");

    this.selectListPanel = atom.workspace.addModalPanel({
      item: this.selectListView,
      visible: false,
    });
  }

  show() {
    this.previouslyFocusedElement = document.activeElement;
    this.selectListView.reset();
    this.selectListPanel.show();
    this.selectListView.focus();
  }

  hide() {
    this.selectListPanel.hide();
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = null;
    }
  }

  destroy() {
    this.hide();
    this.selectListPanel.destroy();
    this.selectListView.destroy();
  }

  async toggle() {
    if (this.selectListPanel.isVisible()) {
      this.hide();
      return;
    }

    const activeEditor = atom.workspace.getActiveTextEditor();
    if (activeEditor) {
      this.editor = activeEditor;

      const repository = helpers.repositoryForPath(this.editor.getPath());
      let diffs =
        repository &&
        repository.getLineDiffs(this.editor.getPath(), this.editor.getText());
      if (!diffs) {
        diffs = [];
      }

      diffs.forEach((diff) => {
        const bufferRow = Math.max(diff.newStart - 1, 0);
        const lineText = this.editor.lineTextForBufferRow(bufferRow);
        diff.lineText = lineText ? lineText.trim() : "";
      });

      await this.selectListView.update({ items: diffs });
      this.show();
    }
  }
}

module.exports = DiffListView;
