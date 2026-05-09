/**
 * Wasm Clang Engine — Local in-browser C++ compilation and execution.
 *
 * Architecture:
 *   1. Instrument user C++ with __trace() calls (reuses CppInstrumenter).
 *   2. Compile instrumented code using Clang compiled to WebAssembly.
 *   3. Run the resulting Wasm binary in a sandboxed environment.
 *   4. Parse __TRACE__ blocks from stdout into a Timeline.
 *
 * This replaces the old C++→JS transpiler as the primary local engine.
 * Wandbox API is now the fallback (network-dependent).
 */

import { Timeline, ExecutionConfig } from '../../../types';
import { CppInstrumenter } from '../transpiler/cppInstrumenter';

// ─── Engine State ─────────────────────────────────────────────────────────────

let engineReady = false;
let engineInitPromise: Promise<void> | null = null;
let engineLoadError: string | null = null;

// We'll use a dynamic import approach for the Wasm modules
let clangModule: any = null;

// ─── Cached instrumented trace header ─────────────────────────────────────────
// The CppInstrumenter generates a large header with __to_json helpers.
// We cache the instrumenter instance to avoid re-creating it.
const instrumenterInstance = new CppInstrumenter();

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface WasmClangResult {
  timeline: Timeline;
  stdout: string;
  stderr: string;
  /** Compiler error to show the user (e.g. syntax error in their code). */
  compilerError?: string;
  /** Engine-level error — signals executor.ts to try the Wandbox fallback. */
  engineError?: string;
}

// ─── Engine Initialization ────────────────────────────────────────────────────

/**
 * Initialize the Wasm Clang engine.
 * Downloads and caches the Clang Wasm binary (~20-30MB on first load).
 * Safe to call multiple times — only initializes once.
 */
export async function initWasmClangEngine(): Promise<void> {
  if (engineReady) return;
  if (engineInitPromise) return engineInitPromise;

  engineInitPromise = doInit();
  return engineInitPromise;
}

/**
 * Check whether the Wasm Clang engine is ready for use.
 */
export function isWasmClangReady(): boolean {
  return engineReady && !engineLoadError;
}

/**
 * Get the engine load error, if any.
 */
export function getWasmClangError(): string | null {
  return engineLoadError;
}

// ─── Core Execution ───────────────────────────────────────────────────────────

/**
 * Compile and execute C++ code using the local Wasm Clang engine.
 *
 * Flow:
 *  1. Instrument the user's C++ with __trace() calls via CppInstrumenter.
 *  2. Compile the instrumented code with Clang-Wasm.
 *  3. Execute the resulting binary.
 *  4. Parse __TRACE__ blocks from stdout into a Timeline.
 *
 * Error categories:
 *  - `engineError`   → Wasm engine failed; caller should try Wandbox fallback.
 *  - `compilerError`  → The user's code has a compilation error; show it in the UI.
 */
export async function executeWasmClangCpp(
  code: string,
  config?: ExecutionConfig,
): Promise<WasmClangResult> {
  // ── 0. Ensure engine is ready ──
  if (!engineReady) {
    try {
      await initWasmClangEngine();
    } catch (e: any) {
      return {
        timeline: [],
        stdout: '',
        stderr: '',
        engineError: `Wasm Clang engine failed to initialize: ${e.message}`,
      };
    }
  }

  if (!engineReady || !clangModule) {
    return {
      timeline: [],
      stdout: '',
      stderr: '',
      engineError: engineLoadError || 'Wasm Clang engine is not available',
    };
  }

  // ── 1. Instrument the code ──
  let instrumentedCode: string;
  try {
    instrumentedCode = await instrumenterInstance.instrument(code);
  } catch (e: any) {
    return {
      timeline: [],
      stdout: '',
      stderr: '',
      engineError: `C++ instrumentation failed: ${e.message}`,
    };
  }

  // ── 2. Compile with Clang-Wasm ──
  let compileResult: { success: boolean; stdout: string; stderr: string; binary?: Uint8Array };
  try {
    compileResult = await compileWithClangWasm(instrumentedCode, config);
  } catch (e: any) {
    return {
      timeline: [],
      stdout: '',
      stderr: '',
      engineError: `Wasm Clang compilation crashed: ${e.message}`,
    };
  }

  if (!compileResult.success) {
    // Check if it's a user code error vs engine error
    const stderr = compileResult.stderr;
    if (stderr && (stderr.includes('error:') || stderr.includes('fatal error'))) {
      // User's code has a compilation error
      return {
        timeline: [],
        stdout: '',
        stderr,
        compilerError: cleanCompilerError(stderr),
      };
    }
    // Engine-level failure
    return {
      timeline: [],
      stdout: '',
      stderr,
      engineError: `Clang compilation failed: ${stderr || 'unknown error'}`,
    };
  }

  // ── 3. Execute the compiled binary ──
  let execResult: { stdout: string; stderr: string; exitCode: number };
  try {
    execResult = await runCompiledBinary(compileResult.binary!, config);
  } catch (e: any) {
    return {
      timeline: [],
      stdout: '',
      stderr: '',
      engineError: `Wasm execution crashed: ${e.message}`,
    };
  }

  if (execResult.exitCode !== 0) {
    return {
      timeline: [],
      stdout: execResult.stdout,
      stderr: execResult.stderr,
      engineError: `Execution failed with exit code ${execResult.exitCode}: ${execResult.stderr || 'Runtime error'}`,
    };
  }

  // ── 4. Parse trace output from stdout ──
  const rawOutput = execResult.stdout;
  const timeline = parseTraceOutput(rawOutput);

  // Extract user-visible output (everything that's NOT a __TRACE__ block)
  const userOutput = rawOutput.replace(/__TRACE__\{.*?\}__TRACE__\n?/g, '').trim();

  // Attach user cout output to the last timeline step
  if (userOutput && timeline.length > 0) {
    const outputLines = userOutput.split('\n').filter((l: string) => l.trim());
    for (const line of outputLines) {
      timeline[timeline.length - 1].consoleOutput.push({
        type: 'log',
        message: line,
      });
    }
  }

  return {
    timeline,
    stdout: userOutput,
    stderr: execResult.stderr,
  };
}

// ─── Internal Implementation ──────────────────────────────────────────────────

/**
 * Initialize the Wasm Clang module.
 *
 * Strategy: Use a lightweight Clang-to-Wasm approach.
 * We load clang.wasm + a minimal sysroot from the public/ directory.
 * These are cached by the browser after first load.
 */
async function doInit(): Promise<void> {
  try {
    console.log('[WasmClang] Initializing Clang-Wasm engine...');

    // Load the Wasm Clang module from public directory
    // The module provides compile() and run() functions
    const wasmUrl = '/wasm-clang/clang.wasm';
    const sysrootUrl = '/wasm-clang/sysroot.tar';

    // Check if the Wasm files are available
    const [clangResp, sysrootResp] = await Promise.all([
      fetch(wasmUrl, { method: 'HEAD' }),
      fetch(sysrootUrl, { method: 'HEAD' }),
    ]);

    if (!clangResp.ok || !sysrootResp.ok) {
      throw new Error('Wasm Clang binaries not found in /public/wasm-clang/');
    }

    // Dynamically load the Wasm Clang wrapper at runtime.
    // We use fetch + Blob URL instead of import() so Rollup/Vite
    // doesn't try to resolve this path at build time.
    const wrapperUrl = '/wasm-clang/clang-wrapper.js';
    const wrapperResp = await fetch(wrapperUrl);
    if (!wrapperResp.ok) {
      throw new Error(`Failed to fetch Clang wrapper: HTTP ${wrapperResp.status}`);
    }
    const wrapperText = await wrapperResp.text();
    const wrapperBlob = new Blob([wrapperText], { type: 'application/javascript' });
    const wrapperBlobUrl = URL.createObjectURL(wrapperBlob);

    let createClangModule: any;
    try {
      const mod = await import(/* @vite-ignore */ wrapperBlobUrl);
      createClangModule = mod.default || mod;
    } finally {
      URL.revokeObjectURL(wrapperBlobUrl);
    }

    clangModule = await createClangModule({
      locateFile: (path: string) => `/wasm-clang/${path}`,
      // Use streaming compilation for faster startup
      instantiateWasm: async (info: any, receiveInstance: any) => {
        try {
          const response = await fetch(wasmUrl);
          const result = await WebAssembly.instantiateStreaming(response, info);
          receiveInstance(result.instance, result.module);
        } catch {
          // Fallback to array buffer instantiation
          const response = await fetch(wasmUrl);
          const bytes = await response.arrayBuffer();
          const result = await WebAssembly.instantiate(bytes, info);
          receiveInstance(result.instance, result.module);
        }
      },
    });

    // Load sysroot (standard library headers)
    const sysrootData = await fetch(sysrootUrl).then((r) => r.arrayBuffer());
    if (clangModule.loadSysroot) {
      clangModule.loadSysroot(new Uint8Array(sysrootData));
    }

    engineReady = true;
    engineLoadError = null;
    console.log('[WasmClang] Engine initialized successfully.');
  } catch (error: any) {
    engineReady = false;
    engineLoadError = error.message;
    engineInitPromise = null; // Allow retry
    console.warn('[WasmClang] Engine init failed:', error.message);
    throw error;
  }
}

/**
 * Compile C++ source to a Wasm binary using the in-browser Clang.
 */
async function compileWithClangWasm(
  source: string,
  config?: ExecutionConfig,
): Promise<{ success: boolean; stdout: string; stderr: string; binary?: Uint8Array }> {
  if (!clangModule) {
    return { success: false, stdout: '', stderr: 'Clang module not loaded' };
  }

  try {
    // Write the source file to the virtual filesystem
    clangModule.FS.writeFile('/tmp/input.cpp', source);

    // Compile with Clang
    // Flags: -O0 for debug info preservation, -std=c++17 for modern C++
    const compileArgs = [
      'clang++',
      '-std=c++17',
      '-O0',
      '-o',
      '/tmp/output.wasm',
      '--target=wasm32-wasi',
      '--sysroot=/sysroot',
      '-fno-exceptions', // WASI limitation
      '/tmp/input.cpp',
    ];

    let stdout = '';
    let stderr = '';

    const exitCode = clangModule.callMain(compileArgs, {
      stdout: (text: string) => {
        stdout += text;
      },
      stderr: (text: string) => {
        stderr += text;
      },
    });

    if (exitCode !== 0) {
      return { success: false, stdout, stderr };
    }

    // Read the compiled binary
    const binary = clangModule.FS.readFile('/tmp/output.wasm');

    // Clean up
    try {
      clangModule.FS.unlink('/tmp/input.cpp');
      clangModule.FS.unlink('/tmp/output.wasm');
    } catch {
      /* ignore cleanup errors */
    }

    return { success: true, stdout, stderr, binary };
  } catch (e: any) {
    return { success: false, stdout: '', stderr: e.message };
  }
}

/**
 * Execute a compiled Wasm binary using WASI runtime.
 */
async function runCompiledBinary(
  binary: Uint8Array,
  config?: ExecutionConfig,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  let stdout = '';
  let stderr = '';

  // Set up WASI imports for the compiled program
  const decoder = new TextDecoder();

  // Create a simple WASI shim for stdout/stderr capture
  const wasiImports = createWasiShim(
    (text: string) => {
      stdout += text;
    },
    (text: string) => {
      stderr += text;
    },
    config?.inputValues?.join('\n') || '',
  );

  try {
    // The IDE might complain about Uint8Array<ArrayBufferLike> not being a BufferSource
    // in some TS configurations, so we cast it to `any` to bypass the type error.
    const module = await WebAssembly.compile(binary as any);
    const instance = await WebAssembly.instantiate(module, {
      wasi_snapshot_preview1: wasiImports,
    });

    if (instance.exports.memory) {
      wasiImports.__setMemory(instance.exports.memory as WebAssembly.Memory);
    }

    // Run with a timeout
    const timeoutMs = config?.timeoutMs ?? 5000;
    const startFn = (instance.exports._start || instance.exports.main) as Function;

    if (!startFn) {
      throw new Error('No _start or main export found in compiled binary');
    }

    // Execute with timeout protection
    await Promise.race([
      Promise.resolve().then(() => startFn()),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Execution timed out')), timeoutMs),
      ),
    ]);

    return { stdout, stderr, exitCode: 0 };
  } catch (e: any) {
    if (e.message === 'Execution timed out') {
      return {
        stdout,
        stderr: 'Execution timed out (possible infinite loop)',
        exitCode: 1,
      };
    }
    // A normal exit(0) in WASI throws a special error
    if (e instanceof WebAssembly.RuntimeError && e.message?.includes('unreachable')) {
      return { stdout, stderr, exitCode: 0 };
    }
    return { stdout, stderr: e.message, exitCode: 1 };
  }
}

/**
 * Create a minimal WASI shim for stdout/stderr capture.
 */
function createWasiShim(
  onStdout: (text: string) => void,
  onStderr: (text: string) => void,
  stdinContent: string,
) {
  let stdinOffset = 0;
  const stdinBuffer = new TextEncoder().encode(stdinContent);
  let memory: WebAssembly.Memory | null = null;

  // File descriptors: 0=stdin, 1=stdout, 2=stderr
  return {
    // Process exit
    proc_exit: (code: number) => {
      if (code !== 0) throw new Error(`Process exited with code ${code}`);
    },

    // Write to file descriptor
    fd_write: (fd: number, iovs: number, iovsLen: number, nwritten: number) => {
      if (!memory) return 1;
      const view = new DataView(memory.buffer);
      let totalWritten = 0;

      for (let i = 0; i < iovsLen; i++) {
        const ptr = view.getUint32(iovs + i * 8, true);
        const len = view.getUint32(iovs + i * 8 + 4, true);
        const bytes = new Uint8Array(memory.buffer, ptr, len);
        const text = new TextDecoder().decode(bytes);

        if (fd === 1) onStdout(text);
        else if (fd === 2) onStderr(text);

        totalWritten += len;
      }

      view.setUint32(nwritten, totalWritten, true);
      return 0; // success
    },

    // Read from file descriptor (stdin)
    fd_read: (fd: number, iovs: number, iovsLen: number, nread: number) => {
      if (!memory || fd !== 0) return 1;
      const view = new DataView(memory.buffer);
      let totalRead = 0;

      for (let i = 0; i < iovsLen && stdinOffset < stdinBuffer.length; i++) {
        const ptr = view.getUint32(iovs + i * 8, true);
        const len = view.getUint32(iovs + i * 8 + 4, true);
        const available = Math.min(len, stdinBuffer.length - stdinOffset);
        const dest = new Uint8Array(memory.buffer, ptr, available);
        dest.set(stdinBuffer.subarray(stdinOffset, stdinOffset + available));
        stdinOffset += available;
        totalRead += available;
      }

      view.setUint32(nread, totalRead, true);
      return 0;
    },

    // Seek (stub)
    fd_seek: () => 0,

    // Close (stub)
    fd_close: () => 0,

    // Pre-stat (stub — needed for WASI startup)
    fd_prestat_get: () => 8, // EBADF
    fd_prestat_dir_name: () => 8,

    // fd_fdstat_get (stub)
    fd_fdstat_get: (fd: number, buf: number) => {
      if (!memory) return 1;
      const view = new DataView(memory.buffer);
      // filetype: regular file
      view.setUint8(buf, fd <= 2 ? 2 : 4); // character device for stdio
      view.setUint16(buf + 2, 0, true); // flags
      view.setBigUint64(buf + 8, BigInt(0), true); // rights base
      view.setBigUint64(buf + 16, BigInt(0), true); // rights inheriting
      return 0;
    },

    // Environment (stubs)
    environ_get: () => 0,
    environ_sizes_get: (count: number, size: number) => {
      if (!memory) return 1;
      const view = new DataView(memory.buffer);
      view.setUint32(count, 0, true);
      view.setUint32(size, 0, true);
      return 0;
    },

    // Args (stubs)
    args_get: () => 0,
    args_sizes_get: (argc: number, argvBufSize: number) => {
      if (!memory) return 1;
      const view = new DataView(memory.buffer);
      view.setUint32(argc, 0, true);
      view.setUint32(argvBufSize, 0, true);
      return 0;
    },

    // Clock (stub)
    clock_time_get: (_id: number, _precision: bigint, buf: number) => {
      if (!memory) return 1;
      const view = new DataView(memory.buffer);
      view.setBigUint64(buf, BigInt(Date.now()) * BigInt(1000000), true);
      return 0;
    },

    // Random (stub)
    random_get: (buf: number, len: number) => {
      if (!memory) return 1;
      const bytes = new Uint8Array(memory.buffer, buf, len);
      crypto.getRandomValues(bytes);
      return 0;
    },

    // Set memory reference (called by module start)
    __setMemory: (mem: WebAssembly.Memory) => {
      memory = mem;
    },
  };
}

/**
 * Parse __TRACE__{...}__TRACE__ blocks from stdout into a Timeline.
 * Shared logic with wandboxExecutor.
 */
function parseTraceOutput(stdout: string): Timeline {
  const timeline: Timeline = [];
  const regex = /__TRACE__(\{.*?\})__TRACE__/g;
  let match;

  while ((match = regex.exec(stdout)) !== null) {
    try {
      const traceData = JSON.parse(match[1]);
      timeline.push({
        line: traceData.line,
        variables: traceData.variables || {},
        callStack: ['main'],
        consoleOutput: [],
      });
    } catch {
      console.warn('[WasmClang] Skipped malformed trace block:', match[1]);
    }
  }

  return timeline;
}

/**
 * Clean up compiler error messages to be more user-friendly.
 * Strips internal file paths and trace header line offsets.
 */
function cleanCompilerError(stderr: string): string {
  return (
    stderr
      // Remove /tmp/input.cpp path prefix
      .replace(/\/tmp\/input\.cpp/g, 'main.cpp')
      // Remove verbose note lines
      .replace(/^note:.*$/gm, '')
      // Trim excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}
