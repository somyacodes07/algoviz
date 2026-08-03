# Changelog

All notable changes to the **AlgoViz** VS Code extension will be documented in this file.

## [1.1.0] — 2026-08-03

### 🐛 Bug Fixes
- **Fixed fragile asset path resolution** — Webview now correctly resolves both `./assets/` and `../assets/` relative paths emitted by Vite, preventing broken scripts/styles in certain build configurations.
- **Fixed esbuild error handler crash** — Build errors without file location info (e.g., config errors) no longer crash the build process with a null pointer.
- **Fixed stale status bar item on deactivation** — `deactivate()` now properly disposes of the status bar item to prevent memory leaks.
- **Fixed editor context race condition** — Active editor tab switch handler now guards against disposed editors to prevent intermittent crashes.
- **Fixed README command name** — Documentation now correctly references "AlgoViz: Open Visualizer Workbench" (was incorrectly listed as "Start Visualization").

### 🔒 Security
- **Added Content Security Policy (CSP)** — Webview now injects a proper CSP meta tag with nonces, following VS Code security best practices to prevent XSS attacks.

### ✨ Improvements
- **Added panel visibility handler** — Webview panel now re-sends pending context when the tab becomes visible again (e.g., after switching tabs and back), improving reliability.
- **Improved error diagnostics** — Webview load failure now shows the actual error message instead of a generic instruction.
- **Dramatically reduced VSIX package size** — Updated `.vscodeignore` to properly exclude `node_modules/`, build configs, lock files, and stale artifacts.

### 🗑️ Removed
- Removed stale `algoviz-vscode-1.0.0.vsix` artifact from the repository.

---

## [1.0.0] — 2026-07-31

### 🎉 Initial Release
- Multi-language support: JavaScript (ES6) and C++ (Beta).
- Step-by-step execution timeline with play/pause/step controls.
- Visual call stack and variable inspector.
- Real-time code sync from active VS Code editor.
- Run menu integration with editor context menu.
- Keyboard shortcut `Cmd+Alt+V` (Mac) / `Ctrl+Alt+V` (Windows/Linux).
- Status bar quick-launch button.
- 100% offline — no API calls or external servers.
