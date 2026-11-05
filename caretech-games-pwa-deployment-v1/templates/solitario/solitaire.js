/**
 * Solitario Care - Production Klondike Engine (Mobile Layout & Large Format Cards)
 * CareTech Games PWA Edition - 100% Offline & Local-First
 */

(function () {
  'use strict';

  // Constants
  const SUITS = [
    { name: 'hearts', symbol: '♥', color: 'red' },
    { name: 'diamonds', symbol: '♦', color: 'red' },
    { name: 'clubs', symbol: '♣', color: 'black' },
    { name: 'spades', symbol: '♠', color: 'black' }
  ];

  const RANKS = [
    { value: 1, label: 'A' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
    { value: 6, label: '6' },
    { value: 7, label: '7' },
    { value: 8, label: '8' },
    { value: 9, label: '9' },
    { value: 10, label: '10' },
    { value: 11, label: 'J' },
    { value: 12, label: 'Q' },
    { value: 13, label: 'K' }
  ];

  // Game State
  const state = {
    stock: [],
    waste: [],
    foundations: [[], [], [], []], // 0: Hearts, 1: Diamonds, 2: Clubs, 3: Spades
    tableau: [[], [], [], [], [], [], []],
    history: [],
    score: 0,
    moves: 0,
    timeSeconds: 0,
    timerInterval: null,
    isPlaying: false,
    drawMode: 1, // 1 or 3
    soundEnabled: true,
    theme: 'theme-classic-green',
    deck: 'deck-blue',
    cardStyle: 'accessible',
    isAutoCompleting: false
  };

  let dragState = null;
  const els = {};

  // Web Audio Synthesizer (Zero external assets needed, 100% offline)
  const audio = {
    ctx: null,
    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
    },
    unlock() {
      try {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      } catch (e) {}
    },
    playCard() {
      if (!state.soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
      } catch (e) {}
    },
    playSuccess() {
      if (!state.soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.08);
          gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.08 + 0.18);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(this.ctx.currentTime + idx * 0.08);
          osc.stop(this.ctx.currentTime + idx * 0.08 + 0.22);
        });
      } catch (e) {}
    },
    playWin() {
      if (!state.soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const fanfares = [
          { f: 523.25, t: 0 }, { f: 659.25, t: 0.15 }, { f: 783.99, t: 0.3 },
          { f: 1046.5, t: 0.45 }, { f: 880, t: 0.6 }, { f: 1046.5, t: 0.8 }
        ];
        fanfares.forEach(({ f, t }) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(f, this.ctx.currentTime + t);
          gain.gain.setValueAtTime(0.15, this.ctx.currentTime + t);
          gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + t + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(this.ctx.currentTime + t);
          osc.stop(this.ctx.currentTime + t + 0.28);
        });
      } catch (e) {}
    }
  };

  function initElements() {
    els.stock = document.getElementById('stock-slot');
    els.waste = document.getElementById('waste-slot');
    els.foundations = [
      document.getElementById('foundation-0'),
      document.getElementById('foundation-1'),
      document.getElementById('foundation-2'),
      document.getElementById('foundation-3')
    ];
    els.tableau = [
      document.getElementById('tableau-0'),
      document.getElementById('tableau-1'),
      document.getElementById('tableau-2'),
      document.getElementById('tableau-3'),
      document.getElementById('tableau-4'),
      document.getElementById('tableau-5'),
      document.getElementById('tableau-6')
    ];
    els.score = document.getElementById('score-val');
    els.moves = document.getElementById('moves-val');
    els.timer = document.getElementById('timer-val');
    els.navUndoBtn = document.getElementById('nav-undo-btn');
    els.navHintBtn = document.getElementById('nav-hint-btn');
    els.navNewGameBtn = document.getElementById('nav-newgame-btn');
    els.navSettingsBtn = document.getElementById('nav-settings-btn');
    els.navStatsBtn = document.getElementById('nav-stats-btn');
    els.settingsModal = document.getElementById('settings-modal');
    els.closeSettingsBtn = document.getElementById('close-settings');
    els.statsModal = document.getElementById('stats-modal');
    els.closeStatsBtn = document.getElementById('close-stats');
    els.drawSelect = document.getElementById('draw-mode-select');
    els.soundSelect = document.getElementById('sound-select');
    els.victoryModal = document.getElementById('victory-modal');
    els.victoryRestart = document.getElementById('victory-restart');
    els.confettiCanvas = document.getElementById('confetti-canvas');
  }

  // ==============================================================================
  // CARETECH ADS & TELEMETRY SERVICE (Local-first)
  // ==============================================================================
  const CareAdsService = {
    activeAds: { top: null, bottom: null },

    async init() {
      this.checkNewDeviceActivation();
      this.bindAdClickTracking();
      this.syncAds();
      setInterval(() => this.syncAds(), 60000);
    },

    checkNewDeviceActivation() {
      const activated = localStorage.getItem('care_games_device_activated');
      if (!activated) {
        localStorage.setItem('care_games_device_activated', 'true');
        this.trackEvent('new_device_activation', { gameId: 'solitario' });
      }

      window.addEventListener('appinstalled', () => {
        this.trackEvent('pwa_installed', { gameId: 'solitario' });
      });
    },

    async syncAds() {
      const now = Date.now();
      try {
        const topRes = await fetch('/api/v1/ads/solitario/top').catch(() => null);
        if (topRes && topRes.ok) {
          const topData = await topRes.json();
          this.activeAds.top = topData;
          localStorage.setItem('care_cached_ad_top', JSON.stringify({ data: topData, time: now }));
        }

        const btmRes = await fetch('/api/v1/ads/solitario/bottom').catch(() => null);
        if (btmRes && btmRes.ok) {
          const btmData = await btmRes.json();
          this.activeAds.bottom = btmData;
          localStorage.setItem('care_cached_ad_bottom', JSON.stringify({ data: btmData, time: now }));
        }
      } catch (e) {}

      this.renderAdBanner('top');
      this.renderAdBanner('bottom');
    },

    renderAdBanner(placement) {
      const bannerEl = document.getElementById(`${placement}-ad-banner`);
      if (!bannerEl) return;

      let ad = this.activeAds[placement];
      if (!ad) {
        const cached = localStorage.getItem(`care_cached_ad_${placement}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.time < 24 * 3600 * 1000) {
              ad = parsed.data;
            }
          } catch {}
        }
      }

      if (!ad) return;

      const headlineEl = document.getElementById(`${placement}-ad-headline`);
      const subtextEl = document.getElementById(`${placement}-ad-subtext`);
      const webBtn = document.getElementById(`${placement}-ad-web-btn`);
      const donateBtn = document.getElementById(`${placement}-ad-donate-btn`);
      const shopBtn = document.getElementById(`${placement}-ad-shop-btn`);

      if (headlineEl && ad.headline) headlineEl.textContent = ad.headline;
      if (subtextEl && ad.description) subtextEl.textContent = ad.description;

      if (webBtn && ad.webUrl) {
        webBtn.href = ad.webUrl;
        webBtn.style.display = 'inline-flex';
      }
      if (donateBtn) {
        if (ad.donationUrl) {
          donateBtn.href = ad.donationUrl;
          donateBtn.style.display = 'inline-flex';
        } else {
          donateBtn.style.display = 'none';
        }
      }
      if (shopBtn) {
        if (ad.shopUrl) {
          shopBtn.href = ad.shopUrl;
          shopBtn.style.display = 'inline-flex';
        } else {
          shopBtn.style.display = 'none';
        }
      }
    },

    bindAdClickTracking() {
      ['top', 'bottom'].forEach(placement => {
        const webBtn = document.getElementById(`${placement}-ad-web-btn`);
        const donateBtn = document.getElementById(`${placement}-ad-donate-btn`);
        const shopBtn = document.getElementById(`${placement}-ad-shop-btn`);

        if (webBtn) webBtn.addEventListener('click', () => this.trackEvent('ad_click', { gameId: 'solitario', placement }));
        if (donateBtn) donateBtn.addEventListener('click', () => this.trackEvent('ad_donation_click', { gameId: 'solitario', placement }));
        if (shopBtn) shopBtn.addEventListener('click', () => this.trackEvent('ad_shop_click', { gameId: 'solitario', placement }));
      });
    },

    trackEvent(eventType, metadata = {}) {
      const payload = {
        eventType,
        gameId: metadata.gameId || 'solitario',
        placement: metadata.placement || 'top',
        timestamp: Math.floor(Date.now() / 1000)
      };

      if (navigator.onLine && navigator.sendBeacon) {
        navigator.sendBeacon('/api/v1/analytics/track', JSON.stringify({ events: [payload] }));
      }
    }
  };

  // =========================================================================
  // Native Dual Storage Engine: LocalStorage + IndexedDB for 100% Offline Game State
  // =========================================================================
  const GameStorage = {
    LOCAL_KEY: 'care_solitaire_saved_game',
    DB_NAME: 'CareTechSolitaireDB',
    DB_VERSION: 1,
    STORE_NAME: 'gameState',

    save(gameState) {
      // 1. Direct synchronous save in LocalStorage (instant, zero overhead)
      try {
        localStorage.setItem(this.LOCAL_KEY, JSON.stringify(gameState));
      } catch (err) {
        console.warn('[Solitaire Care] Error en LocalStorage save:', err);
      }

      // 2. Direct asynchronous mirror in IndexedDB
      this.saveToIndexedDB(gameState);
    },

    load() {
      try {
        const raw = localStorage.getItem(this.LOCAL_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.tableau && Array.isArray(parsed.tableau)) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('[Solitaire Care] Error en LocalStorage load:', err);
      }
      return null;
    },

    clear() {
      try {
        localStorage.removeItem(this.LOCAL_KEY);
      } catch (err) {}
      this.clearIndexedDB();
    },

    saveToIndexedDB(gameState) {
      if (!window.indexedDB) return;
      try {
        const req = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.STORE_NAME)) {
            db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          }
        };
        req.onsuccess = (e) => {
          const db = e.target.result;
          try {
            const tx = db.transaction(this.STORE_NAME, 'readwrite');
            tx.objectStore(this.STORE_NAME).put({
              id: 'active_game',
              ...gameState,
              updatedAt: Date.now()
            });
          } catch (txErr) {}
        };
      } catch (e) {}
    },

    clearIndexedDB() {
      if (!window.indexedDB) return;
      try {
        const req = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);
        req.onsuccess = (e) => {
          const db = e.target.result;
          if (db.objectStoreNames.contains(this.STORE_NAME)) {
            try {
              const tx = db.transaction(this.STORE_NAME, 'readwrite');
              tx.objectStore(this.STORE_NAME).delete('active_game');
            } catch (err) {}
          }
        };
      } catch (e) {}
    }
  };

  function saveCurrentGame() {
    if (state.isAutoCompleting) return;
    if (!state.tableau || state.tableau.length !== 7) return;

    // Solo guardar si hay progreso real (movimientos, cartas o tiempo)
    const hasProgress = state.moves > 0 || state.waste.length > 0 || state.timeSeconds > 0;
    if (!hasProgress) return;

    const snapshot = {
      version: 1,
      stock: state.stock,
      waste: state.waste,
      foundations: state.foundations,
      tableau: state.tableau,
      score: state.score,
      moves: state.moves,
      timeSeconds: state.timeSeconds,
      drawMode: state.drawMode,
      history: (state.history || []).slice(-15),
      timestamp: Date.now()
    };
    GameStorage.save(snapshot);
  }

  function restoreSavedGame() {
    const saved = GameStorage.load();
    if (!saved || !saved.tableau || !Array.isArray(saved.tableau) || saved.tableau.length !== 7) {
      return false;
    }

    const countStock = saved.stock ? saved.stock.length : 0;
    const countWaste = saved.waste ? saved.waste.length : 0;
    const countFoundations = saved.foundations ? saved.foundations.reduce((acc, f) => acc + f.length, 0) : 0;
    const countTableau = saved.tableau ? saved.tableau.reduce((acc, col) => acc + col.length, 0) : 0;
    const totalCards = countStock + countWaste + countFoundations + countTableau;

    if (totalCards !== 52) {
      console.warn('[Solitaire Care] Partida guardada no válida (total cartas != 52). Descartando.');
      GameStorage.clear();
      return false;
    }

    clearInterval(state.timerInterval);
    state.stock = saved.stock || [];
    state.waste = saved.waste || [];
    state.foundations = saved.foundations || [[], [], [], []];
    state.tableau = saved.tableau;
    state.score = typeof saved.score === 'number' ? saved.score : 0;
    state.moves = typeof saved.moves === 'number' ? saved.moves : 0;
    state.timeSeconds = typeof saved.timeSeconds === 'number' ? saved.timeSeconds : 0;
    state.drawMode = saved.drawMode || state.drawMode;
    state.history = Array.isArray(saved.history) ? saved.history : [];
    state.isPlaying = false;
    state.isAutoCompleting = false;

    if (els.victoryModal) els.victoryModal.classList.remove('active');
    stopConfetti();

    if (els.drawSelect) els.drawSelect.value = state.drawMode.toString();

    updateTimerDisplay();
    render();
    updateUI();
    showResumeToast();
    return true;
  }

  function showResumeToast() {
    let toast = document.getElementById('care-resume-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'care-resume-toast';
      toast.style.cssText = 'position:fixed;bottom:84px;left:50%;transform:translateX(-50%) translateY(20px);background:rgba(13,34,66,0.95);color:#38bdf8;border:1px solid rgba(56,189,248,0.45);padding:10px 18px;border-radius:9999px;font-family:\'Plus Jakarta Sans\',sans-serif;font-size:13px;font-weight:700;box-shadow:0 10px 25px rgba(0,0,0,0.5);display:flex;align-items:center;gap:8px;z-index:99999;opacity:0;transition:opacity 0.3s ease,transform 0.3s ease;pointer-events:none;';
      toast.innerHTML = '<i class="fa-solid fa-rotate-right"></i> <span>Partida anterior reanudada</span>';
      document.body.appendChild(toast);
    }

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
      setTimeout(() => {
        if (toast) {
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(-50%) translateY(20px)';
        }
      }, 2600);
    });
  }

  // Initialize
  function init() {
    initElements();
    loadSettings();
    bindEvents();
    bindCustomizationSwatches();
    const resumed = restoreSavedGame();
    if (!resumed) {
      startNewGame();
    }
    CareAdsService.init();
  }

  function updateSoundButtonUI() {
    const btn = document.getElementById('sound-toggle-btn');
    if (!btn) return;
    if (state.soundEnabled) {
      btn.style.background = '#10b981';
      btn.style.color = '#ffffff';
      btn.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.4)';
      btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> <span id="sound-toggle-label">Activado</span>';
    } else {
      btn.style.background = 'rgba(255, 255, 255, 0.14)';
      btn.style.color = '#94a3b8';
      btn.style.boxShadow = 'none';
      btn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> <span id="sound-toggle-label">Silencio</span>';
    }
  }

  function loadSettings() {
    const savedDraw = localStorage.getItem('care_solitaire_draw');
    if (savedDraw) state.drawMode = parseInt(savedDraw, 10);
    if (els.drawSelect) els.drawSelect.value = state.drawMode.toString();

    const savedSound = localStorage.getItem('care_solitaire_sound');
    if (savedSound !== null) state.soundEnabled = savedSound === 'true';
    updateSoundButtonUI();

    const savedTheme = localStorage.getItem('care_selected_theme') || localStorage.getItem('care_solitaire_theme') || 'theme-care-green';
    const savedDeck = localStorage.getItem('care_solitaire_deck') || 'deck-blue';
    const savedCardStyle = localStorage.getItem('care_solitaire_card_style') || 'accessible';
    setTheme(savedTheme);
    setDeck(savedDeck);
    setCardStyle(savedCardStyle);
  }

  function setTheme(theme) {
    state.theme = theme;
    localStorage.setItem('care_solitaire_theme', theme);
    localStorage.setItem('care_selected_theme', theme);
    document.body.className = `${state.theme} ${state.deck}`;
    document.querySelectorAll('#bg-swatches .swatch-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-theme') === theme);
    });
  }

  function setDeck(deck) {
    state.deck = deck;
    localStorage.setItem('care_solitaire_deck', deck);
    document.body.className = `${state.theme} ${state.deck}`;
    document.querySelectorAll('#deck-swatches .swatch-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-deck') === deck);
    });
    if (typeof render === 'function') render();
  }

  function setCardStyle(cardStyle) {
    state.cardStyle = cardStyle;
    localStorage.setItem('care_solitaire_card_style', cardStyle);
    document.querySelectorAll('#card-style-swatches .swatch-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-card-style') === cardStyle);
    });
    if (typeof render === 'function') render();
  }

  function bindCustomizationSwatches() {
    document.querySelectorAll('#bg-swatches .swatch-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const theme = el.getAttribute('data-theme');
        if (theme) setTheme(theme);
      });
    });

    document.querySelectorAll('#deck-swatches .swatch-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const deck = el.getAttribute('data-deck');
        if (deck) setDeck(deck);
      });
    });

    document.querySelectorAll('#card-style-swatches .swatch-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const style = el.getAttribute('data-card-style');
        if (style) setCardStyle(style);
      });
    });
  }

  function createDeck() {
    const deck = [];
    let id = 1;
    for (let sIdx = 0; sIdx < SUITS.length; sIdx++) {
      const suit = SUITS[sIdx];
      for (let rIdx = 0; rIdx < RANKS.length; rIdx++) {
        const rank = RANKS[rIdx];
        deck.push({
          id: id++,
          suitIndex: sIdx,
          suit: suit.name,
          symbol: suit.symbol,
          color: suit.color,
          value: rank.value,
          label: rank.label,
          faceUp: false
        });
      }
    }
    return deck;
  }

  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function startNewGame() {
    GameStorage.clear();
    clearInterval(state.timerInterval);
    state.timeSeconds = 0;
    state.moves = 0;
    state.score = 0;
    state.history = [];
    state.isPlaying = false;
    state.isAutoCompleting = false;

    // Track total games played
    const totalPlayed = parseInt(localStorage.getItem('care_solitaire_played') || '0', 10) + 1;
    localStorage.setItem('care_solitaire_played', totalPlayed.toString());

    if (els.victoryModal) els.victoryModal.classList.remove('active');
    stopConfetti();

    const deck = shuffle(createDeck());

    state.stock = [];
    state.waste = [];
    state.foundations = [[], [], [], []];
    state.tableau = [[], [], [], [], [], [], []];

    for (let col = 0; col < 7; col++) {
      for (let i = 0; i <= col; i++) {
        const card = deck.pop();
        card.faceUp = (i === col);
        state.tableau[col].push(card);
      }
    }

    while (deck.length > 0) {
      const card = deck.pop();
      card.faceUp = false;
      state.stock.push(card);
    }

    updateTimerDisplay();
    render();
    updateUI();
  }

  function startTimerIfNeeded() {
    if (!state.isPlaying) {
      state.isPlaying = true;
      state.timerInterval = setInterval(() => {
        state.timeSeconds++;
        updateTimerDisplay();
      }, 1000);
    }
  }

  function updateTimerDisplay() {
    const mins = Math.floor(state.timeSeconds / 60);
    const secs = (state.timeSeconds % 60).toString().padStart(2, '0');
    if (els.timer) els.timer.textContent = `${mins}:${secs}`;
  }

  function pushState() {
    const snapshot = {
      stock: JSON.parse(JSON.stringify(state.stock)),
      waste: JSON.parse(JSON.stringify(state.waste)),
      foundations: JSON.parse(JSON.stringify(state.foundations)),
      tableau: JSON.parse(JSON.stringify(state.tableau)),
      score: state.score,
      moves: state.moves
    };
    state.history.push(snapshot);
    if (state.history.length > 50) state.history.shift();
  }

  function undo() {
    if (state.history.length === 0) return;
    const prev = state.history.pop();
    state.stock = prev.stock;
    state.waste = prev.waste;
    state.foundations = prev.foundations;
    state.tableau = prev.tableau;
    state.score = Math.max(0, prev.score - 10);
    state.moves = prev.moves + 1;
    audio.playCard();
    render();
    updateUI();
  }

  function drawStock() {
    startTimerIfNeeded();
    pushState();

    if (state.stock.length === 0) {
      if (state.waste.length === 0) return;
      while (state.waste.length > 0) {
        const card = state.waste.pop();
        card.faceUp = false;
        state.stock.push(card);
      }
      state.score = Math.max(0, state.score - 20);
    } else {
      const count = Math.min(state.drawMode, state.stock.length);
      for (let i = 0; i < count; i++) {
        const card = state.stock.pop();
        card.faceUp = true;
        state.waste.push(card);
      }
    }

    state.moves++;
    audio.playCard();
    render();
    updateUI();
  }

  function canMoveToFoundation(card, foundationIndex) {
    const pile = state.foundations[foundationIndex];
    if (pile.length === 0) return card.value === 1;
    const top = pile[pile.length - 1];
    return card.suit === top.suit && card.value === top.value + 1;
  }

  function canMoveToTableau(card, tableauIndex) {
    const pile = state.tableau[tableauIndex];
    if (pile.length === 0) return card.value === 13;
    const top = pile[pile.length - 1];
    if (!top.faceUp) return false;
    return card.color !== top.color && card.value === top.value - 1;
  }

  function tryAutoMoveCard(source, sourceIndex, cardIndex) {
    startTimerIfNeeded();
    let card, cardsToMove;

    if (source === 'waste') {
      if (state.waste.length === 0) return false;
      card = state.waste[state.waste.length - 1];
      cardsToMove = [card];
    } else if (source === 'tableau') {
      const pile = state.tableau[sourceIndex];
      if (!pile || cardIndex >= pile.length) return false;
      card = pile[cardIndex];
      if (!card.faceUp) {
        // If it's face-down and top of pile, flip it
        if (cardIndex === pile.length - 1) {
          card.faceUp = true;
          state.score += 5;
          render();
          return true;
        }
        return false;
      }
      cardsToMove = pile.slice(cardIndex);
    } else if (source === 'foundation') {
      const pile = state.foundations[sourceIndex];
      if (!pile || pile.length === 0) return false;
      card = pile[pile.length - 1];
      cardsToMove = [card];
    } else {
      return false;
    }

    // 1. Try foundations first if single card
    if (cardsToMove.length === 1 && source !== 'foundation') {
      for (let fIdx = 0; fIdx < 4; fIdx++) {
        if (canMoveToFoundation(card, fIdx)) {
          pushState();
          executeMove(source, sourceIndex, cardIndex, 'foundation', fIdx);
          state.score += 10;
          state.moves++;
          audio.playSuccess();
          checkAutoFlip(source, sourceIndex);
          render();
          updateUI();
          checkWinCondition();
          return true;
        }
      }
    }

    // 2. Try tableau
    for (let tIdx = 0; tIdx < 7; tIdx++) {
      if (source === 'tableau' && sourceIndex === tIdx) continue;
      if (canMoveToTableau(card, tIdx)) {
        pushState();
        executeMove(source, sourceIndex, cardIndex, 'tableau', tIdx);
        state.score += 5;
        state.moves++;
        audio.playCard();
        checkAutoFlip(source, sourceIndex);
        render();
        updateUI();
        checkWinCondition();
        return true;
      }
    }

    return false;
  }

  function executeMove(fromType, fromIdx, cardIdx, toType, toIdx) {
    let movedCards = [];
    if (fromType === 'waste') movedCards = [state.waste.pop()];
    else if (fromType === 'tableau') movedCards = state.tableau[fromIdx].splice(cardIdx);
    else if (fromType === 'foundation') movedCards = [state.foundations[fromIdx].pop()];

    if (toType === 'foundation') state.foundations[toIdx].push(...movedCards);
    else if (toType === 'tableau') state.tableau[toIdx].push(...movedCards);
  }

  function checkAutoFlip(fromType, fromIdx) {
    if (fromType === 'tableau') {
      const pile = state.tableau[fromIdx];
      if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
        pile[pile.length - 1].faceUp = true;
        state.score += 5;
      }
    }
  }

  function findHint() {
    clearHints();
    if (state.waste.length > 0) {
      const card = state.waste[state.waste.length - 1];
      for (let f = 0; f < 4; f++) {
        if (canMoveToFoundation(card, f)) {
          highlightCard(card.id);
          return;
        }
      }
    }

    for (let t = 0; t < 7; t++) {
      const pile = state.tableau[t];
      if (pile.length > 0) {
        const top = pile[pile.length - 1];
        if (top.faceUp) {
          for (let f = 0; f < 4; f++) {
            if (canMoveToFoundation(top, f)) {
              highlightCard(top.id);
              return;
            }
          }
        }
      }
    }

    if (state.waste.length > 0) {
      const card = state.waste[state.waste.length - 1];
      for (let t = 0; t < 7; t++) {
        if (canMoveToTableau(card, t)) {
          highlightCard(card.id);
          return;
        }
      }
    }

    for (let fromT = 0; fromT < 7; fromT++) {
      const pile = state.tableau[fromT];
      for (let c = 0; c < pile.length; c++) {
        const card = pile[c];
        if (card.faceUp) {
          for (let toT = 0; toT < 7; toT++) {
            if (fromT === toT) continue;
            if (canMoveToTableau(card, toT)) {
              if (card.value === 13 && c === 0 && state.tableau[toT].length === 0) continue;
              highlightCard(card.id);
              return;
            }
          }
        }
      }
    }

    if (state.stock.length > 0 || state.waste.length > 0) {
      if (els.stock) els.stock.classList.add('highlight-valid');
      setTimeout(() => {
        if (els.stock) els.stock.classList.remove('highlight-valid');
      }, 1500);
    }
  }

  function highlightCard(cardId) {
    const el = document.querySelector(`[data-card-id="${cardId}"]`);
    if (el) {
      el.classList.add('is-hinted');
      setTimeout(() => el.classList.remove('is-hinted'), 2000);
    }
  }

  function clearHints() {
    document.querySelectorAll('.is-hinted').forEach(el => el.classList.remove('is-hinted'));
  }

  function checkWinCondition() {
    const totalFoundations = state.foundations.reduce((acc, f) => acc + f.length, 0);
    if (totalFoundations === 52) {
      triggerVictory();
      return;
    }

    if (!state.isAutoCompleting && state.stock.length === 0 && state.waste.length === 0) {
      const allFaceUp = state.tableau.every(pile => pile.every(card => card.faceUp));
      if (allFaceUp) {
        state.isAutoCompleting = true;
        autoCompleteGame();
      }
    }
  }

  function autoCompleteGame() {
    let moved = false;
    for (let t = 0; t < 7; t++) {
      const pile = state.tableau[t];
      if (pile.length > 0) {
        const card = pile[pile.length - 1];
        for (let f = 0; f < 4; f++) {
          if (canMoveToFoundation(card, f)) {
            executeMove('tableau', t, pile.length - 1, 'foundation', f);
            state.score += 10;
            state.moves++;
            audio.playSuccess();
            render();
            updateUI();
            moved = true;
            setTimeout(autoCompleteGame, 120);
            return;
          }
        }
      }
    }
    if (!moved) checkWinCondition();
  }

  function triggerVictory() {
    GameStorage.clear();
    clearInterval(state.timerInterval);
    audio.playWin();
    startConfetti();

    const gamesWon = (parseInt(localStorage.getItem('care_solitaire_won') || '0', 10)) + 1;
    localStorage.setItem('care_solitaire_won', gamesWon.toString());

    const bestScore = Math.max(parseInt(localStorage.getItem('care_solitaire_best') || '0', 10), state.score);
    localStorage.setItem('care_solitaire_best', bestScore.toString());

    const vicTimeEl = document.getElementById('vic-time');
    const vicMovesEl = document.getElementById('vic-moves');
    if (vicTimeEl && els.timer) vicTimeEl.textContent = els.timer.textContent;
    if (vicMovesEl) vicMovesEl.textContent = state.moves.toString();

    if (els.victoryModal) els.victoryModal.classList.add('active');
  }

  function showStatsModal() {
    const totalPlayed = parseInt(localStorage.getItem('care_solitaire_played') || '1', 10);
    const totalWon = parseInt(localStorage.getItem('care_solitaire_won') || '0', 10);
    const winRate = totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 0;
    const bestScore = parseInt(localStorage.getItem('care_solitaire_best') || '0', 10);

    const elTotal = document.getElementById('stat-total-games');
    const elWon = document.getElementById('stat-won-games');
    const elRate = document.getElementById('stat-win-rate');
    const elBest = document.getElementById('stat-best-score');

    if (elTotal) elTotal.textContent = totalPlayed.toString();
    if (elWon) elWon.textContent = totalWon.toString();
    if (elRate) elRate.textContent = `${winRate}%`;
    if (elBest) elBest.textContent = bestScore.toString();

    if (els.statsModal) els.statsModal.classList.add('active');
  }

  function render() {
    renderStock();
    renderWaste();
    for (let f = 0; f < 4; f++) renderFoundation(f);
    for (let t = 0; t < 7; t++) renderTableau(t);
  }

  function renderStock() {
    if (!els.stock) return;
    els.stock.innerHTML = '';
    if (state.stock.length > 0) {
      const top = state.stock[state.stock.length - 1];
      const cardEl = createCardElement(top);
      cardEl.setAttribute('data-source', 'stock');
      els.stock.appendChild(cardEl);
    }
  }

  function renderWaste() {
    if (!els.waste) return;
    els.waste.innerHTML = '';
    if (state.waste.length > 0) {
      const top = state.waste[state.waste.length - 1];
      const cardEl = createCardElement(top);
      cardEl.setAttribute('data-source', 'waste');
      cardEl.setAttribute('data-source-idx', '0');
      cardEl.setAttribute('data-card-idx', (state.waste.length - 1).toString());
      els.waste.appendChild(cardEl);
    }
  }

  function renderFoundation(fIdx) {
    const slot = els.foundations[fIdx];
    if (!slot) return;
    slot.innerHTML = '';
    const pile = state.foundations[fIdx];
    if (pile.length > 0) {
      const top = pile[pile.length - 1];
      const cardEl = createCardElement(top);
      cardEl.setAttribute('data-source', 'foundation');
      cardEl.setAttribute('data-source-idx', fIdx.toString());
      cardEl.setAttribute('data-card-idx', (pile.length - 1).toString());
      slot.appendChild(cardEl);
    }
  }

  function renderTableau(tIdx) {
    const col = els.tableau[tIdx];
    if (!col) return;
    col.innerHTML = '';
    const pile = state.tableau[tIdx];

    let currentTop = 0;
    pile.forEach((card, idx) => {
      const cardEl = createCardElement(card);
      cardEl.style.top = `${currentTop}px`;
      currentTop += card.faceUp ? 28 : 14;

      cardEl.setAttribute('data-source', 'tableau');
      cardEl.setAttribute('data-source-idx', tIdx.toString());
      cardEl.setAttribute('data-card-idx', idx.toString());
      col.appendChild(cardEl);
    });
  }

  // Royalty SVG graphics for classic royal card look (K, Q, J)
  const ROYAL_GRAPHICS = {
    13: `<svg class="royal-svg" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="40" r="22" fill="#fed7aa" stroke="#1e293b" stroke-width="2"/>
      <path d="M 28 32 L 32 14 L 42 22 L 50 10 L 58 22 L 68 14 L 72 32 Z" fill="#eab308" stroke="#ca8a04" stroke-width="2"/>
      <circle cx="42" cy="38" r="2.5" fill="#1e293b"/>
      <circle cx="58" cy="38" r="2.5" fill="#1e293b"/>
      <path d="M 38 48 Q 50 56 62 48" stroke="#b91c1c" stroke-width="3" fill="none"/>
      <path d="M 20 62 L 80 62 L 88 128 L 12 128 Z" fill="#2563eb" stroke="#1e3a8a" stroke-width="2"/>
      <path d="M 36 62 L 50 90 L 64 62" fill="#ef4444"/>
      <rect x="44" y="62" width="12" height="66" fill="#eab308"/>
      <line x1="16" y1="80" x2="16" y2="120" stroke="#f59e0b" stroke-width="4"/>
    </svg>`,
    12: `<svg class="royal-svg" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="40" r="20" fill="#fed7aa" stroke="#1e293b" stroke-width="2"/>
      <path d="M 32 30 L 38 16 L 46 22 L 50 14 L 54 22 L 62 16 L 68 30 Z" fill="#eab308" stroke="#ca8a04" stroke-width="2"/>
      <circle cx="43" cy="38" r="2.5" fill="#1e293b"/>
      <circle cx="57" cy="38" r="2.5" fill="#1e293b"/>
      <path d="M 44 48 Q 50 52 56 48" stroke="#e11d48" stroke-width="2.5" fill="none"/>
      <path d="M 24 60 L 76 60 L 86 128 L 14 128 Z" fill="#9333ea" stroke="#6b21a8" stroke-width="2"/>
      <path d="M 38 60 Q 50 82 62 60" fill="#ec4899"/>
      <circle cx="50" cy="95" r="8" fill="#eab308"/>
    </svg>`,
    11: `<svg class="royal-svg" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="40" r="19" fill="#fed7aa" stroke="#1e293b" stroke-width="2"/>
      <path d="M 30 26 C 30 18 40 16 50 16 C 60 16 70 18 70 26 Z" fill="#059669" stroke="#047857" stroke-width="2"/>
      <path d="M 50 16 L 66 4" stroke="#dc2626" stroke-width="3"/>
      <circle cx="43" cy="39" r="2.5" fill="#1e293b"/>
      <circle cx="57" cy="39" r="2.5" fill="#1e293b"/>
      <path d="M 44 49 Q 50 51 56 49" stroke="#b91c1c" stroke-width="2" fill="none"/>
      <path d="M 22 60 L 78 60 L 84 128 L 16 128 Z" fill="#059669" stroke="#047857" stroke-width="2"/>
      <line x1="50" y1="60" x2="50" y2="128" stroke="#facc15" stroke-width="4"/>
    </svg>`
  };

  const SUIT_TO_CODE = { hearts: 'H', diamonds: 'D', clubs: 'C', spades: 'S' };

  // Large-format Card Template Supporting 4 SVG Decks & Procedural Art
  function createCardElement(card) {
    const el = document.createElement('div');
    el.className = `card ${card.color} ${card.faceUp ? 'face-up' : 'face-down'}`;
    el.setAttribute('data-card-id', card.id.toString());

    if (state.cardStyle && ['accessible', 'classic', 'modern', 'minimalist'].includes(state.cardStyle)) {
      el.classList.add('has-svg-deck');
      if (card.faceUp) {
        const suitCode = SUIT_TO_CODE[card.suit] || 'H';
        const svgSrc = `assets/cards/${state.cardStyle}/${suitCode}-${card.value}.svg`;
        el.innerHTML = `<img src="${svgSrc}" alt="${card.label}${card.symbol}" class="card-svg-full" draggable="false" loading="eager" />`;
      } else {
        const backSrc = `assets/cards/${state.cardStyle}/back.svg`;
        el.innerHTML = `<img src="${backSrc}" alt="Reverso" class="card-svg-full card-svg-back" draggable="false" loading="eager" />`;
      }
      return el;
    }

    if (card.faceUp) {
      let centerGraphic = `<div class="card-center-giant">${card.symbol}</div>`;
      if (ROYAL_GRAPHICS[card.value]) {
        centerGraphic = `<div class="card-center-giant card-royalty-art">${ROYAL_GRAPHICS[card.value]}</div>`;
      }

      el.innerHTML = `
        <div class="card-header-corner">
          <span class="card-rank">${card.label}</span>
          <span class="card-suit-small">${card.symbol}</span>
        </div>
        ${centerGraphic}
      `;
    }

    return el;
  }

  function updateUI() {
    if (els.score) els.score.textContent = state.score.toString();
    if (els.moves) els.moves.textContent = state.moves.toString();
    if (els.navUndoBtn) els.navUndoBtn.disabled = state.history.length === 0;
    saveCurrentGame();
  }

  function bindEvents() {
    // Stock draw listener
    if (els.stock) {
      els.stock.addEventListener('click', (e) => {
        e.preventDefault();
        drawStock();
      });
    }

    // Direct pointer and touch handlers for mobile & desktop
    const unlockAudioOnce = () => { audio.unlock(); };
    window.addEventListener('pointerdown', unlockAudioOnce, { once: true, passive: true });
    window.addEventListener('touchstart', unlockAudioOnce, { once: true, passive: true });
    window.addEventListener('click', unlockAudioOnce, { once: true, passive: true });

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);

    // Fallback click listener for cards
    document.addEventListener('click', (e) => {
      const cardEl = e.target.closest('.card');
      if (!cardEl) return;
      if (cardEl.getAttribute('data-source') === 'stock') {
        drawStock();
        return;
      }
      if (cardEl.classList.contains('face-down')) {
        const source = cardEl.getAttribute('data-source');
        const sIdx = parseInt(cardEl.getAttribute('data-source-idx'), 10);
        const cIdx = parseInt(cardEl.getAttribute('data-card-idx'), 10);
        if (source === 'tableau') {
          const pile = state.tableau[sIdx];
          if (pile && cIdx === pile.length - 1) {
            pile[cIdx].faceUp = true;
            state.score += 5;
            audio.playCard();
            render();
            updateUI();
          }
        }
      }
    });

    // Navigation buttons
    if (els.navUndoBtn) els.navUndoBtn.addEventListener('click', (e) => { e.preventDefault(); undo(); });
    if (els.navHintBtn) els.navHintBtn.addEventListener('click', (e) => { e.preventDefault(); findHint(); });
    if (els.navNewGameBtn) els.navNewGameBtn.addEventListener('click', (e) => { e.preventDefault(); startNewGame(); });
    if (els.navStatsBtn) els.navStatsBtn.addEventListener('click', (e) => { e.preventDefault(); showStatsModal(); });
    if (els.victoryRestart) els.victoryRestart.addEventListener('click', (e) => { e.preventDefault(); startNewGame(); });

    // Modals
    if (els.navSettingsBtn) {
      els.navSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (els.settingsModal) els.settingsModal.classList.add('active');
      });
    }
    if (els.closeSettingsBtn) {
      els.closeSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (els.settingsModal) els.settingsModal.classList.remove('active');
      });
    }
    if (els.closeStatsBtn) {
      els.closeStatsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (els.statsModal) els.statsModal.classList.remove('active');
      });
    }

    // Modal background close
    if (els.settingsModal) {
      els.settingsModal.addEventListener('click', (e) => {
        if (e.target === els.settingsModal) els.settingsModal.classList.remove('active');
      });
    }
    if (els.statsModal) {
      els.statsModal.addEventListener('click', (e) => {
        if (e.target === els.statsModal) els.statsModal.classList.remove('active');
      });
    }

    if (els.drawSelect) {
      els.drawSelect.addEventListener('change', (e) => {
        state.drawMode = parseInt(e.target.value, 10);
        localStorage.setItem('care_solitaire_draw', state.drawMode.toString());
      });
    }

    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.Solitaire && window.Solitaire.toggleSound) {
          window.Solitaire.toggleSound();
        }
      });
    }

    // Auto-save on page exit, background tab switch, or app minimization
    window.addEventListener('beforeunload', () => {
      saveCurrentGame();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        saveCurrentGame();
      }
    });
  }

  let tapStartTime = 0;
  let startX = 0;
  let startY = 0;

  function handlePointerDown(e) {
    const cardEl = e.target.closest('.card');
    if (!cardEl) return;

    const source = cardEl.getAttribute('data-source');
    if (!source) return;

    if (source === 'stock') {
      return; // Handled by click
    }

    if (cardEl.classList.contains('face-down')) {
      return;
    }

    tapStartTime = Date.now();
    startX = e.clientX;
    startY = e.clientY;

    const sourceIdx = parseInt(cardEl.getAttribute('data-source-idx'), 10);
    const cardIdx = parseInt(cardEl.getAttribute('data-card-idx'), 10);

    // If dragging from tableau, collect all card elements from cardIdx to top of stack
    let stackElements = [cardEl];
    if (source === 'tableau') {
      const colEl = els.tableau[sourceIdx];
      if (colEl) {
        const allCardsInCol = Array.from(colEl.querySelectorAll('.card'));
        stackElements = allCardsInCol.slice(cardIdx);
      }
    }

    dragState = {
      cardEl,
      stackElements,
      source,
      sourceIdx,
      cardIdx,
      initialX: startX,
      initialY: startY,
      isDragging: false
    };
  }

  function handlePointerMove(e) {
    if (!dragState) return;
    const dx = e.clientX - dragState.initialX;
    const dy = e.clientY - dragState.initialY;

    if (!dragState.isDragging && Math.hypot(dx, dy) > 8) {
      dragState.isDragging = true;
      dragState.stackElements.forEach(el => el.classList.add('is-dragging'));
    }

    if (dragState.isDragging) {
      dragState.stackElements.forEach(el => {
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
    }
  }

  function handlePointerUp(e) {
    if (!dragState) return;

    const elapsed = Date.now() - tapStartTime;
    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);

    if (!dragState.isDragging && elapsed < 400 && dx < 12 && dy < 12) {
      // Tap-to-move
      tryAutoMoveCard(dragState.source, dragState.sourceIdx, dragState.cardIdx);
    } else if (dragState.isDragging) {
      dragState.stackElements.forEach(el => {
        el.classList.remove('is-dragging');
        el.style.transform = '';
      });

      const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
      handleDrop(dropTarget);
    }

    dragState = null;
  }

  function handleDrop(target) {
    if (!target || !dragState) return;

    const tableauCol = target.closest('.tableau-col');
    if (tableauCol) {
      const colIdx = parseInt(tableauCol.id.replace('tableau-', ''), 10);
      let card;
      if (dragState.source === 'waste') card = state.waste[state.waste.length - 1];
      else if (dragState.source === 'tableau') card = state.tableau[dragState.sourceIdx][dragState.cardIdx];
      else if (dragState.source === 'foundation') card = state.foundations[dragState.sourceIdx][state.foundations[dragState.sourceIdx].length - 1];

      if (card && canMoveToTableau(card, colIdx) && !(dragState.source === 'tableau' && dragState.sourceIdx === colIdx)) {
        startTimerIfNeeded();
        pushState();
        executeMove(dragState.source, dragState.sourceIdx, dragState.cardIdx, 'tableau', colIdx);
        state.score += 5;
        state.moves++;
        audio.playCard();
        checkAutoFlip(dragState.source, dragState.sourceIdx);
        render();
        updateUI();
        checkWinCondition();
        return;
      }
    }

    const foundationSlot = target.closest('.foundation-slot');
    if (foundationSlot) {
      const fIdx = parseInt(foundationSlot.id.replace('foundation-', ''), 10);
      let card;
      if (dragState.source === 'waste') card = state.waste[state.waste.length - 1];
      else if (dragState.source === 'tableau') {
        const pile = state.tableau[dragState.sourceIdx];
        if (dragState.cardIdx === pile.length - 1) card = pile[pile.length - 1];
      }

      if (card && canMoveToFoundation(card, fIdx)) {
        startTimerIfNeeded();
        pushState();
        executeMove(dragState.source, dragState.sourceIdx, dragState.cardIdx, 'foundation', fIdx);
        state.score += 10;
        state.moves++;
        audio.playSuccess();
        checkAutoFlip(dragState.source, dragState.sourceIdx);
        render();
        updateUI();
        checkWinCondition();
        return;
      }
    }

    render();
  }

  let confettiAnim = null;
  function startConfetti() {
    const canvas = els.confettiCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      size: Math.random() * 8 + 4,
      color: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 5)],
      speed: Math.random() * 3 + 2,
      rotation: Math.random() * 360,
      rotSpeed: Math.random() * 4 - 2
    }));

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.y += p.speed;
        p.rotation += p.rotSpeed;
        if (p.y > canvas.height) p.y = -10;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      confettiAnim = requestAnimationFrame(frame);
    }
    frame();
  }

  function stopConfetti() {
    if (confettiAnim) cancelAnimationFrame(confettiAnim);
    const canvas = els.confettiCanvas;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  window.Solitaire = {
    init,
    startNewGame,
    undo,
    findHint,
    showStatsModal,
    showSettingsModal() {
      const modal = document.getElementById('settings-modal');
      if (modal) {
        modal.classList.add('active');
        const waInput = document.getElementById('sos-wa-input');
        if (waInput) {
          waInput.value = localStorage.getItem('care_sos_wa_number') || localStorage.getItem('care_sos_phone') || '';
        }
        const currentTheme = localStorage.getItem('care_selected_theme') || localStorage.getItem('care_solitaire_theme') || 'theme-care-green';
        const currentDeck = localStorage.getItem('care_solitaire_deck') || 'deck-blue';
        document.querySelectorAll('#bg-swatches .swatch-item').forEach(el => {
          el.classList.toggle('active', el.getAttribute('data-theme') === currentTheme);
        });
        document.querySelectorAll('#deck-swatches .swatch-item').forEach(el => {
          el.classList.toggle('active', el.getAttribute('data-deck') === currentDeck);
        });
        const currentCardStyle = localStorage.getItem('care_solitaire_card_style') || state.cardStyle || 'accessible';
        document.querySelectorAll('#card-style-swatches .swatch-item').forEach(el => {
          el.classList.toggle('active', el.getAttribute('data-card-style') === currentCardStyle);
        });
        const drawSelect = document.getElementById('draw-mode-select');
        if (drawSelect) drawSelect.value = state.drawMode.toString();
        updateSoundButtonUI();
      }
    },
    closeSettingsModal() {
      const modal = document.getElementById('settings-modal');
      if (modal) modal.classList.remove('active');
    },
    closeStatsModal() {
      const modal = document.getElementById('stats-modal');
      if (modal) modal.classList.remove('active');
    },
    setTheme,
    setDeck,
    setCardStyle,
    toggleSound() {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem('care_solitaire_sound', state.soundEnabled.toString());
      updateSoundButtonUI();
      if (state.soundEnabled) {
        try {
          audio.unlock();
          audio.playSuccess();
        } catch (e) {}
      }
    },
    setDrawMode(mode) {
      state.drawMode = parseInt(mode, 10);
      localStorage.setItem('care_solitaire_draw', state.drawMode.toString());
      const select = document.getElementById('draw-mode-select');
      if (select) select.value = mode;
    },
    setSound(val) {
      state.soundEnabled = val === 'on';
      localStorage.setItem('care_solitaire_sound', state.soundEnabled.toString());
      updateSoundButtonUI();
      if (state.soundEnabled) {
        try {
          audio.unlock();
          audio.playSuccess();
        } catch (e) {}
      }
    },
    saveSOSPhone() {
      const input = document.getElementById('sos-wa-input');
      const val = input ? input.value.trim() : '';
      if (val) {
        localStorage.setItem('care_sos_wa_number', val);
        localStorage.setItem('care_sos_phone', val);
      }
      const feedback = document.getElementById('sos-save-feedback');
      if (feedback) {
        feedback.style.display = 'block';
        setTimeout(() => { feedback.style.display = 'none'; }, 2500);
      }
      if (window.CareFTUX && window.CareFTUX.updateSOSBadge) {
        window.CareFTUX.updateSOSBadge();
      }
    },
    saveGame: saveCurrentGame,
    restoreGame: restoreSavedGame,
    clearSavedGame: () => GameStorage.clear(),
    state
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive' || document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
    window.addEventListener('load', () => {
      if (!state.isPlaying && state.tableau[0].length === 0) init();
    });
  }
})();
