import React from 'react';
import ReactDOM from 'react-dom/client';
import SidebarApp from './SidebarApp';
import { vscode } from './vscode';
import './sidebar.css';

// Follow the VS Code colour theme: the shared visualizers use Tailwind's `dark` class.
function syncTheme() {
  const body = document.body.classList;
  const dark = body.contains('vscode-dark') || (body.contains('vscode-high-contrast') && !body.contains('vscode-high-contrast-light'));
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.classList.add('theme-blue');
}
syncTheme();
new MutationObserver(syncTheme).observe(document.body, { attributes: true, attributeFilter: ['class'] });

// Anything that goes wrong in the view is reported to the AlgoViz output channel.
const report = (message: string) => vscode.postMessage({ type: 'webviewError', message });
window.addEventListener('error', (e) => report(`${e.message} @ ${e.filename}:${e.lineno}`));
window.addEventListener('unhandledrejection', (e) => report(`Unhandled: ${String(e.reason?.stack || e.reason)}`));

type BoundaryProps = { children: React.ReactNode };
class Boundary extends React.Component<BoundaryProps, { error: Error | null }> {
  declare props: BoundaryProps;
  declare setState: React.Component<BoundaryProps, { error: Error | null }>['setState'];
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    report(`${error.message}\n${error.stack || ''}`);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="avz-crash">
        <p>The visualizer hit a problem drawing this step.</p>
        <pre>{this.state.error.message}</pre>
        <button type="button" className="avz-button" onClick={() => this.setState({ error: null })}>
          Try again
        </button>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Boundary>
    <SidebarApp />
  </Boundary>,
);
