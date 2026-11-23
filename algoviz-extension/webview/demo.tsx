// Dev-only page for README screenshots: a code listing beside the real sidebar app.
// URL: demo.html?sample=bubble&step=12
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

const SAMPLES: Record<string, { file: string; code: string }> = {
  bubble: {
    file: 'bubblesort.cpp',
    code: `#include <iostream>
using namespace std;

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
            }
        }
    }
}

int main() {
    int n = 6;
    int arr[6] = {5, 2, 9, 1, 7, 3};
    bubbleSort(arr, n);
    return 0;
}`,
  },
  queue: {
    file: 'queue.cpp',
    code: `#include <iostream>
using namespace std;

class Queue {
    int data[6];
    int front = 0, rear = -1;
public:
    void enqueue(int x) {
        data[++rear] = x;
    }
    int dequeue() {
        return data[front++];
    }
};

int main() {
    Queue q;
    q.enqueue(10);
    q.enqueue(20);
    q.enqueue(30);
    q.dequeue();
    q.enqueue(40);
    return 0;
}`,
  },
  bst: {
    file: 'bst.cpp',
    code: `#include <iostream>
using namespace std;

struct Node {
    int val;
    Node *left, *right;
    Node(int v) : val(v), left(nullptr), right(nullptr) {}
};

Node* insert(Node* root, int v) {
    if (!root) return new Node(v);
    if (v < root->val) root->left = insert(root->left, v);
    else root->right = insert(root->right, v);
    return root;
}

int main() {
    Node* root = nullptr;
    int vals[] = {50, 30, 70, 20, 40, 60, 80};
    for (int v : vals) root = insert(root, v);
    return 0;
}`,
  },
};

const params = new URLSearchParams(location.search);
const sample = SAMPLES[params.get('sample') || 'bubble'];
const target = Number(params.get('step') || 0);

const THEME: Record<string, string> = {
  '--vscode-font-family': '-apple-system, BlinkMacSystemFont, sans-serif', '--vscode-font-size': '13px',
  '--vscode-editor-font-family': 'Menlo, monospace', '--vscode-editor-font-size': '12px',
  '--vscode-foreground': '#cccccc', '--vscode-descriptionForeground': '#9d9d9d', '--vscode-sideBar-background': '#181818',
  '--vscode-editor-background': '#1f1f1f', '--vscode-editorWidget-background': '#202020', '--vscode-input-background': '#2a2a2a',
  '--vscode-input-border': '#3c3c3c', '--vscode-editorWidget-border': '#555555', '--vscode-panel-border': '#2b2b2b',
  '--vscode-sideBarSectionHeader-background': '#181818', '--vscode-sideBarSectionHeader-border': '#2b2b2b',
  '--vscode-button-background': '#0078d4', '--vscode-button-foreground': '#ffffff', '--vscode-badge-background': '#616161',
  '--vscode-badge-foreground': '#f8f8f8', '--vscode-icon-foreground': '#cccccc', '--vscode-list-hoverBackground': '#2a2d2e',
  '--vscode-progressBar-background': '#0078d4', '--vscode-scrollbarSlider-background': '#79797966',
  '--vscode-editor-stackFrameHighlightBackground': '#ffff0033', '--vscode-dropdown-background': '#313131',
  '--vscode-dropdown-foreground': '#cccccc', '--vscode-dropdown-border': '#3c3c3c', '--vscode-textLink-foreground': '#4daafc',
  '--vscode-debugTokenExpression-name': '#c586c0', '--vscode-debugTokenExpression-number': '#b5cea8',
  '--vscode-focusBorder': '#0078d4', '--vscode-editorWarning-foreground': '#cca700',
};
Object.entries(THEME).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
(window as any).__WEBVIEW_URI__ = location.origin;

// Stand-in for the extension host.
let setLine: (n: number, inline?: string) => void = () => {};
let stepsSent = false;
(window as any).acquireVsCodeApi = () => ({
  getState: () => undefined,
  setState: () => {},
  postMessage: (m: any) => {
    if (m.type === 'ready') {
      window.postMessage({ type: 'run', code: sample.code, language: 'c++', fileName: sample.file, keepStep: false, cppCompiler: 'wasm', speed: 600 }, '*');
    } else if (m.type === 'runState' && m.status === 'ready' && !stepsSent) {
      stepsSent = true;
      // Negative steps count back from the end (-2 = just before main returns).
      const steps = target < 0 ? Math.max(0, (m.total ?? 0) + target) : target;
      for (let i = 0; i < steps; i++) window.postMessage({ type: 'control', action: 'next' }, '*');
      setTimeout(() => (document.title = 'done'), 900);
    } else if (m.type === 'step') {
      setLine(m.line, m.inline);
    }
  },
});

function Code() {
  const [state, setState] = useState<{ line: number; inline?: string }>({ line: 0 });
  useEffect(() => {
    setLine = (line, inline) => setState({ line, inline });
  }, []);
  return (
    <pre className="demo-code">
      {sample.code.split('\n').map((text, i) => (
        <div key={i} className={`demo-line ${state.line === i + 1 ? 'is-current' : ''}`}>
          <span className="demo-gutter">{state.line === i + 1 ? '▶' : ''}</span>
          <span className="demo-num">{i + 1}</span>
          <span>{text || ' '}</span>
          {state.line === i + 1 && state.inline && <span className="demo-inline">{state.inline}</span>}
        </div>
      ))}
    </pre>
  );
}

const style = document.createElement('style');
style.textContent = `
  html, body { margin: 0; height: 100%; background: #181818; }
  *, *::before, *::after { transition: none !important; animation: none !important; }
  #demo { display: grid; grid-template-columns: 1fr 380px; height: 100vh; }
  .demo-code { margin: 0; padding: 14px 0; background: #1f1f1f; color: #d4d4d4; font: 12.5px/19px Menlo, monospace; overflow: hidden; border-right: 1px solid #2b2b2b; }
  .demo-line { display: flex; white-space: pre; }
  .demo-line.is-current { background: #ffff0026; }
  .demo-gutter { width: 18px; color: #ffcc00; text-align: center; font-size: 10px; }
  .demo-num { width: 30px; color: #6e7681; text-align: right; padding-right: 14px; }
  .demo-inline { margin-left: 2.5em; color: #8b949e; font-style: italic; }
  .demo-side { height: 100vh; overflow: hidden; }
`;
document.head.appendChild(style);

(async () => {
  await import('./sidebar.css');
  const { default: SidebarApp } = await import('./SidebarApp');
  ReactDOM.createRoot(document.getElementById('demo')!).render(
    <>
      <Code />
      <div className="demo-side" id="root">
        <SidebarApp />
      </div>
    </>,
  );
})();
