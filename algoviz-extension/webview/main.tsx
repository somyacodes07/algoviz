import React from 'react';
import ReactDOM from 'react-dom/client';
import SidebarApp from './SidebarApp';
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SidebarApp />
  </React.StrictMode>,
);
