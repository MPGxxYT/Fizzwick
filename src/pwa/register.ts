// Registers the service worker in production builds, after the page has
// loaded so it doesn't compete with the first render. The dev server has none.
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // No service worker (blocked, or plain HTTP): the app still works online.
    })
  })
}
