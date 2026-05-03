import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('algoviz.start', () => {
    AlgoVizPanel.createOrShow(context.extensionUri);
  });

  let visualizeCmd = vscode.commands.registerCommand('algoviz.visualizeCurrentFile', () => {
    AlgoVizPanel.createOrShow(context.extensionUri);
    
    // After creating or showing the panel, wait a tiny bit to ensure the webview is ready,
    // then send the code to it.
    setTimeout(() => {
      const editor = vscode.window.activeTextEditor;
      if (editor && AlgoVizPanel.currentPanel) {
        const text = editor.document.getText();
        const languageId = editor.document.languageId;
        // Map VS Code language IDs to our internal IDs
        const algovizLang = languageId === 'cpp' || languageId === 'c' ? 'c++' : 'javascript';
        
        AlgoVizPanel.currentPanel.sendContext(text, algovizLang);
      }
    }, 500);
  });

  context.subscriptions.push(disposable, visualizeCmd);
}

class AlgoVizPanel {
  public static currentPanel: AlgoVizPanel | undefined;
  public static readonly viewType = 'algoviz';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (AlgoVizPanel.currentPanel) {
      AlgoVizPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      AlgoVizPanel.viewType,
      'AlgoViz',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist')],
        retainContextWhenHidden: true,
      }
    );

    AlgoVizPanel.currentPanel = new AlgoVizPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'runCode':
            vscode.window.showInformationMessage(`Running code for language: ${message.language}`);
            // TODO: Add local execution logic
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
      if (x) {
        x.dispose();
      }
    }
  }

  public sendContext(code: string, language: string) {
    this._panel.webview.postMessage({
      command: 'setContext',
      code,
      language
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
  <p>Make sure you have built the webview-ui folder.</p>
</body>
</html>`;
    }

    // Rewrite relative paths to vscode-webview-resource URIs
    const scriptPathOnDisk = vscode.Uri.joinPath(distPath, 'assets');
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

    html = html.replace(/(href|src)="\.\.\/assets\//g, `$1="${scriptUri}/`);

    return html;
  }
}

export function deactivate() {}
