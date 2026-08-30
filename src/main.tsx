import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {AppErrorBoundary} from './components/AppErrorBoundary';
import {reconcileReleaseSkew} from './lib/releaseSkew';
import './index.css';

const releaseId = import.meta.env.VITE_BUILD_ID;
if (typeof releaseId === 'string' && releaseId.length > 0 && !releaseId.startsWith('%')) {
  document.documentElement.dataset.skuggleRelease = releaseId;
}

window.addEventListener('vite:preloadError', ((event: Event) => {
  event.preventDefault();
  const key = 'skuggle-vite-reload';
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, '1');
    window.location.reload();
  }
}) as EventListener);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);

sessionStorage.removeItem('skuggle-vite-reload');
void reconcileReleaseSkew();

// Defer service worker cleanup to after initial render
if ('serviceWorker' in navigator) {
  requestIdleCallback(() => {
    void (async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    })();
  }, { timeout: 3000 });
}
