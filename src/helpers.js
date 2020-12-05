const { Directory } = require("atom");

async function repositoryForEditor(editor) {
  if (editor) {
    return atom.project.repositoryForDirectory(new Directory(editor.getPath()));
  }
  return null;
}

function moveToLineNumber(editor, lineNumber) {
  if (lineNumber && lineNumber !== -Infinity && lineNumber !== Infinity) {
    editor.setCursorBufferPosition([lineNumber, 0]);
    editor.moveToFirstCharacterOfLine();
  }
}

module.exports = { moveToLineNumber, repositoryForEditor };
