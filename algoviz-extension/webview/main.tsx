import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../../App';
import '../../index.css';

// Optionally, we can intercept fetch calls or use vscode postMessage API here to communicate with the extension

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
