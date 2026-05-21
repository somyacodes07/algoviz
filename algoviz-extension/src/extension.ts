import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('algoviz.start', () => {
    // Grab the active editor BEFORE the webview takes focus
    const editor = vscode.window.activeTextEditor;
    let initialContext: { code: string, language: string } | undefined;
    
    if (editor) {
      const languageId = editor.document.languageId;
      if (languageId === 'cpp' || languageId === 'c' || languageId === 'javascript') {
        const text = editor.document.getText();
        const algovizLang = languageId === 'cpp' || languageId === 'c' ? 'c++' : 'javascript';
        initialContext = { code: text, language: algovizLang };
      }
    }
    
    AlgoVizPanel.createOrShow(context.extensionUri, initialContext);
  });

  let visualizeCmd = vscode.commands.registerCommand('algoviz.visualizeCurrentFile', () => {
    const editor = vscode.window.activeTextEditor;
    let initialContext: { code: string, language: string } | undefined;
    
    if (editor) {
      const languageId = editor.document.languageId;
      if (languageId === 'cpp' || languageId === 'c' || languageId === 'javascript') {
        const text = editor.document.getText();
        const algovizLang = languageId === 'cpp' || languageId === 'c' ? 'c++' : 'javascript';
        initialContext = { code: text, language: algovizLang };
      }
    }
    
    AlgoVizPanel.createOrShow(context.extensionUri, initialContext);
  });

  context.subscriptions.push(disposable, visualizeCmd);
}

class AlgoVizPanel {
  public static currentPanel: AlgoVizPanel | undefined;
  public static readonly viewType = 'algoviz';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  
  // Store the pending context to send when webview is ready
  private _pendingContext?: { code: string, language: string };

  public static createOrShow(extensionUri: vscode.Uri, initialContext?: { code: string, language: string }) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (AlgoVizPanel.currentPanel) {
      if (initialContext) {
        AlgoVizPanel.currentPanel._pendingContext = initialContext;
        // If it's already shown, it might already be ready, so send it immediately just in case
        AlgoVizPanel.currentPanel.sendContext(initialContext.code, initialContext.language);
      }
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

    panel.iconPath = vscode.Uri.joinPath(extensionUri, 'icon.png');

    AlgoVizPanel.currentPanel = new AlgoVizPanel(panel, extensionUri, initialContext);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, initialContext?: { code: string, language: string }) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._pendingContext = initialContext;

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'webviewReady':
            // The React app has loaded, now we can safely send the active file code!
            if (this._pendingContext) {
              this.sendContext(this._pendingContext.code, this._pendingContext.language);
              this._pendingContext = undefined;
            }
            return;
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
    const baseUri = webview.asWebviewUri(distPath).toString();

    html = html.replace(/(href|src)="\.\.\/assets\//g, `$1="${scriptUri}/`);
    html = html.replace('<head>', `<head>\n    <script>window.__WEBVIEW_URI__ = "${baseUri}";</script>`);

    return html;
  }
}

export function deactivate() {}
