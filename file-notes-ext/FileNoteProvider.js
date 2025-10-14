const vscode = require("vscode");
const path = require("path");

class FileItem extends vscode.TreeItem {
  constructor(label, collapsibleState) {
    super(label, collapsibleState);
    this.children = undefined; // string[] of relative paths
  }
}

class FileNoteProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;

    this.notes = {};
    this.roots = [];
    this.maxLen = 30;

    this.loadConfig();
  }

  refresh() {
    this.loadConfig();
    this._onDidChangeTreeData.fire();
  }

  async loadConfig() {
    const cfg = vscode.workspace.getConfiguration();
    this.roots = cfg.get("fileNotes.rootGlobs", ["public/**"]);
    this.maxLen = cfg.get("fileNotes.maxNoteLength", 30);
    this.notes = await this.readNotes();
  }

  async readNotes() {
    const notesFile = vscode.workspace.getConfiguration().get("fileNotes.notesFile", ".file-notes.json");
    const ws = vscode.workspace.workspaceFolders?.[0];
    if (!ws) return {};
    const uri = vscode.Uri.joinPath(ws.uri, notesFile);
    try {
      const buf = await vscode.workspace.fs.readFile(uri);
      return JSON.parse(Buffer.from(buf).toString("utf8")) || {};
    } catch {
      return {};
    }
  }

  async writeNotes() {
    const notesFile = vscode.workspace.getConfiguration().get("fileNotes.notesFile", ".file-notes.json");
    const ws = vscode.workspace.workspaceFolders?.[0];
    if (!ws) return;
    const uri = vscode.Uri.joinPath(ws.uri, notesFile);
    await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(this.notes, null, 2), "utf8"));
  }

  getTreeItem(e) { return e; }

  async getChildren(element) {
    if (!vscode.workspace.workspaceFolders?.length) return [];

    if (!element) {
      // 루트: 글롭으로 파일 모으기
      const files = new Set();
      for (const glob of this.roots) {
        const uris = await vscode.workspace.findFiles(glob);
        uris.forEach(u => files.add(u.fsPath));
      }
      const wsRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
      const rels = Array.from(files).map(f => path.relative(wsRoot, f).replace(/\\/g, "/")).sort();

      // 1단계 폴더로 그룹
      const top = new Map();
      for (const rel of rels) {
        const seg = rel.split("/")[0] || rel;
        const list = top.get(seg) ?? [];
        list.push(rel);
        top.set(seg, list);
      }
      return Array.from(top.entries()).map(([seg, list]) => {
        const item = new FileItem(seg, vscode.TreeItemCollapsibleState.Collapsed);
        item.contextValue = "folder";
        item.children = list;
        return item;
      });
    } else if (element.contextValue === "folder") {
      const groups = new Map();
      const fileItems = [];

      for (const rel of element.children ?? []) {
        const parts = rel.split("/");
        if (parts.length === 1) {
          const fileUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, rel);
          const note = await this.getNoteOrInfer(rel, fileUri);
          const fi = new FileItem(parts[0], vscode.TreeItemCollapsibleState.None);
          fi.resourceUri = fileUri;
          fi.command = { command: "fileNotes.openFile", title: "Open", arguments: [fileUri] };
          fi.description = note || "";  // ← 파일명 오른쪽 회색 설명!
          fi.contextValue = "file";
          fileItems.push(fi);
        } else {
          const next = parts[0];
          const rest = parts.slice(1).join("/");
          const arr = groups.get(next) ?? [];
          arr.push(rest);
          groups.set(next, arr);
        }
      }

      const folders = Array.from(groups.entries()).map(([folder, list]) => {
        const it = new FileItem(folder, vscode.TreeItemCollapsibleState.Collapsed);
        it.contextValue = "folder";
        it.children = list;
        return it;
      });

      return [...folders, ...fileItems];
    }

    return [];
  }

  async getNoteOrInfer(rel, uri) {
    if (this.notes[rel]) return this.notes[rel];
    const inferred = await this.inferNoteFromFile(uri);
    return inferred ?? "";
  }

  strip(html) {
    const txt = html
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<\/?[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return txt.length > this.maxLen ? txt.slice(0, this.maxLen).trim() + "…" : txt;
  }

  // HTML에서 설명 자동 추출: <title> → <h3> → <strong> → 첫 라인
  async inferNoteFromFile(fileUri) {
    try {
      const buf = await vscode.workspace.fs.readFile(fileUri);
      const raw = Buffer.from(buf).toString("utf8").slice(0, 20000);

      const m1 = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (m1?.[1]) return this.strip(m1[1]);
      const m2 = raw.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
      if (m2?.[1]) return this.strip(m2[1]);
      const m3 = raw.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
      if (m3?.[1]) return this.strip(m3[1]);

      const firstLine = raw.split(/\r?\n/).find(l => l.trim().length > 0);
      if (firstLine) return this.strip(firstLine);

      return "";
    } catch {
      return "";
    }
  }

  async addOrEditNote(resource) {
    if (!resource) return;
    const ws = vscode.workspace.workspaceFolders?.[0];
    if (!ws) return;
    const rel = path.relative(ws.uri.fsPath, resource.fsPath).replace(/\\/g, "/");
    const current = this.notes[rel] ?? "";
    const input = await vscode.window.showInputBox({
      title: `설명(비고) 입력: ${rel}`,
      value: current,
      placeHolder: "예) 행정 키오스크 관련"
    });
    if (input === undefined) return;
    this.notes[rel] = input;
    await this.writeNotes();
    this.refresh();
  }

  // 워크스페이스 전체 자동 생성/갱신
  async generateAllNotes() {
    if (!vscode.workspace.workspaceFolders?.length) return;
    const wsRoot = vscode.workspace.workspaceFolders[0].uri;
    const globs = vscode.workspace.getConfiguration().get("fileNotes.rootGlobs", ["public/**"]);
    const seen = new Set();
    for (const g of globs) {
      const uris = await vscode.workspace.findFiles(g);
      for (const uri of uris) {
        const rel = path.relative(wsRoot.fsPath, uri.fsPath).replace(/\\/g, "/");
        if (seen.has(rel)) continue;
        seen.add(rel);
        if (!this.notes[rel]) {
          const note = await this.inferNoteFromFile(uri);
          if (note) this.notes[rel] = note;
        }
      }
    }
    await this.writeNotes();
    this.refresh();
  }
}

module.exports = { FileNoteProvider };
