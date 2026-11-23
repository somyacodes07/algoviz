// Bridge to the VS Code webview API. acquireVsCodeApi may only be called once per page.

interface VsCodeApi {
  postMessage(message: unknown): void;
  getState<T>(): T | undefined;
  setState<T>(state: T): void;
}

declare const acquireVsCodeApi: (() => VsCodeApi) | undefined;

const fallback: VsCodeApi = {
  postMessage: (message) => console.debug('[algoviz → host]', message),
  getState: () => {
    try {
      return JSON.parse(localStorage.getItem('algoviz-view-state') || 'null') ?? undefined;
    } catch {
      return undefined;
    }
  },
  setState: (state) => {
    try {
      localStorage.setItem('algoviz-view-state', JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  },
};

export const vscode: VsCodeApi = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : fallback;

/** Messages sent from the extension host. */
export type HostMessage =
  | {
      type: 'run';
      code: string;
      language: 'c++' | 'javascript';
      fileName: string;
      keepStep: boolean;
      cppCompiler: 'api' | 'wasm';
      speed: number;
    }
  | { type: 'control'; action: 'next' | 'prev' | 'play' | 'pause'; line?: undefined }
  | { type: 'control'; action: 'runToLine'; line: number }
  | { type: 'breakpoints'; lines: number[] }
  | { type: 'stale'; stale: boolean }
  | { type: 'config'; cppCompiler: 'api' | 'wasm'; speed: number }
  | { type: 'activeFile'; fileName: string | null; language: 'c++' | 'javascript' | null }
  | { type: 'clear' };
