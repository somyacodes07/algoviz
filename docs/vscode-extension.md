# VS Code Extension

AlgoViz can be used directly inside your Visual Studio Code editor, providing an offline, seamless visualization experience right next to your codebase. 

## Installation

1. Download the **`.vsix`** file from our [GitHub Repository](https://github.com/ssgamingop/AlgoViz/tree/main/algoviz-extension) (or search for AlgoViz in the VS Code Marketplace once published).
2. Open **Visual Studio Code**.
3. Go to the **Extensions** view (`Cmd+Shift+X` on Mac, `Ctrl+Shift+X` on Windows/Linux).
4. Click the `...` menu at the top right of the Extensions panel and select **Install from VSIX...**.
5. Select the downloaded `.vsix` file.

## How to Use

1. Open your command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`).
2. Type and select **`AlgoViz: Start Visualization`**.
3. The AlgoViz workbench will open in a new editor tab next to your current files.
4. You can now write or paste your code inside the visualization window and click **Play/Run**. 

## Offline Execution

One of the major benefits of using the VS Code extension is that **no external API calls are made**. 

When you run C++ or JavaScript code inside the extension:
- **JavaScript** code is instrumented and executed inside a secure web worker entirely within the VS Code Webview context.
- **C++** code is seamlessly transpiled to JavaScript using our built-in AST tools and executed locally, allowing you to visualize DSA logic without needing `g++` or a network connection.

All the features of AlgoViz (Complexity Analysis, Variable Watch, Call Stack) are fully functional offline!
