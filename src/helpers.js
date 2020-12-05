function repositoryForPath(goalPath) {
  const directories = atom.project.getDirectories();
  const repositories = atom.project.getRepositories();
  for (let i = 0; i < directories.length; i++) {
    const directory = directories[i];
    if (goalPath === directory.getPath() || directory.contains(goalPath)) {
      return repositories[i];
    }
  }
  return null;
}

function moveToLineNumber(editor, lineNumber) {
  if (lineNumber && lineNumber !== -Infinity && lineNumber !== Infinity) {
    editor.setCursorBufferPosition([lineNumber, 0]);
    editor.moveToFirstCharacterOfLine();
  }
}

module.exports = { moveToLineNumber, repositoryForPath };
