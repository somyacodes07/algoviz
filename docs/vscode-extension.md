# VS Code Extension

AlgoViz can be used directly inside your Visual Studio Code editor, providing an offline, seamless visualization experience right next to your codebase. 

## Installation

1. Open **Visual Studio Code** (or VSCodium).
2. Go to the **Extensions** view (`Cmd+Shift+X` on Mac, `Ctrl+Shift+X` on Windows/Linux).
3. Search for **AlgoViz** (or publisher `somyacodes`).
4. Click **Install**.

*Alternatively, you can install it directly from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=somyacodes.algoviz-vscode) or the [Open VSX Registry](https://open-vsx.org/extension/somyacodes/algoviz-vscode).*

## How to Use

### Method 1: Editor Run Menu (Recommended)
1. Open any `.js` or `.cpp` file in your editor.
2. Click the **Play button dropdown** (Run menu) in the top-right corner of the editor.
3. Select **`AlgoViz: Visualize`**.
4. The visualizer will automatically open in a split pane, pulling in your active code and detecting the language!

### Method 2: Command Palette
1. Open your command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`).
2. Type and select **`AlgoViz: Start Visualization`**.
3. The AlgoViz workbench will open in a new editor tab next to your current files.
4. You can now write or paste your code inside the visualization window.

Once open, simply click **Play/Run** to see the magic happen!

## Offline Execution

One of the major benefits of using the VS Code extension is that **no external API calls are made**. 

When you run C++ or JavaScript code inside the extension:
- **JavaScript** code is instrumented and executed inside a secure web worker entirely within the VS Code Webview context.
- **C++** code is natively compiled in the browser via WebAssembly Clang (Wasm Clang) and executed locally, allowing you to visualize complex C++ logic with full STL support without needing `g++` or a network connection.

All the features of AlgoViz (Complexity Analysis, Variable Watch, Call Stack) are fully functional offline!
