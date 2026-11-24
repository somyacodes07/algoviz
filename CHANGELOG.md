# Changelog

All notable changes to AlgoViz are listed here. The web app is released continuously from `main`, so it is grouped by month. The VS Code extension has its own numbered versions; see [`algoviz-extension/CHANGELOG.md`](algoviz-extension/CHANGELOG.md) for every detail.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## 2026-11 — VS Code extension 2.x

### Added
- **VS Code extension 2.0:** a native sidebar view instead of the embedded website.
  - The running line is highlighted in your own editor, and changed values show at the end of the line.
  - Step, play and stop controls in the editor toolbar and on the keyboard.
  - Gutter breakpoints pause playback, and saving the file re-runs it.
- Program input box for `cin`, `getline` and `prompt()`, remembered per file.
- Editor-style drawings for arrays, grids, classes, trees, linked lists, graphs, hash maps, stacks and heaps. Pointers that share a chain are drawn once and tagged on the nodes they point to.
- Compile and runtime errors are shown as editor diagnostics and as a readable error card.
- Publishing to the Visual Studio Marketplace from GitHub Actions with trusted publishing (no stored token).
- Repository files: license, contributing guide, code of conduct, security policy, issue and pull request templates, CI.

### Changed
- C++ compiles locally with the bundled WebAssembly Clang by default, so the extension works offline.
- Every loop iteration and every `if` check is its own step, in both the C++ and JavaScript tracers.
- Step descriptions name the field that changed (`q.rear changed from 2 to 3`).

### Fixed
- Plain C arrays (`int arr[10]`) no longer fail to compile in the C++ tracer.
- Array parameters (`int arr[], int n`) are traced as `n` elements instead of a pointer.
- `int arr[100];` without an initializer is traced; big arrays show only the slots in use.
- Member functions trace the object's fields as `this`.
- Endless C++ loops stop after 3000 steps instead of hanging.

## 2026-10

### Added
- Mobile workspace with switching between the code and the visualizer panels.
- Better discovery by search engines and AI crawlers (`llms.txt`, metadata).

### Changed
- Faster tracing and visualization on large timelines and on mobile.
- Array visualization, loading states and the saffron / blue language themes were refined.

### Fixed
- Stale execution state and complexity estimates after editing code.
- Cyclic data in timeline comparisons.
- String literals in the C++ BST template.

## 2026-08

### Added
- In-browser C++ compilation with WebAssembly Clang, with the compiler binaries tracked in the repository.
- Full player controls in the enlarged diagram view.
- VS Code extension 1.1 and 1.2: content security policy, smaller package, live sync with the editor.

### Fixed
- Many WebAssembly Clang runtime issues (WASI imports, MemFS paths, linker arguments, C++17 flags).

## 2026-07

### Added
- Auxiliary space complexity estimates alongside time complexity.

### Changed
- Responsive layout, spacing and typography across the homepage and workspace.
- Compact playback controls and progress scrubber.
- README and documentation overhaul.

## 2026-06

### Added
- WebAssembly Clang engine groundwork: custom MemFS and WASI driver.
- Circular linked list visualization with address-based cycle detection.
- Vercel Web Analytics.

### Changed
- Site moved to [algoviz.somyacodes.in](https://algoviz.somyacodes.in) with absolute social share images.

## 2026-05

### Added
- First VS Code extension release on the Marketplace, with editor Run menu integration.
- Persistent settings, theme configuration and the redesigned landing page with interactive backdrops.
- Collapsible variable cards, cycle detection in linked lists, and faster graph edge detection.

### Changed
- Dark mode moved to shared CSS variables for a consistent visual hierarchy.
- The C++ instrumenter became asynchronous and loads Tree-sitter on demand.

## 2026-04

### Added
- Unified SVG logo with language-specific branding.
- Execution status toasts and clearer transpiler errors.
- Theme toggle, curved bidirectional graph edges and animated SVG rendering.

### Changed
- Codebase modularized and formatted with Prettier.

## 2026-03

### Added
- C++ support through Tree-sitter (WebAssembly), including priority queues, structs and helper functions.
- Complexity analysis with a performance panel.
- Linked list and graph previews.
- Template library with a command palette.
- Built-in documentation, SEO metadata and routing.

### Changed
- Complete UI and landing page redesign.

## 2026-02

### Added
- Initial release: step-by-step JavaScript visualizer.
- Code runs in a Web Worker behind a `useExecutionEngine` hook.
- Logo and favicon.
