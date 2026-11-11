import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// The installed Android app serves its own bundled files. Do not let an old
// PWA service worker serve a stale screen or JavaScript bundle inside Capacitor.
const isNativeApp = window.location.hostname === 'localhost' || window.location.protocol === 'capacitor:';

if ('serviceWorker' in navigator) {
  if (isNativeApp) {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => {});
    if ('caches' in window) {
      caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name)))).catch(() => {});
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}
