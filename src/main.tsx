import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import {LanguageProvider} from './i18n/LanguageContext.tsx';
import './index.css';

declare global {
  interface Window {
    __lightvianaOfflineReady?: boolean;
  }
}

if (
  typeof window !== 'undefined' &&
  (window.location.protocol === 'http:' || window.location.protocol === 'https:') &&
  'serviceWorker' in navigator
) {
  try {
    registerSW({
      immediate: true,
      onOfflineReady() {
        window.__lightvianaOfflineReady = true;
        window.dispatchEvent(new CustomEvent('lightviana:offline-ready'));
      },
    });
  } catch {
    // Ignore Service Worker registration errors in restricted environments
  }
}

createRoot(document.getElementById('root')!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>,
);
