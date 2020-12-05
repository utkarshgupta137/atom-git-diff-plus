const { CompositeDisposable } = require("atom");

const helpers = require("./helpers.js");

const MAX_BUFFER_LENGTH_TO_DIFF = 2 * 1024 * 1024;

class DiffView {
  constructor(editor) {
    this.updateDiffs = this.updateDiffs.bind(this);

    this.subscriptions = new CompositeDisposable();
    this.markers = [];

    this.editor = editor;
    this.subscribeToRepository();

    const editorElement = this.editor.getElement();
    this.subscriptions.add(
      atom.config.observe("editor.showLineNumbers", () => {
        this.updateIconDecoration();
      }),
      atom.config.observe("atom-git-diff-plus.showIcons", () => {
        this.updateIconDecoration();
      }),
      atom.commands.add(
        editorElement,
        "atom-git-diff-plus:move-to-previous-diff",
        () => {
          this.moveToPreviousDiff();
        }
      ),
      atom.commands.add(
        editorElement,
        "atom-git-diff-plus:move-to-next-diff",
        () => {
          this.moveToNextDiff();
        }
      ),
      this.editor.onDidChangePath(() => {
        this.subscribeToRepository();
      }),
      this.editor.onDidStopChanging(() => {
        this.scheduleUpdate();
      }),
      this.editor.onDidDestroy(() => {
        this.destroy();
      })
    );
  }

  destroy() {
    this.cancelUpdate();
    this.removeMarkers();
    this.subscriptions.dispose();
  }

  updateIconDecoration() {
    const gutter = this.editor.getElement().querySelector(".gutter");
    if (gutter) {
      if (
        atom.config.get("editor.showLineNumbers") &&
        atom.config.get("atom-git-diff-plus.showIcons")
      ) {
        gutter.classList.add("git-diff-icon");
      } else {
        gutter.classList.remove("git-diff-icon");
      }
    }
  }

  addMarker(startRow, endRow, klass) {
    const marker = this.editor.markBufferRange(
      [
        [startRow, 0],
        [endRow, 0],
      ],
      {
        invalidate: "never",
      }
    );
    this.editor.decorateMarker(marker, { type: "line-number", class: klass });
    this.markers.push(marker);
  }

  addMarkers(diffs) {
    diffs.forEach(({ newStart, oldLines, newLines }) => {
      const startRow = newStart - 1;
      const endRow = newStart + newLines - 1;
      if (oldLines === 0 && newLines > 0) {
        this.addMarker(startRow, endRow, "git-line-added");
      } else if (newLines === 0 && oldLines > 0) {
        if (startRow < 0) {
          this.addMarker(0, 0, "git-previous-line-removed");
        } else {
          this.addMarker(startRow, startRow, "git-line-removed");
        }
      } else {
        this.addMarker(startRow, endRow, "git-line-modified");
      }
    });
  }

  removeMarkers() {
    this.markers.forEach((marker) => {
      marker.destroy();
    });
    this.markers = [];
  }

  updateDiffs() {
    this.removeMarkers();

    const path = this.editor.getPath();
    if (this.editor.getBuffer().getLength() < MAX_BUFFER_LENGTH_TO_DIFF) {
      this.diffs =
        this.repository &&
        this.repository.getLineDiffs(path, this.editor.getText());
      if (this.diffs) {
        this.addMarkers(this.diffs);
      }
    }
  }

  scheduleUpdate() {
    this.cancelUpdate();
    this.immediateId = setImmediate(this.updateDiffs);
  }

  cancelUpdate() {
    clearImmediate(this.immediateId);
  }

  async subscribeToRepository() {
    this.repository = await helpers.repositoryForEditor(this.editor);
    if (this.repository) {
      this.scheduleUpdate();
      this.subscriptions.add(
        this.repository.onDidChangeStatuses(() => {
          this.scheduleUpdate();
        }),
        this.repository.onDidChangeStatus((changedPath) => {
          if (this.editor.getPath() === changedPath) {
            this.scheduleUpdate();
          }
        })
      );
    }
  }

  moveToPreviousDiff() {
    const cursorLineNumber = this.editor.getCursorBufferPosition().row + 1;
    let previousDiffLineNumber = -Infinity;
    let lastDiffLineNumber = -Infinity;
    if (this.diffs) {
      this.diffs.forEach(({ newStart }) => {
        if (newStart < cursorLineNumber) {
          previousDiffLineNumber = Math.max(
            newStart - 1,
            previousDiffLineNumber
          );
        }
        lastDiffLineNumber = Math.max(newStart - 1, lastDiffLineNumber);
      });

      if (
        previousDiffLineNumber === -Infinity &&
        atom.config.get("atom-git-diff-plus.wrapAroundOnMoveToDiff")
      ) {
        previousDiffLineNumber = lastDiffLineNumber;
      }
    }

    helpers.moveToLineNumber(this.editor, previousDiffLineNumber);
  }

  moveToNextDiff() {
    const cursorLineNumber = this.editor.getCursorBufferPosition().row + 1;
    let nextDiffLineNumber = Infinity;
    let firstDiffLineNumber = Infinity;
    if (this.diffs) {
      this.diffs.forEach(({ newStart }) => {
        if (newStart > cursorLineNumber) {
          nextDiffLineNumber = Math.min(newStart - 1, nextDiffLineNumber);
        }
        firstDiffLineNumber = Math.min(newStart - 1, firstDiffLineNumber);
      });

      if (
        nextDiffLineNumber === Infinity &&
        atom.config.get("atom-git-diff-plus.wrapAroundOnMoveToDiff")
      ) {
        nextDiffLineNumber = firstDiffLineNumber;
      }
    }

    helpers.moveToLineNumber(this.editor, nextDiffLineNumber);
  }
}

module.exports = DiffView;
