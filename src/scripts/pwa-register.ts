import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onRegisteredSW(swScriptUrl, registration) {
    console.log('[PWA] Service worker registered:', swScriptUrl);
    if (registration?.waiting) {
      registration.waiting.addEventListener('statechange', (e) => {
        if (e.target && (e.target as ServiceWorker).state === 'activated') {
          window.location.reload();
        }
      });
    }
  },
  onRegisterError(error) {
    console.error('[PWA] Service worker registration failed', error);
  },
});