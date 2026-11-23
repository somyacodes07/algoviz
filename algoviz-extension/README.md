<div align="center">
  <img src="https://raw.githubusercontent.com/somyacodes07/AlgoViz-copy/main/public/icon-512.png" alt="AlgoViz Logo" width="120" />
  <h1>AlgoViz for VS Code</h1>
  <p><em>Watch your algorithm run, line by line, in the editor you already use.</em></p>
</div>

---

AlgoViz adds a **Visualizer** view to VS Code. Write C++ or JavaScript in your normal editor, press **⌘⌥V** (Ctrl+Alt+V), and step through the run: the line that executed is highlighted in your file, the values that changed appear at the end of that line, and the sidebar draws your arrays, trees, linked lists, graphs, stacks, queues, heaps and hash maps as they change.

It works for students tracing their own code and for teachers walking a class through an algorithm.

## How to use

1. Open a `.cpp`, `.c`, `.js`, `.ts`, `.jsx` or `.tsx` file.
2. Press **⌘⌥V** / **Ctrl+Alt+V**, choose **Visualize Active File** from the editor's Run menu, or click the AlgoViz icon in the Activity Bar.
3. Step through the run with the sidebar controls, the editor toolbar buttons, or the keyboard.

| Action | macOS | Windows / Linux |
| --- | --- | --- |
| Visualize the active file | ⌘⌥V | Ctrl+Alt+V |
| Step forward / back | ⌘⌥→ / ⌘⌥← | Ctrl+Alt+→ / Ctrl+Alt+← |
| Play / pause | ⌘⌥P | Ctrl+Alt+P |
| Run to the cursor's line | ⌘⌥↵ | Ctrl+Alt+Enter |
| Stop visualizing | ⇧Esc | Shift+Esc |

## What you get

- **Editor highlighting**: the executing line, a gutter marker, and the changed values shown inline, like a debugger.
- **Diagrams for data structures**, detected from your variables and drawn per step.
- **Variables, Call Stack and Output** sections that follow the current step, styled like the Run and Debug view.
- **Complexity estimate** with the busiest lines; click a line to jump to it.
- **Breakpoints**: set them in the editor gutter as usual and playback stops on them.
- **Re-run on save**: when you edit the file the trace is marked out of date, and saving traces it again on the same step.
- Program output goes to the **AlgoViz** output channel too.

### Teaching tip

Drag the Visualizer view into the **secondary side bar** (View → Appearance → Secondary Side Bar) or the bottom panel to give the diagrams more room while the code stays on screen.

## Settings

| Setting | Default | What it does |
| --- | --- | --- |
| `algoviz.cppCompiler` | `api` | `api` compiles C++ remotely with GCC (needs internet). `wasm` compiles locally with WebAssembly Clang and falls back to the remote compiler. |
| `algoviz.rerunOnSave` | `true` | Trace the file again when you save it. |
| `algoviz.inlineValues` | `true` | Show changed values at the end of the highlighted line. |
| `algoviz.followExecution` | `true` | Scroll the editor to keep the executing line visible. |
| `algoviz.playbackSpeed` | `600` | Milliseconds per step while playing. |

## How it runs your code

JavaScript (and TypeScript, traced as JavaScript) runs in a sandboxed web worker inside the view. C++ is instrumented locally, then compiled with the compiler chosen in `algoviz.cppCompiler`. With the default `api` setting your C++ source is sent to a remote compiler service.

## Contributing

AlgoViz is open source and powered by the [AlgoViz](https://algoviz.somyacodes.in) project. Report bugs or request features in the [issue tracker](https://github.com/somyacodes07/AlgoViz-copy/issues).
