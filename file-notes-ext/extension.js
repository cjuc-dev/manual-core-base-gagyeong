const vscode = require("vscode");
const { FileNoteProvider } = require("./FileNoteProvider");

function activate(context) {
  console.log('[file-notes-ext] activated');
  const provider = new FileNoteProvider();

  // Activity Bar 전용 뷰
  const view = vscode.window.createTreeView("fileNotesView", {
    treeDataProvider: provider,
    showCollapseAll: true
  });

  // Explorer 아래쪽에도 뷰 추가
  const viewExplorer = vscode.window.createTreeView("fileNotesViewExplorer", {
    treeDataProvider: provider,
    showCollapseAll: true
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("fileNotes.refresh", () => provider.refresh()),
    vscode.commands.registerCommand("fileNotes.openFile", (uri) => uri && vscode.window.showTextDocument(uri, { preview: false })),
    vscode.commands.registerCommand("fileNotes.addOrEditNote", (uri) => provider.addOrEditNote(uri)),
    vscode.commands.registerCommand("fileNotes.generateAllNotes", () => provider.generateAllNotes()),
    view,
    viewExplorer
  );

  const notesFile = vscode.workspace.getConfiguration().get("fileNotes.notesFile", ".file-notes.json");
  if (vscode.workspace.workspaceFolders?.length) {
    const watcher = vscode.workspace.createFileSystemWatcher(`**/${notesFile}`);
    watcher.onDidChange(() => provider.refresh());
    watcher.onDidCreate(() => provider.refresh());
    watcher.onDidDelete(() => provider.refresh());
    context.subscriptions.push(watcher);
  }
}

function deactivate() {}
module.exports = { activate, deactivate };
