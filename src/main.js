const DiffListView = require("./diff-list-view.js");
const DiffView = require("./diff-view.js");

const config = {
  showIcons: {
    type: "boolean",
    default: false,
    description:
      "Show colored icons for added (`+`), modified (`·`) and removed (`-`) lines in the editor's gutter, instead of colored markers (`|`).",
  },
  wrapAroundOnMoveToDiff: {
    type: "boolean",
    default: true,
    description:
      "Wraps around to the first/last diff in the file when moving to next/previous diff.",
  },
};

let diffListView = null;

function activate() {
  const watchedEditors = new WeakSet();

  atom.workspace.observeTextEditors((editor) => {
    if (watchedEditors.has(editor)) {
      return;
    }

    new DiffView(editor).start();
    atom.commands.add(
      atom.views.getView(editor),
      "atom-git-diff-plus:toggle-diff-list",
      () => {
        if (diffListView == null) {
          diffListView = new DiffListView();
        }
        diffListView.toggle();
      }
    );

    watchedEditors.add(editor);
    editor.onDidDestroy(() => {
      return watchedEditors.delete(editor);
    });
  });
}

function deactivate() {
  if (diffListView) {
    diffListView.destroy();
  }
  diffListView = null;
}

module.exports = {
  config,
  activate,
  deactivate,
};
