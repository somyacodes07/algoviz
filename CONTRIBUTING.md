# Contributing to AlgoViz

Thanks for helping. AlgoViz is built for students and teachers, so the most useful contributions make an algorithm easier to understand: a structure drawn more clearly, a program that traces correctly, a step that explains itself better.

## Ways to help

- **Report a wrong drawing.** If AlgoViz draws your data structure wrong, or a program fails to trace, [open an issue](https://github.com/somyacodes07/algoviz/issues/new/choose) and paste the code you ran. These reports are the fastest way to improve detection.
- **Add a template.** Classic algorithms live in `frontend/templates/` (`cppTemplates.ts`, `jsTemplates.ts`).
- **Fix a bug or add a feature.** Look for issues labelled `good first issue`, or open an issue first for anything large so we can agree on the approach.
- **Improve the docs** in `docs/`.

## Project layout

| Path | What it is |
| --- | --- |
| `App.tsx`, `frontend/` | The web app: workspace, visualizers, landing page, templates |
| `frontend/components/visualizer/` | Structure detection and the website's diagrams |
| `backend/tracer/` | JavaScript instrumenter (Acorn) |
| `backend/sandbox/transpiler/` | C++ instrumenter (Tree-sitter) |
| `backend/sandbox/runtime/` | Runs traced code: Web Worker for JS, WebAssembly Clang or remote GCC for C++ |
| `algoviz-extension/` | The VS Code extension: host (`src/`) and sidebar webview (`webview/`) |
| `public/` | Tree-sitter and Clang WebAssembly binaries |
| `docs/` | Documentation |

## Setup

You need Node.js 20 or newer.

```bash
git clone https://github.com/somyacodes07/algoviz.git
cd algoviz
npm install
npm run dev          # web app at http://localhost:3000
```

For the VS Code extension:

```bash
cd algoviz-extension
npm install
npm run build:webview
npm run compile
```

Then open `algoviz-extension` in VS Code and press **F5** to start an Extension Development Host. While working on the sidebar, `npx vite --config algoviz-extension/vite.config.ts algoviz-extension` serves it in a browser at `/webview/index.html`.

## Before you open a pull request

- `npm run build` passes at the root.
- In `algoviz-extension/`: `npm run check-types` and `npm run build:webview` pass.
- If you touched the C++ instrumenter, check that the templates still compile after tracing. You need `clang++` for this:

  ```bash
  npx tsx scripts/check-cpp-tracer.mts
  ```

- If you changed something visible, add a screenshot or a short GIF to the pull request.
- Keep the change focused. One fix or feature per pull request is easier to review.

## Style

- TypeScript and React. Code is formatted with Prettier (`npm run format`).
- Write comments that explain why, not what.
- The extension's webview uses VS Code theme tokens (`--vscode-*`), so it matches any colour theme. Please don't hard-code colours there.
- Commit messages: a short imperative subject ("Fix pointer markers on empty arrays"), with details in the body if needed.

## Code of conduct

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
