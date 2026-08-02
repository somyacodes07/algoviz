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

// WebAssembly compiler modules loaded from the public/wasm-clang directory
let memfsModule: WebAssembly.Module | null = null;
let clangModule: WebAssembly.Module | null = null;
let lldModule: WebAssembly.Module | null = null;
let sysrootBuffer: ArrayBuffer | null = null;

// The virtual filesystem manager
let memfs: MemFS | null = null;

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

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Initialize the Wasm Clang engine.
 * Downloads and caches the Clang Wasm modules and sysroot libraries.
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

/**
 * Compile and execute C++ code using the local Wasm Clang engine.
 *
 * Flow:
 *  1. Instrument the user's C++ with __trace() calls via CppInstrumenter.
 *  2. Compile the instrumented code with Clang-Wasm.
 *  3. Execute the resulting binary.
 *  4. Parse __TRACE__ blocks from stdout into a Timeline.
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

  return {
    timeline,
    stdout: userOutput,
    stderr: execResult.stderr,
  };
}

// ─── WebAssembly Clang Compiler Driver Classes ──────────────────────────────────

function readStr(u8: Uint8Array, o: number, len = -1): string {
  let str = '';
  let end = u8.length;
  if (len !== -1)
    end = o + len;
  for (let i = o; i < end && u8[i] !== 0; ++i)
    str += String.fromCharCode(u8[i]);
  return str;
}

class Memory {
  memory: WebAssembly.Memory;
  buffer: ArrayBuffer;
  u8: Uint8Array;
  u32: Uint32Array;

  constructor(memory: WebAssembly.Memory) {
    this.memory = memory;
    this.buffer = this.memory.buffer;
    this.u8 = new Uint8Array(this.buffer);
    this.u32 = new Uint32Array(this.buffer);
  }

  check() {
    if (this.buffer.byteLength === 0) {
      this.buffer = this.memory.buffer;
      this.u8 = new Uint8Array(this.buffer);
      this.u32 = new Uint32Array(this.buffer);
    }
  }

  read8(o: number) { return this.u8[o]; }
  read32(o: number) { return this.u32[o >> 2]; }
  write8(o: number, v: number) { this.u8[o] = v; }
  write32(o: number, v: number) { this.u32[o >> 2] = v; }
  write64(o: number, vlo: number, vhi = 0) { this.write32(o, vlo); this.write32(o + 4, vhi); }

  readStr(o: number, len: number) {
    this.check();
    return readStr(this.u8, o, len);
  }

  writeStr(o: number, str: string) {
    o += this.write(o, str);
    this.write8(o, 0);
    return str.length + 1;
  }

  write(o: number, buf: ArrayBuffer | Uint8Array | string): number {
    this.check();
    if (buf instanceof ArrayBuffer) {
      return this.write(o, new Uint8Array(buf));
    } else if (typeof buf === 'string') {
      const chars = buf.split('').map(x => x.charCodeAt(0));
      return this.write(o, new Uint8Array(chars));
    } else {
      const dst = new Uint8Array(this.buffer, o, buf.length);
      dst.set(buf);
      return buf.length;
    }
  }
}

function normalizeMemfsPath(p: string): string {
  return p.trim().replace(/^[\/\.]+|[\/]+$/g, '');
}

class MemFS {
  hostWrite: (text: string) => void;
  stdinStr = '';
  stdinStrPos = 0;
  instance!: WebAssembly.Instance;
  exports: any;
  mem!: Memory;
  ready: Promise<void>;
  private hostMem_: Memory | null = null;

  constructor(
    memfsModule: WebAssembly.Module,
    hostWrite: (text: string) => void,
  ) {
    this.hostWrite = hostWrite;

    const env = {
      abort: () => { throw new Error('abort'); },
      host_write: (fd: number, iovs: number, iovs_len: number, nwritten_out: number) => this.host_write(fd, iovs, iovs_len, nwritten_out),
      host_read: (fd: number, iovs: number, iovs_len: number, nread: number) => this.host_read(fd, iovs, iovs_len, nread),
      memfs_log: (buf: number, len: number) => this.memfs_log(buf, len),
      copy_in: (memfs_dst: number, clang_src: number, size: number) => this.copy_in(memfs_dst, clang_src, size),
      copy_out: (clang_dst: number, memfs_src: number, size: number) => this.copy_out(clang_dst, memfs_src, size),
    };

    this.ready = WebAssembly.instantiate(memfsModule, { env }).then(instance => {
      this.instance = instance;
      this.exports = instance.exports;
      this.mem = new Memory(this.exports.memory as WebAssembly.Memory);
      this.exports.init();
    });
  }

  set hostMem(mem: Memory) {
    this.hostMem_ = mem;
  }

  setStdinStr(str: string) {
    this.stdinStr = str;
    this.stdinStrPos = 0;
  }

  addDirectory(path: string) {
    const cleanPath = normalizeMemfsPath(path);
    if (!cleanPath) return;
    this.mem.check();
    this.mem.writeStr(this.exports.GetPathBuf(), cleanPath);
    this.exports.AddDirectoryNode(cleanPath.length);
  }

  addFile(path: string, contents: Uint8Array | string) {
    const cleanPath = normalizeMemfsPath(path);
    const length = typeof contents === 'string' ? contents.length : contents.byteLength;
    this.mem.check();
    this.mem.writeStr(this.exports.GetPathBuf(), cleanPath);
    const inode = this.exports.AddFileNode(cleanPath.length, length);
    const addr = this.exports.GetFileNodeAddress(inode);
    this.mem.check();
    this.mem.write(addr, contents);
  }

  getFileContents(path: string): Uint8Array {
    const cleanPath = normalizeMemfsPath(path);
    this.mem.check();
    this.mem.writeStr(this.exports.GetPathBuf(), cleanPath);
    const inode = this.exports.FindNode(cleanPath.length);
    if (inode === 0) {
      throw new Error(`File not found: ${cleanPath}`);
    }
    const addr = this.exports.GetFileNodeAddress(inode);
    const size = this.exports.GetFileNodeSize(inode);
    return new Uint8Array(this.mem.buffer, addr, size);
  }

  host_write(fd: number, iovs: number, iovs_len: number, nwritten_out: number) {
    if (!this.hostMem_) return 1;
    this.hostMem_.check();
    let size = 0;
    let str = '';
    for (let i = 0; i < iovs_len; ++i) {
      const buf = this.hostMem_.read32(iovs);
      iovs += 4;
      const len = this.hostMem_.read32(iovs);
      iovs += 4;
      str += this.hostMem_.readStr(buf, len);
      size += len;
    }
    this.hostMem_.write32(nwritten_out, size);
    this.hostWrite(str);
    return 0; // ESUCCESS
  }

  host_read(fd: number, iovs: number, iovs_len: number, nread: number) {
    if (!this.hostMem_) return 1;
    this.hostMem_.check();
    let size = 0;
    for (let i = 0; i < iovs_len; ++i) {
      const buf = this.hostMem_.read32(iovs);
      iovs += 4;
      const len = this.hostMem_.read32(iovs);
      iovs += 4;
      const lenToWrite = Math.min(len, (this.stdinStr.length - this.stdinStrPos));
      if (lenToWrite === 0) {
        break;
      }
      this.hostMem_.write(buf, this.stdinStr.substring(this.stdinStrPos, this.stdinStrPos + lenToWrite));
      size += lenToWrite;
      this.stdinStrPos += lenToWrite;
      if (lenToWrite !== len) {
        break;
      }
    }
    this.hostMem_.write32(nread, size);
    return 0; // ESUCCESS
  }

  memfs_log(buf: number, len: number) {
    this.mem.check();
    console.log(this.mem.readStr(buf, len));
  }

  copy_out(clang_dst: number, memfs_src: number, size: number) {
    if (!this.hostMem_) return;
    this.hostMem_.check();
    const dst = new Uint8Array(this.hostMem_.buffer, clang_dst, size);
    this.mem.check();
    const src = new Uint8Array(this.mem.buffer, memfs_src, size);
    dst.set(src);
  }

  copy_in(memfs_dst: number, clang_src: number, size: number) {
    if (!this.hostMem_) return;
    this.mem.check();
    const dst = new Uint8Array(this.mem.buffer, memfs_dst, size);
    this.hostMem_.check();
    const src = new Uint8Array(this.hostMem_.buffer, clang_src, size);
    dst.set(src);
  }
}

class ProcExit extends Error {
  code: number;
  constructor(code: number) {
    super(`process exited with code ${code}.`);
    this.code = code;
  }
}

class App {
  argv!: string[];
  environ!: Record<string, string>;
  memfs!: MemFS;
  instance!: WebAssembly.Instance;
  exports: any;
  mem!: Memory;

  static async create(
    module: WebAssembly.Module,
    memfs: MemFS,
    argv: string[],
    environ: Record<string, string> = {},
  ): Promise<App> {
    const app = new App();
    app.argv = argv;
    app.environ = environ;
    app.memfs = memfs;

    const env = {
      abort: () => { throw new Error('abort'); },
      host_write: (fd: number, iovs: number, iovs_len: number, nwritten_out: number) => app.host_write(fd, iovs, iovs_len, nwritten_out),
      host_read: (fd: number, iovs: number, iovs_len: number, nread: number) => app.host_read(fd, iovs, iovs_len, nread),
      memfs_log: (buf: number, len: number) => app.memfs_log(buf, len),
      copy_in: (memfs_dst: number, clang_src: number, size: number) => app.copy_in(memfs_dst, clang_src, size),
      copy_out: (clang_dst: number, memfs_src: number, size: number) => app.copy_out(clang_dst, memfs_src, size),
    };

    const wasi_unstable = {
      proc_exit: (code: number) => { throw new ProcExit(code); },
      environ_sizes_get: (environ_count_out: number, environ_buf_size_out: number) => app.environ_sizes_get(environ_count_out, environ_buf_size_out),
      environ_get: (environ_ptrs: number, environ_buf: number) => app.environ_get(environ_ptrs, environ_buf),
      args_sizes_get: (argc_out: number, argv_buf_size_out: number) => app.args_sizes_get(argc_out, argv_buf_size_out),
      args_get: (argv_ptrs: number, argv_buf: number) => app.args_get(argv_ptrs, argv_buf),
      random_get: (buf: number, buf_len: number) => app.random_get(buf, buf_len),
      clock_time_get: (clock_id: number, precision: bigint, time_out: number) => {
        if (!app.mem) return 1;
        app.mem.check();
        const view = new DataView(app.mem.buffer);
        view.setBigUint64(time_out, BigInt(Date.now()) * BigInt(1000000), true);
        return 0;
      },
      poll_oneoff: () => { throw new Error('poll_oneoff not implemented'); },
      ...memfs.exports,
    };

    const res = await WebAssembly.instantiate(module, {
      env,
      wasi_unstable,
      wasi_snapshot_preview1: wasi_unstable,
    });
    app.instance = res instanceof WebAssembly.Instance ? res : res.instance;
    app.exports = app.instance.exports;
    app.mem = new Memory(app.exports.memory as WebAssembly.Memory);
    app.memfs.hostMem = app.mem;
    return app;
  }

  async run(): Promise<number> {
    try {
      this.exports._start();
      return 0;
    } catch (e: any) {
      if (e instanceof ProcExit) {
        return e.code;
      }
      throw e;
    }
  }

  host_write(fd: number, iovs: number, iovs_len: number, nwritten_out: number) {
    return this.memfs.exports.host_write(fd, iovs, iovs_len, nwritten_out);
  }

  host_read(fd: number, iovs: number, iovs_len: number, nread: number) {
    return this.memfs.exports.host_read(fd, iovs, iovs_len, nread);
  }

  memfs_log(buf: number, len: number) {
    return this.memfs.exports.memfs_log(buf, len);
  }

  copy_out(clang_dst: number, memfs_src: number, size: number) {
    return this.memfs.exports.copy_out(clang_dst, memfs_src, size);
  }

  copy_in(memfs_dst: number, clang_src: number, size: number) {
    return this.memfs.exports.copy_in(memfs_dst, clang_src, size);
  }

  environ_sizes_get(environ_count_out: number, environ_buf_size_out: number) {
    this.mem.check();
    let size = 0;
    const names = Object.keys(this.environ);
    for (const name of names) {
      const value = this.environ[name];
      size += name.length + value.length + 2;
    }
    this.mem.write64(environ_count_out, names.length);
    this.mem.write64(environ_buf_size_out, size);
    return 0;
  }

  environ_get(environ_ptrs: number, environ_buf: number) {
    this.mem.check();
    const names = Object.keys(this.environ);
    for (const name of names) {
      this.mem.write32(environ_ptrs, environ_buf);
      environ_ptrs += 4;
      environ_buf += this.mem.writeStr(environ_buf, `${name}=${this.environ[name]}`);
    }
    this.mem.write32(environ_ptrs, 0);
    return 0;
  }

  args_sizes_get(argc_out: number, argv_buf_size_out: number) {
    this.mem.check();
    let size = 0;
    for (const arg of this.argv) {
      size += arg.length + 1;
    }
    this.mem.write64(argc_out, this.argv.length);
    this.mem.write64(argv_buf_size_out, size);
    return 0;
  }

  args_get(argv_ptrs: number, argv_buf: number) {
    this.mem.check();
    for (const arg of this.argv) {
      this.mem.write32(argv_ptrs, argv_buf);
      argv_ptrs += 4;
      argv_buf += this.mem.writeStr(argv_buf, arg);
    }
    this.mem.write32(argv_ptrs, 0);
    return 0;
  }

  random_get(buf: number, buf_len: number) {
    this.mem.check();
    const data = new Uint8Array(this.mem.buffer, buf, buf_len);
    crypto.getRandomValues(data);
    return 0;
  }
}

class Tar {
  u8: Uint8Array;
  offset = 0;

  constructor(buffer: ArrayBuffer) {
    this.u8 = new Uint8Array(buffer);
  }

  readStr(len: number) {
    const result = readStr(this.u8, this.offset, len);
    this.offset += len;
    return result;
  }

  readOctal(len: number) {
    return parseInt(this.readStr(len), 8);
  }

  alignUp() {
    this.offset = (this.offset + 511) & ~511;
  }

  readEntry() {
    if (this.offset + 512 > this.u8.length) {
      return null;
    }

    const entry: any = {
      filename: this.readStr(100),
      mode: this.readOctal(8),
      owner: this.readOctal(8),
      group: this.readOctal(8),
      size: this.readOctal(12),
      mtim: this.readOctal(12),
      checksum: this.readOctal(8),
      type: this.readStr(1),
      linkname: this.readStr(100),
    };

    if (this.readStr(8) !== 'ustar  ') {
      return null;
    }

    entry.ownerName = this.readStr(32);
    entry.groupName = this.readStr(32);
    entry.devMajor = this.readStr(8);
    entry.devMinor = this.readStr(8);
    entry.filenamePrefix = this.readStr(155);
    this.alignUp();

    if (entry.type === '0' || entry.type === '') {        // Regular file.
      entry.contents = this.u8.subarray(this.offset, this.offset + entry.size);
      this.offset += entry.size;
      this.alignUp();
    } else if (entry.type === '5') { // Directory.
      // Directory handling, no size content to skip
    }
    return entry;
  }

  untar(memfs: MemFS) {
    let entry;
    const createdDirs = new Set<string>();

    const ensureDirectoryChain = (dirPath: string) => {
      const parts = dirPath.split('/').filter(Boolean);
      let curr = '';
      for (let i = 0; i < parts.length; i++) {
        curr = curr ? curr + '/' + parts[i] : parts[i];
        if (!createdDirs.has(curr)) {
          try {
            memfs.addDirectory(curr);
            createdDirs.add(curr);
          } catch (e) {
            // Directory exists
          }
        }
      }
    };

    while ((entry = this.readEntry())) {
      let rawPath = entry.filenamePrefix
        ? `${entry.filenamePrefix}/${entry.filename}`
        : entry.filename;

      let cleanPath = normalizeMemfsPath(rawPath);
      if (!cleanPath) continue;

      if (entry.type === '5') {
        ensureDirectoryChain(cleanPath);
      } else if (entry.type === '0' || entry.type === '') {
        const lastSlash = cleanPath.lastIndexOf('/');
        if (lastSlash > 0) {
          const parentDir = cleanPath.substring(0, lastSlash);
          ensureDirectoryChain(parentDir);
        }
        memfs.addFile(cleanPath, entry.contents);
      }
    }
  }
}

// ─── Clang Constants ─────────────────────────────────────────────────────────

const clangCommonArgs = [
  '-disable-free',
  '-isysroot', '/',
  '-internal-isystem', '/include/c++/v1',
  '-internal-isystem', '/include',
  '-internal-isystem', '/lib/clang/8.0.1/include',
  '-ferror-limit', '19',
  '-fmessage-length', '80',
  '-fcolor-diagnostics',
];

// Helper to load Wasm modules with fallback to ArrayBuffer compilation
async function compileWasmModule(url: string): Promise<WebAssembly.Module> {
  try {
    return await WebAssembly.compileStreaming(fetch(url));
  } catch (e) {
    console.warn(`[WasmClang] compileStreaming failed for ${url}, falling back to compile:`, e);
    const response = await fetch(url);
    const bytes = await response.arrayBuffer();
    return await WebAssembly.compile(bytes);
  }
}

// ─── Engine Initialization ────────────────────────────────────────────────────

/**
 * Initialize the Wasm Clang engine.
 * Downloads and caches the Clang Wasm modules and sysroot libraries.
 */
async function doInit(): Promise<void> {
  try {
    console.log('[WasmClang] Initializing Clang-Wasm engine...');

    const memfsUrl = '/wasm-clang/memfs.wasm';
    const clangUrl = '/wasm-clang/clang.wasm';
    const lldUrl = '/wasm-clang/lld.wasm';
    const sysrootUrl = '/wasm-clang/sysroot.tar';

    // Load Wasm modules
    console.log('[WasmClang] Fetching and compiling Wasm compiler modules...');
    const [memfsMod, clangMod, lldMod, sysrootData] = await Promise.all([
      compileWasmModule(memfsUrl),
      compileWasmModule(clangUrl),
      compileWasmModule(lldUrl),
      fetch(sysrootUrl).then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch sysroot.tar: HTTP ${r.status}`);
        return r.arrayBuffer();
      }),
    ]);

    memfsModule = memfsMod;
    clangModule = clangMod;
    lldModule = lldMod;
    sysrootBuffer = sysrootData;

    console.log('[WasmClang] Instantiating MemFS...');
    let initStderr = '';
    memfs = new MemFS(memfsModule, (text) => {
      initStderr += text;
    });
    await memfs.ready;

    console.log('[WasmClang] Unpacking standard library headers (sysroot.tar)...');
    const tar = new Tar(sysrootBuffer);
    tar.untar(memfs);

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
  if (!clangModule || !lldModule || !memfs) {
    return { success: false, stdout: '', stderr: 'Clang compiler modules not loaded' };
  }

  let compilerOutput = '';
  memfs.hostWrite = (text: string) => {
    compilerOutput += text;
  };

  try {
    const input = '/input.cpp';
    const obj = '/output.o';
    const wasm = '/output.wasm';

    memfs.addFile(input, source);

    // 1. Compile C++ code to an object file (.o)
    const clangArgs = [
      'clang',
      '-cc1',
      '-emit-obj',
      ...clangCommonArgs,
      '-O0',
      '-o', obj,
      '-x', 'c++',
      input
    ];

    const clangApp = await App.create(clangModule, memfs, clangArgs);
    await clangApp.run();

    // 2. Link object file into target Wasm executable
    const libdir = 'lib/wasm32-wasi';
    const crt1 = `${libdir}/crt1.o`;
    const stackSize = 1024 * 1024;

    const lldArgs = [
      'wasm-ld',
      '--no-threads',
      '--export-dynamic',
      '-z', `stack-size=${stackSize}`,
      `-L${libdir}`,
      crt1,
      obj,
      '-lc',
      '-lc++',
      '-lc++abi',
      '-o', wasm
    ];

    const lldApp = await App.create(lldModule, memfs, lldArgs);
    await lldApp.run();

    // 3. Extract final compiled Wasm executable
    const binary = memfs.getFileContents(wasm);

    return {
      success: true,
      stdout: '',
      stderr: compilerOutput,
      binary,
    };
  } catch (error: any) {
    console.error('[WasmClang] Compilation or linking failed:', error);
    return {
      success: false,
      stdout: '',
      stderr: compilerOutput || error.message || 'Unknown compilation error',
    };
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
  let currentLogs: { type: 'log' | 'error'; message: string }[] = [];

  const traceRegex = /__TRACE__(\{.*?\})__TRACE__/g;
  let lastIndex = 0;
  let match;

  while ((match = traceRegex.exec(stdout)) !== null) {
    // Everything between lastIndex and match.index is normal stdout printed before this trace
    const normalText = stdout.slice(lastIndex, match.index);
    if (normalText) {
      const normalLines = normalText.split('\n');
      for (const line of normalLines) {
        if (line.trim()) {
          currentLogs.push({ type: 'log', message: line });
        }
      }
    }

    // Parse the trace data
    try {
      const traceData = JSON.parse(match[1]);
      timeline.push({
        line: traceData.line,
        variables: traceData.variables || {},
        callStack: ['main'],
        consoleOutput: [...currentLogs],
      });
      currentLogs = [];
    } catch {
      console.warn('[WasmClang] Skipped malformed trace block:', match[1]);
    }

    lastIndex = traceRegex.lastIndex;
  }

  // Handle any trailing normal output after the last trace
  const trailingText = stdout.slice(lastIndex);
  if (trailingText) {
    const trailingLines = trailingText.split('\n');
    for (const line of trailingLines) {
      if (line.trim()) {
        currentLogs.push({ type: 'log', message: line });
      }
    }
  }

  if (currentLogs.length > 0 && timeline.length > 0) {
    timeline[timeline.length - 1].consoleOutput.push(...currentLogs);
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
      // Remove /input.cpp path prefix
      .replace(/\/input\.cpp/g, 'main.cpp')
      // Remove verbose note lines
      .replace(/^note:.*$/gm, '')
      // Trim excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}
