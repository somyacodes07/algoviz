import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

let statusBarItem: vscode.StatusBarItem | undefined;

export function activate(context: vscode.ExtensionContext) {
  // ── Status Bar Shortcut Button ──────────────────────────────────────────
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'algoviz.visualizeCurrentFile';
  statusBarItem.text = '$(play) AlgoViz';
  statusBarItem.tooltip = 'Visualize current file with AlgoViz (Cmd+Alt+V)';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // ── Command 1: Open Visualizer Workbench ────────────────────────────────
  const startCmd = vscode.commands.registerCommand('algoviz.start', () => {
    const editor = vscode.window.activeTextEditor;
    const initialContext = getEditorContext(editor);
    AlgoVizPanel.createOrShow(context.extensionUri, initialContext);
  });

  // ── Command 2: Visualize Active File ────────────────────────────────────
  const visualizeCmd = vscode.commands.registerCommand('algoviz.visualizeCurrentFile', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('AlgoViz: No active editor found. Please open a C++ or JavaScript file.');
      return;
    }
    const initialContext = getEditorContext(editor);
    AlgoVizPanel.createOrShow(context.extensionUri, initialContext);
  });

  // ── Real-Time Sync: Active Editor Tab Switch ───────────────────────────
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && AlgoVizPanel.currentPanel) {
        try {
          const ctx = getEditorContext(editor);
          if (ctx) {
            AlgoVizPanel.currentPanel.sendContext(ctx.code, ctx.language);
          }
        } catch (e) {
          // Editor may have been disposed between event fire and handler execution
          console.warn('AlgoViz: Failed to read editor context', e);
        }
      }
    })
  );

  // ── Real-Time Sync: Text Document Edits (Debounced 400ms) ──────────────
  let syncTimer: NodeJS.Timeout | undefined;
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor && activeEditor.document === e.document && AlgoVizPanel.currentPanel) {
        if (syncTimer) clearTimeout(syncTimer);
        syncTimer = setTimeout(() => {
          const ctx = getEditorContext(activeEditor);
          if (ctx) {
            AlgoVizPanel.currentPanel?.sendContext(ctx.code, ctx.language);
          }
        }, 400);
      }
    })
  );

  context.subscriptions.push(startCmd, visualizeCmd);
}

function getEditorContext(editor?: vscode.TextEditor): { code: string; language: string } | undefined {
  if (!editor) return undefined;
  const languageId = editor.document.languageId;
  const supportedLangs: Record<string, string> = {
    cpp: 'c++',
    c: 'c++',
    javascript: 'javascript',
    typescript: 'javascript',
    javascriptreact: 'javascript',
    typescriptreact: 'javascript',
  };

  const algovizLang = supportedLangs[languageId];
  if (!algovizLang) return undefined;

  // Use selected text if non-empty, otherwise full document
  const selection = editor.selection;
  const selectedText = !selection.isEmpty ? editor.document.getText(selection) : '';
  const code = selectedText.trim().length > 0 ? selectedText : editor.document.getText();

  return { code, language: algovizLang };
}

class AlgoVizPanel {
  public static currentPanel: AlgoVizPanel | undefined;
  public static readonly viewType = 'algoviz';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _pendingContext?: { code: string; language: string };

  public static createOrShow(extensionUri: vscode.Uri, initialContext?: { code: string; language: string }) {
    // Open panel in split view beside active editor
    const column = vscode.window.activeTextEditor
      ? (vscode.window.activeTextEditor.viewColumn || 1) + 1
      : vscode.ViewColumn.Two;

    if (AlgoVizPanel.currentPanel) {
      if (initialContext) {
        AlgoVizPanel.currentPanel._pendingContext = initialContext;
        AlgoVizPanel.currentPanel.sendContext(initialContext.code, initialContext.language);
      }
      AlgoVizPanel.currentPanel._panel.reveal(column > 3 ? vscode.ViewColumn.Two : column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      AlgoVizPanel.viewType,
      'AlgoViz Workbench',
      column > 3 ? vscode.ViewColumn.Two : column,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist')],
        retainContextWhenHidden: true,
      }
    );

    panel.iconPath = vscode.Uri.joinPath(extensionUri, 'icon.png');
    AlgoVizPanel.currentPanel = new AlgoVizPanel(panel, extensionUri, initialContext);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, initialContext?: { code: string; language: string }) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._pendingContext = initialContext;

    this._update();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle panel visibility changes (e.g., tab switch)
    this._panel.onDidChangeViewState(
      () => {
        if (this._panel.visible && this._pendingContext) {
          this.sendContext(this._pendingContext.code, this._pendingContext.language);
        }
      },
      null,
      this._disposables
    );

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'webviewReady':
            if (this._pendingContext) {
              this.sendContext(this._pendingContext.code, this._pendingContext.language);
              this._pendingContext = undefined;
            }
            return;
          case 'runCode':
            vscode.window.showInformationMessage(`AlgoViz: Running ${message.language} execution timeline...`);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public dispose() {
    AlgoVizPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) x.dispose();
    }
  }

  public sendContext(code: string, language: string) {
    this._panel.webview.postMessage({
      command: 'setContext',
      code,
      language,
    });
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const distPath = vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist');
    const htmlPath = vscode.Uri.joinPath(distPath, 'webview', 'index.html');

    let html = '';
    try {
      html = fs.readFileSync(htmlPath.fsPath, 'utf8');
    } catch (e) {
      return `<!DOCTYPE html>
<html lang="en">
<body>
  <h1>Error loading AlgoViz frontend</h1>
  <p>Make sure you have built the webview-ui folder via <code>npm run build:webview</code>.</p>
  <p>Error: ${e instanceof Error ? e.message : String(e)}</p>
</body>
</html>`;
    }

    // Generate a nonce for CSP
    const nonce = getNonce();

    const scriptPathOnDisk = vscode.Uri.joinPath(distPath, 'assets');
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
    const baseUri = webview.asWebviewUri(distPath).toString();

    // Replace both ../assets/ and ./assets/ relative paths emitted by Vite
    html = html.replace(/(href|src)="\.\.\/assets\//g, `$1="${scriptUri}/`);
    html = html.replace(/(href|src)="\.\/assets\//g, `$1="${scriptUri}/`);

    // Inject CSP meta tag + webview URI config
    const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com; font-src ${webview.cspSource} https://fonts.gstatic.com; script-src 'nonce-${nonce}' ${webview.cspSource}; img-src ${webview.cspSource} data: https:; connect-src ${webview.cspSource} https:;">`;
    html = html.replace('<head>', `<head>\n    ${cspMeta}\n    <script nonce="${nonce}">window.__WEBVIEW_URI__ = "${baseUri}";</script>`);

    // Add nonce to all existing script tags
    html = html.replace(/<script(?![^>]*nonce)/g, `<script nonce="${nonce}"`);

    return html;
  }
}

export function deactivate() {
  if (statusBarItem) {
    statusBarItem.dispose();
    statusBarItem = undefined;
  }
}

/** Generate a random nonce for Content Security Policy */
function getNonce(): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return nonce;
}
