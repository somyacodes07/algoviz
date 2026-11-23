import * as vscode from 'vscode';
import * as fs from 'fs';

/**
 * AlgoViz for VS Code.
 *
 * The user's own editor stays the code editor. A webview view in the AlgoViz sidebar
 * runs the trace and draws the data structures, and this host side keeps the two in step:
 * it highlights the executing line in the real editor, shows changed values inline,
 * reads the editor's own breakpoints, and exposes step/play commands on the editor toolbar.
 */

const VIEW_ID = 'algoviz.visualizer';

const SUPPORTED_LANGUAGES: Record<string, 'c++' | 'javascript'> = {
  cpp: 'c++',
  c: 'c++',
  javascript: 'javascript',
  typescript: 'javascript',
  javascriptreact: 'javascript',
  typescriptreact: 'javascript',
};

type RunStatus = 'idle' | 'running' | 'ready' | 'error';

/** Messages the webview sends to the extension. */
type WebviewMessage =
  | { type: 'ready' }
  | { type: 'requestRun' }
  | { type: 'rerun' }
  | { type: 'stop' }
  | { type: 'openSettings' }
  | { type: 'revealLine'; line: number }
  | { type: 'reportIssue' }
  | {
      type: 'runState';
      status: RunStatus;
      error?: string;
      problems?: { line: number; message: string }[];
      output?: string[];
      total?: number;
    }
  | { type: 'step'; index: number; total: number; line: number; playing: boolean; inline?: string };

interface Session {
  uri: vscode.Uri;
  fileName: string;
  language: 'c++' | 'javascript';
  status: RunStatus;
  stale: boolean;
  index: number;
  total: number;
  line: number;
  playing: boolean;
  inline?: string;
}

let session: Session | undefined;
let provider: VisualizerViewProvider;
let statusBar: vscode.StatusBarItem;
let output: vscode.OutputChannel;
let diagnostics: vscode.DiagnosticCollection;

const stepDecoration = vscode.window.createTextEditorDecorationType({
  isWholeLine: true,
  backgroundColor: new vscode.ThemeColor('editor.stackFrameHighlightBackground'),
  overviewRulerColor: new vscode.ThemeColor('editorOverviewRuler.infoForeground'),
  overviewRulerLane: vscode.OverviewRulerLane.Full,
});

let gutterDecoration: vscode.TextEditorDecorationType;

const inlineDecoration = vscode.window.createTextEditorDecorationType({
  after: {
    margin: '0 0 0 2.5em',
    color: new vscode.ThemeColor('editorInlayHint.foreground'),
    fontStyle: 'italic',
  },
});

export function activate(context: vscode.ExtensionContext) {
  output = vscode.window.createOutputChannel('AlgoViz');
  diagnostics = vscode.languages.createDiagnosticCollection('algoviz');
  context.subscriptions.push(diagnostics);
  gutterDecoration = vscode.window.createTextEditorDecorationType({
    gutterIconPath: vscode.Uri.joinPath(context.extensionUri, 'media', 'step.svg'),
    gutterIconSize: 'contain',
  });

  provider = new VisualizerViewProvider(context.extensionUri);
  context.subscriptions.push(
    output,
    stepDecoration,
    gutterDecoration,
    inlineDecoration,
    vscode.window.registerWebviewViewProvider(VIEW_ID, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );

  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
  statusBar.name = 'AlgoViz';
  context.subscriptions.push(statusBar);
  refreshStatusBar();

  const register = (id: string, fn: (...args: any[]) => unknown) =>
    context.subscriptions.push(vscode.commands.registerCommand(id, fn));

  register('algoviz.visualizeCurrentFile', () => {
    const editor = vscode.window.activeTextEditor;
    const doc = editor?.document;
    if (doc && languageOf(doc)) {
      void startRun(doc, { reveal: true });
      return;
    }
    if (session) {
      void rerun({ reveal: true });
      return;
    }
    vscode.window.showInformationMessage('AlgoViz: open a C++ or JavaScript file to visualize it.');
  });
  // Kept so existing keybindings and docs that use the old command still work.
  register('algoviz.start', () => vscode.commands.executeCommand('algoviz.visualizeCurrentFile'));
  register('algoviz.rerun', () => rerun({ reveal: false }));
  register('algoviz.stepForward', () => provider.post({ type: 'control', action: 'next' }));
  register('algoviz.stepBack', () => provider.post({ type: 'control', action: 'prev' }));
  register('algoviz.play', () => provider.post({ type: 'control', action: 'play' }));
  register('algoviz.pause', () => provider.post({ type: 'control', action: 'pause' }));
  register('algoviz.stop', () => stopSession());
  register('algoviz.focus', () => provider.reveal(false));
  register('algoviz.openSettings', () =>
    vscode.commands.executeCommand('workbench.action.openSettings', '@ext:somyacodes.algoviz-vscode'),
  );
  register('algoviz.runToCursor', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !session || editor.document.uri.toString() !== session.uri.toString()) return;
    provider.post({ type: 'control', action: 'runToLine', line: editor.selection.active.line + 1 });
  });

  // ── Keep the editor and the trace in step ─────────────────────────────────
  context.subscriptions.push(
    vscode.window.onDidChangeVisibleTextEditors(() => applyDecorations()),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      provider.post({ type: 'activeFile', ...describeEditor(editor) });
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (!session || event.contentChanges.length === 0) return;
      if (event.document.uri.toString() !== session.uri.toString()) return;
      if (!session.stale) {
        session.stale = true;
        provider.post({ type: 'stale', stale: true });
        applyDecorations();
        refreshStatusBar();
      }
    }),
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (!session || doc.uri.toString() !== session.uri.toString()) return;
      if (!session.stale) return;
      if (config().get<boolean>('rerunOnSave', true)) void startRun(doc, { reveal: false, keepStep: true });
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      if (session && doc.uri.toString() === session.uri.toString() && doc.isUntitled) stopSession();
    }),
    vscode.debug.onDidChangeBreakpoints(() => sendBreakpoints()),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('algoviz')) {
        provider.post({ type: 'config', ...readConfig() });
        applyDecorations();
      }
    }),
  );

  void vscode.commands.executeCommand('setContext', 'algoviz.sessionActive', false);
}

export function deactivate() {
  session = undefined;
}

// ── Session lifecycle ───────────────────────────────────────────────────────

async function startRun(doc: vscode.TextDocument, options: { reveal: boolean; keepStep?: boolean }) {
  const language = languageOf(doc);
  if (!language) return;

  const sameFile = session?.uri.toString() === doc.uri.toString();
  diagnostics.clear();
  session = {
    uri: doc.uri,
    fileName: baseName(doc),
    language,
    status: 'running',
    stale: false,
    index: sameFile && options.keepStep ? session!.index : 0,
    total: 0,
    line: 0,
    playing: false,
  };
  await setSessionContext();
  applyDecorations();
  refreshStatusBar();

  await provider.reveal(!options.reveal);
  provider.post({
    type: 'run',
    code: doc.getText(),
    language,
    fileName: session.fileName,
    keepStep: !!options.keepStep && sameFile,
    ...readConfig(),
  });
  sendBreakpoints();
}

async function rerun(options: { reveal: boolean }) {
  if (!session) return;
  try {
    const doc = await vscode.workspace.openTextDocument(session.uri);
    await startRun(doc, { reveal: options.reveal, keepStep: true });
  } catch {
    stopSession();
  }
}

function stopSession() {
  session = undefined;
  diagnostics.clear();
  void setSessionContext();
  applyDecorations();
  refreshStatusBar();
  provider.post({ type: 'clear' });
  provider.post({ type: 'activeFile', ...describeEditor(vscode.window.activeTextEditor) });
}

async function setSessionContext() {
  await vscode.commands.executeCommand('setContext', 'algoviz.sessionActive', !!session);
  await vscode.commands.executeCommand('setContext', 'algoviz.playing', !!session?.playing);
  await vscode.commands.executeCommand(
    'setContext',
    'algoviz.boundPaths',
    session ? [session.uri.fsPath, session.uri.path] : [],
  );
}

function handleMessage(message: WebviewMessage) {
  switch (message.type) {
    case 'ready':
      return;
    case 'requestRun':
      void vscode.commands.executeCommand('algoviz.visualizeCurrentFile');
      return;
    case 'rerun':
      void rerun({ reveal: false });
      return;
    case 'stop':
      stopSession();
      return;
    case 'reportIssue':
      void vscode.env.openExternal(vscode.Uri.parse('https://github.com/somyacodes07/AlgoViz-copy/issues/new'));
      return;
    case 'openSettings':
      void vscode.commands.executeCommand('algoviz.openSettings');
      return;
    case 'revealLine':
      void revealLine(message.line);
      return;
    case 'runState': {
      if (!session) return;
      session.status = message.status;
      if (message.total !== undefined) session.total = message.total;
      if (message.status === 'error') {
        session.line = 0;
        session.inline = undefined;
      }
      if (message.output) writeProgramOutput(message.output, message.status === 'error' ? message.error : undefined);
      if (message.status === 'error' && message.problems?.length) showProblems(message.problems);
      applyDecorations();
      refreshStatusBar();
      return;
    }
    case 'step': {
      if (!session) return;
      const wasPlaying = session.playing;
      Object.assign(session, {
        index: message.index,
        total: message.total,
        line: message.line,
        playing: message.playing,
        inline: message.inline,
      });
      if (wasPlaying !== message.playing) {
        void vscode.commands.executeCommand('setContext', 'algoviz.playing', message.playing);
      }
      applyDecorations();
      refreshStatusBar();
      return;
    }
  }
}

/** Compile and runtime errors become squiggles in the editor and entries in the Problems panel. */
function showProblems(problems: { line: number; message: string }[]) {
  if (!session) return;
  const uri = session.uri;
  void vscode.workspace.openTextDocument(uri).then((doc) => {
    const items = problems
      .filter((p) => p.line >= 1 && p.line <= doc.lineCount)
      .map((p) => {
        const line = doc.lineAt(p.line - 1);
        const start = line.firstNonWhitespaceCharacterIndex;
        const diagnostic = new vscode.Diagnostic(
          new vscode.Range(p.line - 1, start, p.line - 1, Math.max(start + 1, line.text.length)),
          p.message,
          vscode.DiagnosticSeverity.Error,
        );
        diagnostic.source = 'AlgoViz';
        return diagnostic;
      });
    diagnostics.set(uri, items);
  });
}

function writeProgramOutput(lines: string[], error?: string) {
  if (!session) return;
  output.clear();
  output.appendLine(`▶ ${session.fileName}`);
  lines.forEach((line) => output.appendLine(line));
  if (error) output.appendLine(`✖ ${error}`);
}

// ── Editor integration ──────────────────────────────────────────────────────

function applyDecorations() {
  for (const editor of vscode.window.visibleTextEditors) {
    const bound = session && editor.document.uri.toString() === session.uri.toString();
    const showLine = bound && !session!.stale && session!.status !== 'running' && session!.line > 0;
    if (!showLine || session!.line > editor.document.lineCount) {
      editor.setDecorations(stepDecoration, []);
      editor.setDecorations(gutterDecoration, []);
      editor.setDecorations(inlineDecoration, []);
      continue;
    }
    const line = editor.document.lineAt(session!.line - 1);
    const range = new vscode.Range(line.range.start, line.range.start);
    editor.setDecorations(stepDecoration, [range]);
    editor.setDecorations(gutterDecoration, [range]);

    const inline = config().get<boolean>('inlineValues', true) ? session!.inline : undefined;
    editor.setDecorations(
      inlineDecoration,
      inline ? [{ range: line.range, renderOptions: { after: { contentText: inline } } }] : [],
    );

    if (config().get<boolean>('followExecution', true) && editor === vscode.window.activeTextEditor) {
      const visible = editor.visibleRanges.some((r) => r.contains(line.range.start));
      if (!visible) editor.revealRange(line.range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    }
  }
}

async function revealLine(lineNumber: number) {
  if (!session || lineNumber < 1) return;
  const doc = await vscode.workspace.openTextDocument(session.uri);
  const editor = await vscode.window.showTextDocument(doc, { preserveFocus: true, preview: false });
  const line = doc.lineAt(Math.min(lineNumber, doc.lineCount) - 1);
  editor.revealRange(line.range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
}

function sendBreakpoints() {
  if (!session) return;
  const target = session.uri.toString();
  const lines = vscode.debug.breakpoints
    .filter((bp): bp is vscode.SourceBreakpoint => bp instanceof vscode.SourceBreakpoint && bp.enabled)
    .filter((bp) => bp.location.uri.toString() === target)
    .map((bp) => bp.location.range.start.line + 1);
  provider.post({ type: 'breakpoints', lines });
}

function refreshStatusBar() {
  if (!session) {
    statusBar.text = '$(play-circle) AlgoViz';
    statusBar.tooltip = 'Visualize the active file (⌘⌥V / Ctrl+Alt+V)';
    statusBar.command = 'algoviz.visualizeCurrentFile';
    statusBar.show();
    return;
  }
  statusBar.command = 'algoviz.focus';
  if (session.status === 'running') {
    statusBar.text = `$(sync~spin) AlgoViz: tracing ${session.fileName}`;
    statusBar.tooltip = 'Running and recording every step';
  } else if (session.status === 'error') {
    statusBar.text = `$(error) AlgoViz: ${session.fileName}`;
    statusBar.tooltip = 'The run stopped with an error. Open the visualizer for details.';
  } else if (session.stale) {
    statusBar.text = `$(circle-filled) AlgoViz: ${session.fileName} changed`;
    statusBar.tooltip = config().get<boolean>('rerunOnSave', true)
      ? 'Save the file to re-run the visualization'
      : 'Run AlgoViz: Re-run to trace the new code';
  } else {
    const icon = session.playing ? '$(debug-pause)' : '$(debug-step-over)';
    statusBar.text = `${icon} Step ${session.index + 1}/${session.total} · line ${session.line}`;
    statusBar.tooltip = `AlgoViz is tracing ${session.fileName}`;
  }
  statusBar.show();
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function config() {
  return vscode.workspace.getConfiguration('algoviz');
}

function readConfig() {
  return {
    cppCompiler: config().get<'api' | 'wasm'>('cppCompiler', 'api'),
    speed: config().get<number>('playbackSpeed', 600),
  };
}

function languageOf(doc: vscode.TextDocument) {
  return SUPPORTED_LANGUAGES[doc.languageId];
}

function baseName(doc: vscode.TextDocument) {
  const parts = doc.uri.path.split('/');
  return parts[parts.length - 1] || 'untitled';
}

function describeEditor(editor: vscode.TextEditor | undefined) {
  const doc = editor?.document;
  if (!doc || doc.uri.scheme === 'output') return { fileName: null, language: null };
  return { fileName: baseName(doc), language: languageOf(doc) ?? null };
}

// ── Webview view ────────────────────────────────────────────────────────────

class VisualizerViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private ready = false;
  private queue: unknown[] = [];
  private readyWaiters: (() => void)[] = [];

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(view: vscode.WebviewView) {
    this.view = view;
    this.ready = false;
    const dist = vscode.Uri.joinPath(this.extensionUri, 'webview-ui', 'dist');
    view.webview.options = { enableScripts: true, localResourceRoots: [dist] };
    view.webview.html = this.html(view.webview, dist);
    view.webview.onDidReceiveMessage((message: WebviewMessage) => {
      if (message.type === 'ready') {
        this.ready = true;
        const pending = this.queue;
        this.queue = [];
        this.post({ type: 'config', ...readConfig() });
        this.post({ type: 'activeFile', ...describeEditor(vscode.window.activeTextEditor) });
        if (pending.length) pending.forEach((m) => this.post(m));
        else if (session) void rerun({ reveal: false }); // the view was reloaded mid-session
        this.readyWaiters.splice(0).forEach((resolve) => resolve());
        return;
      }
      handleMessage(message);
    });
    view.onDidDispose(() => {
      this.view = undefined;
      this.ready = false;
    });
  }

  post(message: unknown) {
    if (this.view && this.ready) void this.view.webview.postMessage(message);
    else if ((message as { type: string }).type === 'run') this.queue = [message];
    else if (this.queue.length) this.queue.push(message);
  }

  /** Make the sidebar view visible, keeping keyboard focus in the editor when asked. */
  async reveal(preserveFocus: boolean) {
    if (this.view) {
      this.view.show(preserveFocus);
      return;
    }
    const editor = vscode.window.activeTextEditor;
    await vscode.commands.executeCommand(`${VIEW_ID}.focus`);
    if (preserveFocus && editor) {
      await vscode.window.showTextDocument(editor.document, { viewColumn: editor.viewColumn, preserveFocus: false });
    }
  }

  private html(webview: vscode.Webview, dist: vscode.Uri) {
    let html: string;
    try {
      html = fs.readFileSync(vscode.Uri.joinPath(dist, 'webview', 'index.html').fsPath, 'utf8');
    } catch (e) {
      return `<!DOCTYPE html><html><body style="padding:12px;font-family:var(--vscode-font-family)">
        <p>AlgoViz could not load its view.</p>
        <p>Build it with <code>npm run build:webview</code>.</p>
        <p style="opacity:.7">${e instanceof Error ? e.message : String(e)}</p></body></html>`;
    }
    const nonce = getNonce();
    const assets = webview.asWebviewUri(vscode.Uri.joinPath(dist, 'assets'));
    const base = webview.asWebviewUri(dist).toString();
    html = html.replace(/(href|src)="\.\.?\/assets\//g, `$1="${assets}/`);
    const csp = [
      `default-src 'none'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `font-src ${webview.cspSource}`,
      `img-src ${webview.cspSource} data: https:`,
      // The tracer evaluates instrumented JS (new Function) and loads tree-sitter / clang wasm.
      `script-src 'nonce-${nonce}' ${webview.cspSource} 'unsafe-eval' 'wasm-unsafe-eval'`,
      `worker-src ${webview.cspSource} blob:`,
      `connect-src ${webview.cspSource} https:`,
    ].join('; ');
    html = html.replace(
      '<head>',
      `<head>\n<meta http-equiv="Content-Security-Policy" content="${csp}">\n<script nonce="${nonce}">window.__WEBVIEW_URI__ = "${base}";</script>`,
    );
    return html.replace(/<script(?![^>]*nonce)/g, `<script nonce="${nonce}"`);
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  return nonce;
}
