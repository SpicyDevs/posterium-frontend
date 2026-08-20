import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onRegisteredSW(swScriptUrl, registration) {
    console.log('[PWA] Service worker registered:', swScriptUrl);
    if (registration?.waiting) {
      registration.waiting.addEventListener('statechange', (e) => {
        if (e.target && (e.target as ServiceWorker).state === 'activated') {
          // Announce the update before reloading so the builder can toast it.
          // A hard silent reload here would look like a crash mid-edit (and
          // could drop unsaved work without warning). The builder listens for
          // 'pwa-update-activated' and shows a "New version installed" toast.
          window.dispatchEvent(new CustomEvent('pwa-update-activated'));
          window.setTimeout(() => window.location.reload(), 900);
        }
      });
    }
  },
  onRegisterError(error) {
    console.error('[PWA] Service worker registration failed', error);
  },
});
