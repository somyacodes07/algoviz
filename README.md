<div align="center">

# ⚡ AlgoViz

### Master Algorithms with Visual Execution

**Step through your code line-by-line. Watch variables update in real-time. Understand the call stack.**

[![Made by Somyajeet](https://img.shields.io/badge/Made%20by-Somyajeet-ff7316?style=for-the-badge)](https://github.com/ssgamingop)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)](.)
[![C++](https://img.shields.io/badge/C++-Beta-00599c?style=for-the-badge&logo=cplusplus&logoColor=white)](.)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](.)

</div>

---

## 🎯 What is AlgoViz?

**AlgoViz** is an interactive code execution visualizer built for educators and students. Write code in **JavaScript** or **C++**, hit **Run**, and watch the execution unfold step-by-step — variables changing, the call stack growing, and console output appearing — all in real-time.

It's the perfect companion for:
- 📚 **Learning DSA** — Visualize how sorting algorithms, recursion, and loops actually work
- 🎓 **Teaching programming** — Show students exactly what happens under the hood
- 🐛 **Debugging logic** — Step forward and backward to find where things go wrong

---

## 📖 Comprehensive Documentation

AlgoViz features a highly detailed, multi-page architectural documentation site:
- **[Introduction & Philosophy](docs/introduction.md)**
- **[Setup & Installation Guide](docs/setup-guide.md)**
- **[Features & UI Layouts](docs/features-and-ui.md)**
- **[Educational Template Library & Palette](docs/templates-and-palette.md)**
- **[WebAssembly C++ AST Engine](docs/cpp-engine.md)**
- **[Instrumentation Sandbox (JS VM)](docs/instrumentation-sandbox.md)**

Explore these pages to learn exactly how AlgoViz safely executes dynamic languages and visualizes massive execution stacks in the browser.

<div align="center">

### 🏠 Home Page
<img src="assets/homepage.png" alt="AlgoViz Home Page" width="800" />

### 🖥️ Editor View
<img src="assets/editor.png" alt="AlgoViz Editor" width="800" />

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔬 **Step-by-step execution** | Play, pause, step forward/backward through every line |
| 📊 **Live variable panel** | See all variables update in real-time with change indicators (↑↓), new badges, and loop detection |
| 🎯 **Algorithmic Pointers** | Automatically tracks array variables like \`i\`, \`j\`, \`mid\` with green graphical floating tags |
| 📚 **Call stack visualization** | Watch functions push and pop from the call stack |
| 💻 **Console output** | See `console.log` / `cout` output appear at each step |
| 🎨 **Monaco Editor** | Full-featured code editor with syntax highlighting (same editor as VS Code) |
| 🏛️ **Neo-Brutalist Themes** | Toggle between striking dark and light "Developer's Workbench" visual palettes |
| ⏩ **Speed control** | Adjust execution speed from slow-motion to fast |
| 🗂️ **Template Library** | Built-in library of 35+ fully-commented JS & C++ DSA templates with searchable tags |
| 🟧 **JavaScript (ES6+)** | Full support for modern JavaScript with functions, closures, arrays, objects |
| 🔵 **C++ (Beta)** | Powered by a custom **Tree-sitter AST Transpiler** to flawlessly map vector math, queues, & structs to JS |

---

## 🏗️ How It Works

AlgoViz uses a clever **3-stage pipeline** to turn your code into an interactive visualization:

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Your Code   │────▶│ Tree-Sitter C++  │────▶│ Sandbox AST      │────▶│ Execution    │
│  (JS or C++) │     │ AST Transpiler   │     │ Instrumenter     │     │ Engine (VM)  │
└──────────────┘     └──────────────────┘     └──────────────────┘     └──────────────┘
                                                                             │
                                                                             ▼
                                                                       ┌──────────────┐
                                                                       │  Timeline    │
                                                                       │  (snapshots) │
                                                                       └──────┬───────┘
                                                                              │
                                                                              ▼
                                                                       ┌──────────────┐
                                                                       │  React UI    │
                                                                       │  (step view) │
                                                                       └──────────────┘
```

### Stage 1: AST Transpilation (C++ only)
If you're writing C++, the custom **WebAssembly Tree-Sitter Transpiler** (`backend/sandbox/transpiler/`) deeply parses the C++ code into an Abstract Syntax Tree (AST). The `transformer.ts` logically maps:
- `std::vector`, `std::map`, `std::priority_queue` → optimized JavaScript Arrays/Objects
- Variable assignments, declarations, and scope → safe ES6 JS blocks
- `cout << x << endl` → `console.log(x)`

### Stage 2: Instrumentation
The **Instrumenter** parses the JavaScript code and injects trace closures directly into the execution path:
- `__tracer.step(line, variables)` after every physical statement.
- `__tracer.enter(name)` / `__tracer.exit()` for granular stack framing.

### Stage 3: Sandboxed Execution
The **Executor** (`executor.ts` + `executor.worker.ts`) spins up a parallel Web Worker to run the instrumented code asynchronously, fully isolating it from the UI thread. It collects a **Timeline**:
- Current active line number
- Fully deep-cloned variable state objects
- The function call stack
- I/O console output

### Stage 4: Visualization
The React frontend steps through the newly structured Timeline data. It seamlessly shifts the active line in the Monaco editor, animates variable mutations in the **Variables Panel**, highlights `i` / `j` indices, and updates the **Call Stack**.

---

## 🗂️ Project Structure

```
algoviz/
├── App.tsx                          # Main React app router
├── index.html                       # HTML shell with Tailwind config
│
├── backend/
│   ├── sandbox/
│   │   ├── transpiler/              # Tree-Sitter WASM AST C++ Engine
│   │   ├── executor.worker.ts       # Isolated parallel execution runner
│   │   └── executor.ts              # Timeline generation & timeline orchestration
│
├── frontend/
│   ├── templates/                   # 35+ C++ & JS interactive templates
│   ├── components/
│   │   ├── CodeEditor.tsx           # Monaco editor & floating widgets
│   │   ├── VariablesPanel.tsx       # State matrix / variables GUI
│   │   ├── TemplatePalette.tsx      # Command-K template search component
│   │   └── Controls.tsx             # Playback slider mechanics
│
└── public/
    └── web-tree-sitter.wasm         # Compiled grammar definitions
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)

### Installation

```bash
# Clone the repository
git clone https://github.com/ssgamingop/algoviz.git
cd algoviz

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be running at **http://localhost:3000** 🎉

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Monaco Editor** | Code editor (same as VS Code) |
| **Acorn** | JavaScript AST parser for instrumentation |
| **Framer Motion** | Smooth animations |
| **Lucide React** | Icons |
| **Tailwind CSS** | Styling (via CDN) |

---

## 📝 Usage

1. **Select a language** — Choose JavaScript or C++ (Beta) from the home page
2. **Write your code** — Use the Monaco editor on the left
3. **Click Run** — The code gets instrumented and executed
4. **Step through** — Use the playback controls to go forward/backward through each line
5. **Watch variables** — The right panel shows all variables, with ↑↓ indicators for changes and ✨ badges for new variables
6. **Check the stack** — Switch to the "Call Stack" tab to see function frames
7. **Read console output** — The bottom panel shows all `console.log` / `cout` output

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- 🐛 Report bugs via [Issues](https://github.com/ssgamingop/algoviz/issues)
- 💡 Suggest features
- 🔧 Submit pull requests

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ by [Somyajeet](https://github.com/ssgamingop)**

*© 2026 AlgoViz. Built for Educators.*

</div>
