// Indépendant de Firebase : l'installation et le solo restent disponibles hors ligne.
const button = document.querySelector('#installApp');
const status = document.querySelector('#installStatus');
const standalone = window.matchMedia('(display-mode: standalone)');
let promptEvent = null;
const installed = () => standalone.matches || navigator.standalone === true;
function render() { button.hidden = installed(); button.closest('.install-bar').hidden = installed(); }
render();
standalone.addEventListener('change', render);
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  promptEvent = event;
  render();
});
window.addEventListener('appinstalled', () => {
  promptEvent = null;
  button.hidden = true;
  status.textContent = 'Bibi Quizz est installé.';
});
button.addEventListener('click', async () => {
  if (promptEvent) {
    const event = promptEvent;
    promptEvent = null;
    button.disabled = true;
    try {
      await event.prompt();
      const choice = await event.userChoice;
      status.textContent = choice.outcome === 'accepted' ? 'Installation demandée…' : 'Tu peux installer le jeu plus tard.';
    } catch { status.textContent = 'Utilise le menu de ton navigateur pour installer le jeu.'; }
    finally { button.disabled = false; }
    return;
  }
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  document.querySelector('#installInstructions').textContent = ios
    ? 'Sur iPhone ou iPad, ouvre ce site dans Safari, touche Partager puis « Sur l’écran d’accueil » et confirme avec « Ajouter ».'
    : 'Ouvre le menu de ton navigateur et cherche « Installer l’application » ou « Ajouter à l’écran d’accueil ». Sur Safari Mac, utilise Fichier → Ajouter au Dock. Si cette option est absente, essaie Chrome ou Edge.';
  document.querySelector('#installHelp').showModal();
});
if ('serviceWorker' in navigator && window.isSecureContext) {
  const register = () => navigator.serviceWorker.register(new URL('../sw.js', import.meta.url), { updateViaCache: 'none' })
    .catch(() => { status.textContent = 'Le mode hors ligne n’est pas disponible pour le moment.'; });
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}

// Safari/iOS : la hauteur visible change avec les barres et le clavier.
function syncViewport() {
  const height = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty('--app-height', Math.round(height) + 'px');
}
syncViewport();
window.addEventListener('resize', syncViewport);
window.visualViewport?.addEventListener('resize', syncViewport);
