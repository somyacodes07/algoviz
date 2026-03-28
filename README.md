<div align="center">

# ⚡ AlgoViz

### Interactive algorithm execution for JavaScript and C++

**Step through code line-by-line, inspect variables in real time, follow the call stack, and replay console output inside a browser workbench.**

[![Made by Somyajeet](https://img.shields.io/badge/Made%20by-Somyajeet-ff7316?style=for-the-badge)](https://github.com/ssgamingop)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)](.)
[![C++](https://img.shields.io/badge/C++-Beta-00599c?style=for-the-badge&logo=cplusplus&logoColor=white)](.)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](.)

</div>

---

## 🎯 What Is AlgoViz?

AlgoViz is a browser-based code visualizer built for students, educators, and anyone who wants to understand runtime behavior instead of only final output.

You can write **JavaScript** or a **DSA-focused C++ subset**, run the program, and then scrub through execution like a timeline:

- See the active line move through the editor
- Watch variables mutate step-by-step
- Track recursion and nested calls in the call stack
- Replay console output exactly when it appears
- Teach search, sorting, graph, and pointer-heavy problems visually

---

## 🧭 Documentation

AlgoViz now includes a richer in-product docs experience plus markdown source docs in the repo:

- [Introduction & Philosophy](docs/introduction.md)
- [Setup & Installation Guide](docs/setup-guide.md)
- [Features & UI Layouts](docs/features-and-ui.md)
- [C++ Transpiler Engine](docs/cpp-engine.md)
- [Instrumentation Sandbox](docs/instrumentation-sandbox.md)
- [Template Library & Palette](docs/templates-and-palette.md)

These docs explain how the UI works, how C++ is achieved in the browser, and how the tracing pipeline stays safe and replayable.

---

## 🖼️ Product Tour

### Landing Experience

<div align="center">
  <img src="assets/homepage.png" alt="AlgoViz landing page with interactive launch options for JavaScript, C++, and documentation." width="900" />
</div>

### Workbench Gallery

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="assets/image-1.png" alt="JavaScript reverse array example in AlgoViz showing variable cards, pointer tags, and timeline playback." />
      <p>
        <strong>JavaScript state tracing</strong><br />
        Reverse-array execution with live pointer markers and variable updates.
      </p>
    </td>
    <td width="50%" valign="top">
      <img src="assets/image-2.png" alt="C++ bubble sort running in AlgoViz with highlighted lines and variable visualization." />
      <p>
        <strong>Browser C++ execution</strong><br />
        Bubble sort flowing through the C++ parser, transformer, and replay pipeline.
      </p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="assets/image-3.png" alt="AlgoViz call stack view focused on recursive depth-first search frames." />
      <p>
        <strong>Recursive call stack replay</strong><br />
        Stack frames stay readable while DFS expands through nested calls.
      </p>
    </td>
    <td width="50%" valign="top">
      <img src="assets/image-4.png" alt="AlgoViz variables panel showing visited and result arrays updating during graph traversal." />
      <p>
        <strong>Data structure snapshots</strong><br />
        Graph traversal state shown as evolving arrays and tracked values.
      </p>
    </td>
  </tr>
</table>

---

## ✨ Core Features

| Feature | Description |
|---|---|
| 🔬 **Step-by-step execution** | Play, pause, scrub, and move line-by-line through the program timeline |
| 📊 **Live variables panel** | Inspect scalars, arrays, and tracked values as state changes |
| 🎯 **Pointer visualization** | Follow indices like `i`, `j`, `left`, `right`, and `mid` visually |
| 📚 **Call stack view** | Watch frames push and pop during recursion and nested calls |
| 💻 **Console replay** | See `console.log` and `cout` output appear at the exact step it is emitted |
| 🧠 **Template palette** | Load tagged DSA examples quickly through the searchable template library |
| 🟧 **JavaScript mode** | Great for loops, recursion, arrays, objects, and interview-style problems |
| 🔵 **C++ mode (Beta)** | DSA-oriented C++ support powered by a Tree-sitter-based browser transpiler |
| 📖 **Integrated docs route** | Architecture, setup, UI, templates, transpilation, and sandbox details |
| 🌐 **Static multi-route build** | Home, docs, and visualizer pages are emitted as crawlable static routes |

---

## 🏗️ How Browser C++ Works

AlgoViz does not ship a full native compiler pipeline to the browser. Instead, it uses a runtime designed for visibility:

1. **Parse**  
   Tree-sitter WebAssembly parses the supported C++ subset into a structural syntax tree.

2. **Transform**  
   The transpiler maps DSA-friendly C++ patterns like vectors, loops, integer math, and common STL-style operations into JavaScript shapes the browser can execute safely.

3. **Instrument**  
   Trace hooks are injected so line progress, variable state, stack entries, and console output become observable.

4. **Execute in a Web Worker**  
   Instrumented code runs off the main thread to protect the UI and to keep replay deterministic.

5. **Replay in React**  
   The frontend consumes the generated timeline and renders the editor, variables panel, call stack, and console as one synchronized view.

This makes C++ *teachable* in the browser, not just runnable.

---

## 🧱 Project Structure

```text
algoviz/
├── App.tsx
├── README.md
├── docs/                          # Markdown documentation source
├── public/                        # Static assets, icons, wasm payloads
├── visualizer/                    # Static route entry points
│
├── backend/
│   └── sandbox/
│       ├── runtime/
│       │   ├── executor.ts
│       │   └── executor.worker.ts
│       ├── transpiler/
│       │   ├── parser.ts
│       │   ├── transformer.ts
│       │   ├── generator.ts
│       │   └── index.ts
│       └── legacy/
│           └── regexTranspiler.ts
│
├── frontend/
│   ├── components/
│   │   ├── HomePage.tsx
│   │   ├── DocsPage.tsx
│   │   ├── CodeEditor.tsx
│   │   ├── VariablesPanel.tsx
│   │   ├── CallStackPanel.tsx
│   │   ├── ConsolePanel.tsx
│   │   ├── Controls.tsx
│   │   ├── TemplatePalette.tsx
│   │   └── LandingInteractiveBackdrop.tsx
│   └── hooks/
│
└── assets/                        # README screenshots and product imagery
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+

### Installation

```bash
git clone https://github.com/ssgamingop/algoviz.git
cd algoviz
npm install
npm run dev
```

The app runs locally at `http://localhost:3000`.

### Production Build

```bash
npm run build
npm run preview
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | UI and route-driven app shell |
| **TypeScript** | Type safety across frontend and transpiler code |
| **Vite** | Dev server and production build |
| **Monaco Editor** | Code editing surface |
| **Framer Motion** | UI motion and route transitions |
| **Acorn** | JavaScript AST instrumentation |
| **web-tree-sitter** | Browser parsing for the C++ engine |
| **React Markdown + remark-gfm** | Rendered docs experience |
| **Lucide React** | Iconography |

---

## 📝 Typical Workflow

1. Open the landing page and choose **JavaScript** or **C++**.
2. Write code or load a template from the palette.
3. Click **Run**.
4. Step through the timeline with playback controls.
5. Inspect variables, pointers, console output, and the call stack as the program evolves.
6. Open the docs route when you want the architecture behind the visualizer.

---

## 🤝 Contributing

Contributions are welcome.

- Report bugs through [Issues](https://github.com/ssgamingop/algoviz/issues)
- Suggest features or docs improvements
- Open a pull request with focused changes

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built by [Somyajeet Singh](https://github.com/ssgamingop) with ❤️**

*AlgoViz is designed to make runtime behavior visible.*

</div>
