#!/bin/bash
#
# Setup script for Wasm Clang engine binaries.
#
# Downloads the pre-built Clang-to-Wasm binaries and places them
# in public/wasm-clang/ for the browser to load.
#
# These files are NOT checked into git (they're in .gitignore).
# Run this script once after cloning the repo if you want
# local C++ execution without Wandbox.
#
# Without these files, AlgoViz will gracefully fall back to the
# Wandbox API for C++ execution.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST_DIR="$SCRIPT_DIR/public/wasm-clang"

echo "╔══════════════════════════════════════════════════════╗"
echo "║  AlgoViz — Wasm Clang Engine Setup                  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

mkdir -p "$DEST_DIR"

# Check if already downloaded
if [ -f "$DEST_DIR/clang.wasm" ] && [ -f "$DEST_DIR/sysroot.tar" ]; then
  echo "✅ Wasm Clang binaries already present in $DEST_DIR"
  echo "   Delete them and re-run this script to re-download."
  exit 0
fi

echo "📦 Downloading Clang-Wasm binaries..."
echo "   This is a one-time ~30MB download."
echo ""

# NOTE: These URLs are placeholders.
# Replace with actual hosted binaries when available.
# Options for hosting:
#   1. Build from source using aspect-build/aspect-wasm
#   2. Use binji/aspect-wasm-clang pre-built releases
#   3. Self-host on your CDN (e.g., Cloudflare R2)

CLANG_WASM_URL="https://cdn.example.com/wasm-clang/clang.wasm"
SYSROOT_URL="https://cdn.example.com/wasm-clang/sysroot.tar"
WRAPPER_URL="https://cdn.example.com/wasm-clang/clang-wrapper.js"

echo "⚠️  NOTE: Placeholder URLs detected."
echo "   The Wasm Clang binaries need to be built or downloaded"
echo "   from a real source. See docs/wasm-clang-setup.md for instructions."
echo ""
echo "   For now, AlgoViz will use the Wandbox API for C++ execution."
echo ""

# Uncomment these lines once real URLs are available:
# curl -L -o "$DEST_DIR/clang.wasm" "$CLANG_WASM_URL"
# curl -L -o "$DEST_DIR/sysroot.tar" "$SYSROOT_URL"
# curl -L -o "$DEST_DIR/clang-wrapper.js" "$WRAPPER_URL"
# echo ""
# echo "✅ Wasm Clang binaries downloaded to $DEST_DIR"
# echo "   Start the dev server with: npm run dev"

exit 0
