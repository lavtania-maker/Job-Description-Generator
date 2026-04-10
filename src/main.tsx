import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('[v0] main.tsx mounted');
console.log('[v0] window.location.href:', window.location.href);
console.log('[v0] window.location.pathname:', window.location.pathname);
console.log('[v0] document.readyState:', document.readyState);

const rootEl = document.getElementById('root');
console.log('[v0] root element found:', !!rootEl);

createRoot(rootEl!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
