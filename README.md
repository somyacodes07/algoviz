<div align="center">

<img src="assets/homepage.png" alt="AlgoViz landing page: See how your code really works, next to a live fibonacci(6) call tree" width="100%" />

# AlgoViz

### Paste your JavaScript or C++. Watch it run, one line at a time.

Step through your own code in the browser and see every array, tree, graph, heap, stack and DP table change as it executes. No account, no install.

<p>
  <a href="https://algoviz.somyacodes.in"><img src="https://img.shields.io/badge/Try_it_live-algoviz.somyacodes.in-f97316?style=for-the-badge" alt="Try it live" /></a>
  <a href="https://github.com/somyacodes07/algoviz/stargazers"><img src="https://img.shields.io/github/stars/somyacodes07/algoviz?style=for-the-badge&color=facc15&labelColor=0f172a" alt="GitHub stars" /></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=somyacodes.algoviz-vscode"><img src="https://img.shields.io/badge/VS_Code-Extension-3b82f6?style=for-the-badge&logo=visualstudiocode" alt="VS Code extension" /></a>
</p>
<p>
  <a href="https://github.com/somyacodes07/algoviz/actions/workflows/ci.yml"><img src="https://github.com/somyacodes07/algoviz/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=somyacodes.algoviz-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/somyacodes.algoviz-vscode?label=marketplace" alt="Marketplace version" /></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=somyacodes.algoviz-vscode"><img src="https://img.shields.io/visual-studio-marketplace/i/somyacodes.algoviz-vscode" alt="Installs" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/somyacodes07/algoviz" alt="MIT license" /></a>
</p>

<img src="assets/demo/workbench.gif" alt="Dijkstra running in the AlgoViz workbench: the graph lights up node by node while distances update under each node" width="100%" />

</div>

---

## Why AlgoViz

- **It runs your code, not canned animations.** Paste any algorithm and AlgoViz traces it, line by line, in a sandbox in your browser.
- **It figures out what to draw.** Arrays, strings, grids, linked lists, trees, tries, graphs, heaps, stacks, queues, hash maps and tables of structs are detected from the shape of your data.
- **It shows what each line touches.** The cells a line reads and writes are marked, so `dp[i][j] = max(dp[i-1][j], dp[i][j-1])` finally makes sense.
- **JavaScript and C++.** C++ STL containers, `priority_queue`, pairs and your own structs all show up with real field names.

## See it in action

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="assets/screenshots/graph-dijkstra.png" alt="Dijkstra with each node's distance under it" />
      <p align="center"><strong>Graphs with live distances</strong><br />Weights, visited nodes, the current node, and what is still waiting in the queue.</p>
    </td>
    <td width="50%" valign="top">
      <img src="assets/screenshots/dp-lcs.png" alt="LCS DP table with read and written cells" />
      <p align="center"><strong>DP tables that explain themselves</strong><br />Rows and columns labelled with the strings; the written cell and the cells it reads are marked.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="assets/screenshots/tree-bst.png" alt="Binary search tree built by insert calls" />
      <p align="center"><strong>Trees that survive recursion</strong><br />The whole tree stays on screen while recursive calls work on a subtree.</p>
    </td>
    <td width="50%" valign="top">
      <img src="assets/image-1.png" alt="Bubble sort with pointer tags and read cells" />
      <p align="center"><strong>Arrays, cell by cell</strong><br />Pointer tags come from the variables your code really uses as indexes.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="assets/screenshots/cpp-bellman-dark.png" alt="C++ Bellman-Ford with a vector of Edge structs shown as a table" />
      <p align="center"><strong>C++ structs as tables</strong><br /><code>vector&lt;Edge&gt;</code> shows <code>u</code>, <code>v</code> and <code>w</code> with their real names.</p>
    </td>
    <td width="50%" valign="top">
      <img src="assets/image-3.png" alt="Call stack during a recursive depth-first search" />
      <p align="center"><strong>The call stack, frame by frame</strong><br />Every recursive call with its own local variables.</p>
    </td>
  </tr>
</table>

<div align="center">
  <img src="assets/demo/fibonacci.gif" alt="The landing page runs fibonacci(6) and lights up its call tree" width="100%" />
  <p><em>The landing page runs <code>fibonacci(6)</code> live. Tap any node to jump to that call.</em></p>
</div>

## Works on your phone

<div align="center">
  <img src="assets/screenshots/phone.png" alt="AlgoViz on a phone: the landing page and the Fibonacci debugger" width="70%" />
</div>

## Features

| | |
|---|---|
| **Timeline** | Play, pause, step forward and back, scrub, and change speed. Set breakpoints by clicking the gutter. |
| **Data structures** | Array, string, grid, linked list, tree, trie, graph, heap, stack, queue, priority queue, hash map, table. |
| **Read / write marks** | The cells the current line reads (dashed) and writes (filled) are highlighted. |
| **Call stack** | Each frame with its own variables, so recursion is readable. |
| **Complexity** | Big-O estimates with a heatmap of the hottest lines. Estimates are guidance, not proofs. |
| **Templates** | Press `Cmd/Ctrl + K` for 80+ ready-made algorithms in JavaScript and C++: sorting, DP, graphs, trees and more. |
| **Share and embed** | Share a link that carries your code, or embed the workbench with `?embed=true`. |
| **Annotations** | Pin notes to specific steps to build a walkthrough. |
| **VS Code** | A sidebar that highlights the running line in your own editor, asks for `cin` input, and works offline. |

## Try it

**In the browser:** open [algoviz.somyacodes.in](https://algoviz.somyacodes.in), pick `index.js` or `main.cpp`, and press **Run**.

**In VS Code:** install [AlgoViz](https://marketplace.visualstudio.com/items?itemName=somyacodes.algoviz-vscode), open a `.cpp` or `.js` file, and press **⌘⌥V** (Ctrl+Alt+V on Windows/Linux). The running line lights up in your editor, and the AlgoViz sidebar draws your data structures.

<div align="center">
  <img src="algoviz-extension/media/demo.gif" alt="AlgoViz in VS Code stepping through bubble sort" width="100%" />
</div>

**Locally:**

```bash
git clone https://github.com/somyacodes07/algoviz.git
cd algoviz
npm install
npm run dev
```

Then open `http://localhost:3000`.

## How it works

```mermaid
graph LR
    A[Your code] --> B{Language}
    B -->|JavaScript| C[Acorn instrumenter + Web Worker]
    B -->|C++| D[Tree-sitter instrumenter + Wasm Clang or Wandbox]
    C --> E[Step timeline]
    D --> E
    E --> F[Structure detector]
    F --> G[Diagrams, call stack, complexity]
```

Your code is instrumented to record every variable at every step, run in a sandbox, and replayed as a timeline. A detector then decides, for each variable, which single diagram fits its shape.

- **Frontend:** React 19, Vite, Monaco Editor, Tailwind CSS, Framer Motion, GSAP and WebGL on the landing page.
- **JavaScript:** Acorn instrumentation, run in a Web Worker with a step limit.
- **C++:** Tree-sitter instrumentation, compiled with WebAssembly Clang on your machine, or remotely with GCC.

## Documentation

- [Introduction](docs/introduction.md)
- [Setup guide](docs/setup-guide.md)
- [Features and UI](docs/features-and-ui.md)
- [C++ engine](docs/cpp-engine.md)
- [Instrumentation sandbox](docs/instrumentation-sandbox.md)
- [Complexity analysis](docs/complexity-analysis.md)
- [Templates and palette](docs/templates-and-palette.md)
- [Architecture](docs/architecture.md)
- [VS Code extension](docs/vscode-extension.md)

## Contributing

Bug reports, ideas and pull requests are welcome. If a data structure shows up wrong, please [open an issue](https://github.com/somyacodes07/algoviz/issues/new/choose) with the code you ran; those reports are the fastest way to make detection better.

Read the [contributing guide](CONTRIBUTING.md) for setup, the project layout and the checks to run. Everyone taking part follows the [code of conduct](CODE_OF_CONDUCT.md). To report a security problem, see [SECURITY.md](SECURITY.md).

What changed and when: [CHANGELOG.md](CHANGELOG.md).

## Support

AlgoViz is free and open source. If it helped you learn, teach or pass an interview, a ⭐ on this repo helps more people find it, and you can [sponsor the project](https://github.com/sponsors/somyacodes07).

## License

[MIT](LICENSE) © Somyajeet Singh. Teaching with AlgoViz? See [CITATION.cff](CITATION.cff) for how to cite it.

<div align="center">
  <br />
  Made by <a href="https://github.com/somyacodes07"><strong>Somyajeet Singh</strong></a>
</div>
