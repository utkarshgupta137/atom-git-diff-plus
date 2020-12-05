const DiffListView = require('./diff-list-view');
const DiffView = require('./diff-view');

let diffListView = null;

module.exports = {
  config: {
    "showIconsInEditorGutter": {
      "type": "boolean",
      "default": false,
      "description": "Show colored icons for added (`+`), modified (`·`) and removed (`-`) lines in the editor's gutter, instead of colored markers (`|`)."
    },
    "wrapAroundOnMoveToDiff": {
      "type": "boolean",
      "default": true,
      "description": "Wraps around to the first/last diff in the file when moving to next/previous diff."
    }
  },

  activate() {
    const watchedEditors = new WeakSet();

    atom.workspace.observeTextEditors(editor => {
      if (watchedEditors.has(editor)) return;

      new DiffView(editor).start();
      atom.commands.add(
        atom.views.getView(editor),
        'atom-git-diff-plus:toggle-diff-list',
        () => {
          if (diffListView == null) diffListView = new DiffListView();
          diffListView.toggle();
        }
      );

      watchedEditors.add(editor);
      editor.onDidDestroy(() => watchedEditors.delete(editor));
    });
  },

  deactivate() {
    if (diffListView) diffListView.destroy();
    diffListView = null;
  }
};
