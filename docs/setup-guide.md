# Setup & Installation Guide

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A modern browser (Chrome, Firefox, Edge, Safari)
- Active internet connection (for C++ Wandbox engine; offline uses local fallback)

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

No environment variables or API keys are required. AlgoViz uses the public Wandbox API for C++ execution, which does not require authentication.

## WASM Files

AlgoViz ships two WASM files in the `public/` directory for Tree-sitter C++ parsing:

- `tree-sitter.wasm` — Tree-sitter runtime
- `tree-sitter-cpp.wasm` — C++ grammar

These are loaded automatically on first use. No setup needed.

## Offline Mode

If you're working without internet access:

- **JavaScript**: Works fully offline (all execution happens in-browser)
- **C++**: Falls back to the local C++ → JavaScript transpiler automatically
  - Supports a DSA-focused C++ subset (vectors, maps, loops, recursion)
  - Full C++ features (templates, OOP, advanced STL) require the Wandbox API

## Type Checking

```bash
npx tsc --noEmit
```

This validates all TypeScript without emitting files.

## Project Structure

See [Architecture Reference](architecture.md) for the full project tree and module breakdown.
