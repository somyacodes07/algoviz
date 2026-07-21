<div align="center">
  <img src="assets/homepage.png" alt="AlgoViz Logo" width="100%" style="border-radius: 12px; margin-bottom: 20px;" />

  # ⚡ AlgoViz

  **The ultimate interactive algorithm visualizer for JavaScript and C++**

  <p>
    <a href="https://github.com/somyacodes07/algoviz/stargazers"><img src="https://img.shields.io/github/stars/somyacodes07/algoviz?style=for-the-badge&color=ff7316" alt="Stars" /></a>
    <a href="https://github.com/sponsors/somyacodes07"><img src="https://img.shields.io/badge/Sponsor-%E2%9D%A4-pink?style=for-the-badge&logo=github" alt="Sponsor" /></a>
    <a href="https://marketplace.visualstudio.com/items?itemName=somyacodes.algoviz-vscode"><img src="https://img.shields.io/badge/VS%20Code-Extension-007acc?style=for-the-badge&logo=visualstudiocode" alt="VS Code Extension" /></a>
    <br/>
    <a href="."><img src="https://img.shields.io/badge/JavaScript-ES6+-f7df1e?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" /></a>
    <a href="."><img src="https://img.shields.io/badge/C++-WebAssembly_Engine-00599c?style=for-the-badge&logo=cplusplus&logoColor=white" alt="C++" /></a>
    <a href="."><img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React" /></a>
  </p>

  **Step through code line-by-line, inspect memory in real time, analyze time complexity, and build an intuition for data structures—all inside your browser.**
</div>

---

## 💖 Support the Project
AlgoViz is an open-source project built with passion. If this tool helped you nail an interview, ace a class, or understand complex algorithms better, consider sponsoring the development!
👉 **[Sponsor Somyajeet on GitHub](https://github.com/sponsors/somyacodes07)**

---

## ✨ What's New?

AlgoViz has been completely revamped with **Tier 2 & Tier 3 Data Structures** and a brand new **Glassmorphic UI**:
- 🌳 **New Visualizers**: Dynamic rendering for Binary Trees, Heaps, Hash Maps, Sets, Tries, Linked Lists, and 2D Arrays.
- 🗒️ **Sticky Note Annotations**: Attach persistent markdown notes to specific execution steps to explain the *why* behind your code.
- 🔍 **Zoomable Diagram Modal**: Expand complex graphs and trees into an interactive, pan-and-zoom full-screen modal.
- 🎨 **Neo-Brutalist & Glassmorphic UI**: A stunning new dark/light mode engine featuring floating elements, backdrop blurs, and animated transitions.

---

## 🚀 Features

- **Step-by-step Execution**: Play, pause, scrub, and step through your code's timeline.
- **Multi-Language Engine**: Run JavaScript natively or execute real C++ right in your browser via our WebAssembly Clang Engine.
- **Rich Data Visualizers**: Auto-magically renders memory structures like Vectors, Hash Maps, Sets, and multi-dimensional matrices.
- **Visual Call Stack**: Watch recursion unfold in real-time as stack frames push and pop.
- **Complexity Analysis**: Live O(n) estimation, hotspot heatmaps, and peak stack depth calculations.
- **Template Library**: 50+ built-in algorithms ranging from simple sorting to advanced dynamic programming and graph algorithms (`Cmd+K` palette).
- **Embed Mode**: Add `?embed=true` to embed the visualizer cleanly inside iframes or Notion docs.

---

## 💻 VS Code Extension

AlgoViz isn't just for the browser—it's right inside your editor!

- **Offline Execution**: Runs locally using the built-in Web Worker and WASM (Zero API calls).
- **Run Menu Integration**: Just click **AlgoViz: Visualize** from the editor's Play/Run dropdown menu.
- **Side-by-Side View**: Opens the visualizer in a split pane, pulling in your active code automatically.

**Download on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=somyacodes.algoviz-vscode)**

---

## 🖼️ Product Tour

### Workbench & Data Structure Galleries

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="assets/image-1.png" alt="JavaScript Timeline" />
      <p><strong>JavaScript Tracing</strong><br />Array pointer markers and variable tracking.</p>
    </td>
    <td width="50%" valign="top">
      <img src="assets/image-2.png" alt="C++ Bubble Sort" />
      <p><strong>C++ Execution</strong><br />Real GCC-powered compilation with STL container support.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="assets/image-3.png" alt="Call Stack" />
      <p><strong>Recursive Call Stack</strong><br />Trace deep DFS frames and parameter mutations.</p>
    </td>
    <td width="50%" valign="top">
      <img src="assets/image-4.png" alt="Graph State" />
      <p><strong>Graph & Tree Rendering</strong><br />Live snapshots of tree expansions and graph traversals.</p>
    </td>
  </tr>
</table>

---

## 🏗️ Architecture: The C++ Dual-Engine

AlgoViz uses a state-of-the-art dual-engine to execute C++ without servers.

### Primary: Wasm Clang Engine
- Compiles instrumented C++ **directly in the browser** using WebAssembly Clang.
- Runs completely locally (offline-capable, zero latency).
- Uses Tree-sitter AST to inject `__trace()` calls that generate JSON execution state.

### Fallback: Wandbox API
- If WebAssembly fails to load, the engine seamlessly falls back to the remote Wandbox API GCC compiler.

---

## 🧭 Documentation

Explore the inner workings of AlgoViz:
- [Introduction & Philosophy](docs/introduction.md)
- [Setup & Installation Guide](docs/setup-guide.md)
- [Features & UI Layouts](docs/features-and-ui.md)
- [C++ Execution Engine](docs/cpp-engine.md)
- [Instrumentation Sandbox](docs/instrumentation-sandbox.md)
- [Complexity Analysis](docs/complexity-analysis.md)
- [Template Library & Palette](docs/templates-and-palette.md)
- [Architecture Reference](docs/architecture.md)
- [VS Code Extension](docs/vscode-extension.md)

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/somyacodes07/algoviz.git
cd algoviz

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Visit `http://localhost:3000` to start visualizing!

---

## 🤝 Contributing & License

Contributions are always welcome. Open an issue to report bugs or suggest features, and submit Pull Requests with improvements.

AlgoViz is open source software licensed under the [MIT License](LICENSE).

<div align="center">
  <br/>
  <strong>Built with ❤️ by <a href="https://github.com/somyacodes07">Somyajeet Singh</a></strong>
  <br/>
  <br/>
  <a href="https://github.com/sponsors/somyacodes07"><img src="https://img.shields.io/badge/Sponsor_Me_On_GitHub-%E2%9D%A4-pink?style=for-the-badge&logo=github" alt="Sponsor Somyajeet" /></a>
</div>
