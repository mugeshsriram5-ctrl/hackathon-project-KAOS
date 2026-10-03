export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('KAOS Vault ServiceWorker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('KAOS ServiceWorker registration failed:', err);
        });
    });
  }
}
