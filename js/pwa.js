const state = document.getElementById('offlineState');
const notice = document.getElementById('updateNotice');
let registration, installPrompt;
function offlineReady() { state.textContent = '✓ Pronta per giocare offline'; }
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).then(async reg => {
    registration = reg;
    // Only a complete, activated cache qualifies as offline ready.
    if (reg.active) offlineReady();
    if (reg.waiting) notice.hidden = false;
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) notice.hidden = false;
        if (worker.state === 'redundant') state.textContent = 'Download offline non riuscito. Riprova con una connessione.';
        if (worker.state === 'activated') offlineReady();
      });
    });
    await navigator.serviceWorker.ready;
    offlineReady();
  }).catch(() => { state.textContent = 'Offline non disponibile: apri da HTTPS o localhost.'; });
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) location.reload();
  });
  document.getElementById('updateApp').onclick = () => {
    if (!registration?.waiting) { notice.hidden = true; return; }
    // User has chosen to leave any current game.
    refreshing = true;
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  };
} else state.textContent = 'Questo browser non supporta il salvataggio offline.';
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); installPrompt = event;
  document.getElementById('installApp').hidden = false;
});
document.getElementById('installApp').onclick = async () => {
  if (!installPrompt) return;
  await installPrompt.prompt(); installPrompt = null;
  document.getElementById('installApp').hidden = true;
};
window.addEventListener('appinstalled', () => { document.getElementById('installApp').hidden = true; });
