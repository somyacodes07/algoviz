# Changelog

All notable changes to the **AlgoViz** VS Code extension will be documented in this file.

## [2.3.0] — 2026-11-24

### ✨ New
- **Program input.** Programs that read with `cin`, `getline` or `prompt()` now ask for input before running. The Input box lists the lines that read input, and the values are remembered per file. Commented-out reads are ignored.
- **Works offline by default.** C++ now compiles on your computer with the bundled WebAssembly Clang (`algoviz.cppCompiler` now defaults to `wasm`). The remote GCC compiler is still available as `api`.
- **Native trees, linked lists, graphs, maps, stacks and heaps.** These are now drawn in the editor's style, like arrays already were.
  - Pointers like `head`, `prev` and `curr` are tagged on a single shared chain instead of drawing one copy per pointer.
  - BFS/DFS show visited and waiting nodes, plus `dist` values under each node.

### 🐛 Fixes
- **Loops no longer skip ahead.** Every loop iteration and every `if` check is now its own step (bubble sort of 8 items: 19 → 82 steps), including one-line loop bodies without braces. This applies to both C++ and JavaScript.
- `int arr[100];` without an initializer is now traced. Big fixed arrays show only the slots in use (the first `n`).
- Step descriptions and inline values name the field that changed (`q.rear = 3`) instead of "q changed to Object".
- Compile errors from the local Clang engine are parsed correctly (colour codes removed, lines mapped to your file).
- C++ programs that loop forever stop after 3000 steps with a message instead of hanging.

## [2.2.0] — 2026-11-23

### ✨ New visualizations
- Arrays, grids and objects are now drawn in the editor's own style: monospace cells, index labels, and theme colours.
- Index variables (`i`, `j`, `front`, `rear`, `top`…) appear as markers under the cells they point at and slide when they move.
- Swapped values glide to their new places, and bars above numeric arrays grow or shrink.
- Class-based structures such as `class Queue { int data[]; int front, rear; }` are drawn with their fields. Slots outside the live range (before `front`, after `rear`, above `top`) are hatched.
- Inside member functions, the object's fields are traced as `this`, so a queue or stack class can be followed step by step.
- Inline values name the changed fields, e.g. `rear = 2`, `data[2] = 30`.

### 🐛 Fixes
- The view no longer stays blank if it fails to start: it shows a message asking you to reload the window, and any view error is written to the AlgoViz output channel.
- The "Executed via …" engine banners are no longer shown in Output.

## [2.1.0] — 2026-11-23

### 🐛 Fixes
- **C arrays now trace in C++.** Files with plain arrays such as `int arr[10]` failed with an "ambiguous `__to_json`" compiler error, even though they compile normally.
- **Array parameters show their contents.** In `void sort(int arr[], int n)` the parameter is now drawn as an array of `n` elements instead of a pointer.

### ✨ Improved
- Errors appear as a short card (title, message, the lines involved) instead of raw compiler output. The full compiler output is still available under "Compiler output".
- Compile and runtime errors are underlined in your editor and listed in the Problems panel.
- When the problem is in AlgoViz's own tracing code, the card says your code is fine and links to the issue tracker.
- New timeline with breakpoint marks, "Step N of M · Line L", and a status pill (Paused, Playing, Finished, Changed, Error).
- Arrays of up to 16 elements fit the sidebar width without scrolling. Diagram labels use calmer type.
- Inline values show swaps as `swap arr[7] ⇄ arr[8]`.
- The Stop and Settings buttons are no longer repeated inside the view (they are in the view's title bar).

## [2.0.0] — 2026-11-23

The extension no longer opens the AlgoViz website in an editor tab. It now works as part of the editor.

### ✨ New
- **AlgoViz sidebar view** with its own Activity Bar icon. It holds playback controls, a step scrubber, a plain-language description of each step, and collapsible Visualization, Variables, Call Stack, Output and Complexity sections. It uses your VS Code colour theme and fonts.
- **Your own editor is the code editor.** The executing line is highlighted in the file you're editing, with a gutter marker, and the values that changed at that step appear at the end of the line.
- **Editor toolbar controls** (step back, play/pause, step forward, stop) show on the file being visualized.
- **Keyboard stepping**: ⌘⌥→ / ⌘⌥← (Ctrl+Alt on Windows/Linux), play/pause with ⌘⌥P, and **Run to Cursor** with ⌘⌥↵.
- **Gutter breakpoints**: breakpoints set in the editor gutter pause playback.
- **Re-run on save**: editing marks the trace as out of date, and saving traces the file again on the same step.
- Program output is also written to the **AlgoViz** output channel, and the status bar shows the current step.
- Settings: `algoviz.cppCompiler`, `algoviz.rerunOnSave`, `algoviz.inlineValues`, `algoviz.followExecution`, `algoviz.playbackSpeed`.

### 🔁 Changed
- Removed the "Open Visualizer Workbench" webview tab; `algoviz.start` now does the same as **Visualize Active File**.
- The whole document is traced so that line numbers match the editor.

## [1.2.0] — 2026-10-18

### 🐛 Bug Fixes
- **Reliable editor synchronization** — Debounced updates now read the current active editor and verify that it still matches the edited document before sending code to the workbench.
- **Complete TypeScript activation** — TypeScript, JavaScript React, and TypeScript React files now activate the extension and expose the editor context action, matching the languages already supported by the sync logic.
- **Safe shutdown** — Pending editor synchronization is canceled when the extension deactivates.

### 📦 Release
- Bumped the extension package version to `1.2.0`.

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
