# Setup & Installation Guide

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A modern browser (Chrome, Firefox, Edge, Safari)
- Active internet connection (Optional: Wasm Clang runs completely offline; Wandbox API fallback requires internet)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/ssgamingop/algoviz.git
cd algoviz

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app runs at `http://localhost:3000`.

## Production Build

```bash
# Build static site
npm run build

# Preview production build locally
npm run preview
```

## Environment

No environment variables or API keys are required. AlgoViz uses the local Wasm Clang engine for C++ execution natively, and the public Wandbox API as a fallback, neither of which require authentication.

## WASM Files

AlgoViz ships two WASM files in the `public/` directory for Tree-sitter C++ parsing:

- `tree-sitter.wasm` — Tree-sitter runtime
- `tree-sitter-cpp.wasm` — C++ grammar

These are loaded automatically on first use. No setup needed.

## Offline Mode

If you're working without internet access:

- **JavaScript**: Works fully offline (all execution happens in-browser).
- **C++**: Works fully offline via the local WebAssembly Clang (Wasm Clang) engine.
  - Supports full C++ features including STL containers, templates, and OOP natively inside your browser.

## Type Checking

```bash
npx tsc --noEmit
```

This validates all TypeScript without emitting files.

## Project Structure

See [Architecture Reference](architecture.md) for the full project tree and module breakdown.
