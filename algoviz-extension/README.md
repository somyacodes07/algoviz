<div align="center">
  <img src="https://raw.githubusercontent.com/somyacodes07/AlgoViz-copy/main/public/icon-512.png" alt="AlgoViz Logo" width="120" />
  <h1>AlgoViz for VS Code</h1>
  <p><em>See how your code really works, right inside your IDE.</em></p>
</div>

---

**AlgoViz** is an interactive code visualizer that helps you stop guessing and start understanding. By bringing the AlgoViz environment directly into VS Code, you can trace logic, inspect memory, and watch algorithms compute without ever leaving your editor.

## ✨ Features

- **Multi-Language Support**: Trace and visualize execution for JavaScript and C++ seamlessly.
- **Step-by-Step Debugging**: Pause execution, step forwards or backwards, and watch variables mutate exactly when lines evaluate.
- **Visual Call Stack**: Demystify recursion and nested function calls by seeing the stack grow and shrink in real-time.
- **Run Menu Integration**: Select **AlgoViz: Visualize** directly from your editor's Run/Play dropdown to instantly visualize the current file.
- **Zero API Calls**: Execution runs locally within your IDE context, meaning you don't need to send your code to external servers for visualization.
- **100% Offline Capability**: Runs directly inside VS Code's robust webview.

## 🚀 How to Use

### Method 1: Editor Run Menu (Recommended)
1. Open any `.js` or `.cpp` file in your editor.
2. Click the **Play button dropdown** (Run menu) in the top-right corner of the editor.
3. Select **`AlgoViz: Visualize`**.
4. The visualizer will open in a split pane, automatically importing your code and language!

### Method 2: Command Palette
1. Open your command palette (`Cmd+Shift+P` on Mac or `Ctrl+Shift+P` on Windows/Linux).
2. Type **`AlgoViz: Open Visualizer Workbench`** and hit Enter.
3. The AlgoViz workbench will open in a new split panel.
4. Simply write your code in the visualizer's editor or copy-paste it from your current workspace.

Once the visualizer is open:
- Click the **Play/Run** button to generate the execution timeline!
- Use the playback controls (Step Forward, Step Back, Play, Pause) to walk through the algorithm.

## 🛠 Supported Languages
- JavaScript (Node.js/ES6)
- C++ (Beta - STL support via local AST transpilation)

## 🤝 Contributing

This extension is open source and powered by the [AlgoViz](https://algoviz.somyacodes.in) project. 
If you find a bug or want to request a feature, please feel free to [open an issue](https://github.com/somyacodes07/AlgoViz-copy/issues) or contribute on GitHub!

---
**Happy Visualizing!** 🚀
