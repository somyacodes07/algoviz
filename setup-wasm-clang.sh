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
if [ -f "$DEST_DIR/clang.wasm" ] && [ -f "$DEST_DIR/sysroot.tar" ] && [ -f "$DEST_DIR/lld.wasm" ] && [ -f "$DEST_DIR/memfs.wasm" ]; then
  echo "✅ Wasm Clang binaries already present in $DEST_DIR"
  echo "   Delete them and re-run this script to re-download."
  exit 0
fi

echo "📦 Downloading Clang-Wasm binaries..."
echo "   This is a one-time ~60MB download."
echo ""

MEMFS_WASM_URL="https://cdn.jsdelivr.net/npm/wasm-clang@0.0.1/bin/memfs"
CLANG_WASM_URL="https://cdn.jsdelivr.net/npm/wasm-clang@0.0.1/bin/clang"
LLD_WASM_URL="https://cdn.jsdelivr.net/npm/wasm-clang@0.0.1/bin/lld"
SYSROOT_URL="https://cdn.jsdelivr.net/npm/wasm-clang@0.0.1/bin/sysroot.tar"

echo "📥 Downloading memfs.wasm..."
curl -L -o "$DEST_DIR/memfs.wasm" "$MEMFS_WASM_URL"

echo "📥 Downloading clang.wasm..."
curl -L -o "$DEST_DIR/clang.wasm" "$CLANG_WASM_URL"

echo "📥 Downloading lld.wasm..."
curl -L -o "$DEST_DIR/lld.wasm" "$LLD_WASM_URL"

echo "📥 Downloading sysroot.tar..."
curl -L -o "$DEST_DIR/sysroot.tar" "$SYSROOT_URL"

echo ""
echo "✅ Wasm Clang binaries downloaded to $DEST_DIR"
echo "   Start the dev server with: npm run dev"

exit 0
