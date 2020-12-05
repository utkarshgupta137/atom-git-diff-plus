const { CompositeDisposable } = require("atom");

const DiffListView = require("./diff-list-view.js");
const DiffView = require("./diff-view.js");

const config = {
  showIcons: {
    type: "boolean",
    default: false,
    description:
      "Show colored icons for added (`+`), modified (`·`) and removed (`-`) lines in the editor's gutter, instead of colored markers (`|`).",
    order: 1,
  },
  wrapAroundOnMoveToDiff: {
    type: "boolean",
    default: true,
    description:
      "Wraps around to the first/last diff in the file when moving to next/previous diff.",
    order: 2,
  },
};

const subscriptions = new CompositeDisposable();
let views = [];
let diffListView = null;

function activate() {
  diffListView = new DiffListView();

  subscriptions.add(
    atom.commands.add(
      "atom-text-editor:not([mini])",
      "atom-git-diff-plus:toggle-diff-list",
      () => {
        diffListView.toggle();
      }
    ),
    atom.workspace.observeTextEditors((editor) => {
      views.push(new DiffView(editor));
    })
  );
}

function deactivate() {
  diffListView.destroy();

  views.forEach((view) => {
    view.destroy();
  });
  views = [];

  subscriptions.dispose();
}

module.exports = {
  config,
  activate,
  deactivate,
};
