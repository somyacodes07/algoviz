// Runs inside VS Code: visualize each file in ALGOVIZ_SMOKE_FILES and record what the sidebar reports.
const vscode = require('vscode');
const fs = require('fs');

exports.run = async function () {
  const out = process.env.ALGOVIZ_SMOKE_OUT;
  const log = (o) => fs.appendFileSync(out, JSON.stringify(o) + '\n');
  for (const file of (process.env.ALGOVIZ_SMOKE_FILES || '').split(':').filter(Boolean)) {
    try {
      const doc = await vscode.workspace.openTextDocument(file);
      await vscode.window.showTextDocument(doc);
      const t0 = Date.now();
      await vscode.commands.executeCommand('algoviz.visualizeCurrentFile');
      let state = null;
      for (let i = 0; i < 90; i++) {
        await new Promise((r) => setTimeout(r, 500));
        state = await vscode.commands.executeCommand('algoviz._state');
        if (state && state.status !== 'running') break;
      }
      await vscode.commands.executeCommand('algoviz.stepForward');
      await new Promise((r) => setTimeout(r, 500));
      const after = await vscode.commands.executeCommand('algoviz._state');
      const problems = vscode.languages.getDiagnostics(doc.uri).map((d) => `${d.range.start.line + 1}: ${d.message}`);
      log({ file: file.split('/').pop(), ms: Date.now() - t0, status: state && state.status, total: state && state.total, stepAfter: after && after.index, problems });
    } catch (e) {
      log({ file, error: String((e && e.stack) || e) });
    }
  }
};
