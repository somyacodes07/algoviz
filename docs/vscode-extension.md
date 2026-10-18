# VS Code Extension

AlgoViz can be used directly inside your Visual Studio Code editor, providing a visualization experience right next to your codebase.

## Installation

1. Open **Visual Studio Code** (or VSCodium).
2. Go to the **Extensions** view (`Cmd+Shift+X` on Mac, `Ctrl+Shift+X` on Windows/Linux).
3. Search for **AlgoViz** (or publisher `somyacodes`).
4. Click **Install**.

*Alternatively, you can install it directly from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=somyacodes.algoviz-vscode) or the [Open VSX Registry](https://open-vsx.org/extension/somyacodes/algoviz-vscode).*

## How to Use

### Method 1: Editor Run Menu (Recommended)
1. Open a `.js`, `.jsx`, `.ts`, `.tsx`, `.c`, or `.cpp` file in your editor.
2. Click the **Play button dropdown** (Run menu) in the top-right corner of the editor.
3. Select **`AlgoViz: Visualize Active File`**.
4. The visualizer will automatically open in a split pane, pulling in your active code and detecting the language!

### Method 2: Command Palette
1. Open your command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`).
2. Type and select **`AlgoViz: Open Visualizer Workbench`**.
3. The AlgoViz workbench will open in a new editor tab next to your current files.
4. You can now write or paste your code inside the visualization window.

Once open, simply click **Play/Run** to see the magic happen!

## Offline Execution

JavaScript execution runs locally in a web worker. C++ uses the compiler strategy selected in Settings. The current default is Wandbox, which sends instrumented source to a remote service; choose Local Wasm Clang for browser-side compilation. Wasm can run offline after its compiler bundle is available, but may fall back to Wandbox if initialization fails.

The extension includes the workbench, execution timeline, complexity estimates, variable inspection, and call stack views. The webview synchronizes edits from the active supported editor after a short debounce. JavaScript and TypeScript files use the JavaScript engine; C and C++ files use the C++ engine.

The editor context menu and automatic activation support `.js`, `.jsx`, `.ts`, `.tsx`, `.c`, and `.cpp` files. The extension package version is **1.2.0**. Check the [extension changelog](../algoviz-extension/CHANGELOG.md) for release notes.

The extension runs the same responsive workbench as the website. On narrow panels, use the **Code** and **Workspace** switcher to give the editor or visualization the full available width. The workspace panel selector can show Variables, Call stack, Complexity, or a detected diagram; Variables appears automatically when no diagram is available.
