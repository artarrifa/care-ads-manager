/**
 * CareTech Games - PWA Registration & Install Handler
 * Non-invasive registration for /games/solitario/
 */

(function () {
  'use strict';

  // 1. Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/games/solitario/sw.js', { scope: '/games/solitario/' })
        .then((registration) => {
          console.log('[PWA-Solitario] ServiceWorker registrado con scope:', registration.scope);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  showUpdateToast();
                }
              });
            }
          });
        })
        .catch((error) => {
          console.warn('[PWA-Solitario] Error al registrar ServiceWorker:', error);
        });
    });
  }

  // 2. Install Banner Prompt Handling
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default mini-infobar on mobile Chrome
    e.preventDefault();
    deferredPrompt = e;

    const installBtn = document.getElementById('pwa-install-btn');
    const installBanner = document.getElementById('pwa-install-banner');
    if (installBtn) {
      installBtn.style.display = 'inline-flex';
      installBtn.onclick = () => triggerInstallPrompt();
    }
    if (installBanner) {
      installBanner.classList.remove('hidden');
    }
  });

  window.triggerInstallPrompt = function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA-Solitario] Usuario aceptó la instalación');
      }
      deferredPrompt = null;
      const installBtn = document.getElementById('pwa-install-btn');
      const installBanner = document.getElementById('pwa-install-banner');
      if (installBtn) installBtn.style.display = 'none';
      if (installBanner) installBanner.classList.add('hidden');
    });
  };

  // 3. Update Notification UI
  function showUpdateToast() {
    const existing = document.getElementById('pwa-update-toast');
    if (existing) return;

    const toast = document.createElement('div');
    toast.id = 'pwa-update-toast';
    toast.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #0d1f3d;
        color: #f8fafc;
        border: 1px solid #3b82f6;
        padding: 14px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 14px;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 0.9rem;
      ">
        <span>✨ Hay una nueva versión de Solitario Care disponible.</span>
        <button onclick="window.location.reload()" style="
          background: #2563eb;
          color: #fff;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        ">Actualizar</button>
      </div>
    `;
    document.body.appendChild(toast);
  }

  // 4. Online/Offline indicator helper
  window.addEventListener('online', () => {
    document.body.classList.remove('is-offline');
  });
  window.addEventListener('offline', () => {
    document.body.classList.add('is-offline');
  });
})();
