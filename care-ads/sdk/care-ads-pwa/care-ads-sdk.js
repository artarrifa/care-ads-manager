/**
 * Care Ads SDK for Progressive Web Apps (PWA) V1.0
 * Standard: IAB/MRC Display Advertising Measurement (>=50% pixels visible for >= 1 continuous second).
 * Features:
 * - IntersectionObserver for viewport percentage detection.
 * - Page Visibility API to pause exposure timers when browser tab is hidden/backgrounded.
 * - Offline-first resilient queue in localStorage with is_offline_sync tracking.
 * - ETag conditional requests (304 Not Modified) to minimize mobile bandwidth.
 */

class CareAdsSDK {
  constructor(config = {}) {
    this.config = Object.assign({
      gameId: 'solitario',
      apiBaseUrl: '/api/v1/delivery',
      syncIntervalSeconds: 60,
      maxOfflineAgeSeconds: 86400,
      iabMinViewableMs: 1000
    }, config);

    this.activeAds = {};
    this.viewableTimers = {};
    this.eventQueue = [];
    this.offlineQueueKey = `care_ads_offline_queue_${this.config.gameId}`;
    
    this.initVisibilityListener();
  }

  init() {
    this.loadOfflineQueue();
    this.syncAllPlacements();
    setInterval(() => this.syncAllPlacements(), this.config.syncIntervalSeconds * 1000);
    // Vaciar cola de eventos periódicamente (cada 15s)
    setInterval(() => this.flushEventQueue(), 15000);
  }

  initVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      const isVisible = document.visibilityState === 'visible';
      Object.keys(this.viewableTimers).forEach(placement => {
        const timer = this.viewableTimers[placement];
        if (!timer) return;

        if (!isVisible && timer.startTime) {
          // Pestaña oculta -> pausar acumulación de tiempo
          timer.accumulatedMs += Date.now() - timer.startTime;
          timer.startTime = null;
        } else if (isVisible && !timer.startTime && timer.inViewport) {
          // Pestaña activa nuevamente -> reanudar temporizador
          timer.startTime = Date.now();
        }
      });
    });
  }

  async syncAllPlacements() {
    const placements = ['top', 'bottom'];
    for (const p of placements) {
      await this.fetchAdPlacement(p);
      this.renderAdPlacement(p);
    }
  }

  async fetchAdPlacement(placement) {
    const url = `${this.config.apiBaseUrl}/ad?game=${encodeURIComponent(this.config.gameId)}&placement=${encodeURIComponent(placement)}`;
    const etagKey = `care_etag_${this.config.gameId}_${placement}`;
    const cacheKey = `care_cached_ad_${this.config.gameId}_${placement}`;
    const prevEtag = localStorage.getItem(etagKey) || '';

    try {
      const headers = {};
      if (prevEtag) headers['If-None-Match'] = prevEtag;

      const res = await fetch(url, { headers, cache: 'no-cache' }).catch(() => null);
      if (res && res.status === 304) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          this.activeAds[placement] = JSON.parse(cached).data;
          return;
        }
      }

      if (res && res.ok) {
        const newEtag = res.headers.get('ETag');
        if (newEtag) localStorage.setItem(etagKey, newEtag);

        const data = await res.json();
        if (data && data.headline) {
          this.activeAds[placement] = data;
          localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Math.floor(Date.now() / 1000) }));
          this.trackEvent('ad_loaded', { placement, decisionId: data.decisionId, campaignId: data.campaignId });
          return;
        }
      }
    } catch (e) {
      console.warn('[CareAds] Error en red, activando fallback offline:', e);
    }

    // Fallback Offline desde LocalStorage
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const age = Math.floor(Date.now() / 1000) - parsed.timestamp;
        if (age < this.config.maxOfflineAgeSeconds) {
          this.activeAds[placement] = parsed.data;
        }
      } catch (e) {}
    }
  }

  renderAdPlacement(placement) {
    const bannerEl = document.getElementById(`${placement}-ad-banner`);
    const ad = this.activeAds[placement];
    if (!bannerEl || !ad) return;

    const headlineEl = document.getElementById(`${placement}-ad-headline`);
    const subtextEl = document.getElementById(`${placement}-ad-subtext`);
    const iconEl = document.getElementById(`${placement}-ad-icon`);
    const webBtn = document.getElementById(`${placement}-ad-web-btn`);
    const donateBtn = document.getElementById(`${placement}-ad-donate-btn`);
    const shopBtn = document.getElementById(`${placement}-ad-shop-btn`);

    if (headlineEl) headlineEl.textContent = ad.headline || ad.brandName;
    if (subtextEl) subtextEl.textContent = ad.description || '';
    if (iconEl) {
      if (ad.logo) {
        iconEl.innerHTML = `<img src="${ad.logo}" alt="Logo" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" onerror="this.parentElement.innerHTML='<i class=\\'fa-solid fa-bullhorn\\'></i>'">`;
      } else {
        iconEl.innerHTML = '<i class="fa-solid fa-bullhorn"></i>';
      }
    }

    if (webBtn) {
      if (ad.webUrl) {
        webBtn.href = ad.webUrl;
        webBtn.style.display = 'inline-flex';
        webBtn.onclick = () => this.trackEvent('ad_click', { placement, decisionId: ad.decisionId, campaignId: ad.campaignId });
      } else {
        webBtn.style.display = 'none';
      }
    }

    if (donateBtn) {
      if (ad.donationUrl) {
        donateBtn.href = ad.donationUrl;
        donateBtn.style.display = 'inline-flex';
        donateBtn.onclick = () => this.trackEvent('ad_donation_click', { placement, decisionId: ad.decisionId, campaignId: ad.campaignId });
      } else {
        donateBtn.style.display = 'none';
      }
    }

    if (shopBtn) {
      if (ad.shopUrl) {
        shopBtn.href = ad.shopUrl;
        shopBtn.style.display = 'inline-flex';
        shopBtn.onclick = () => this.trackEvent('ad_shop_click', { placement, decisionId: ad.decisionId, campaignId: ad.campaignId });
      } else {
        shopBtn.style.display = 'none';
      }
    }

    this.trackEvent('ad_rendered', { placement, decisionId: ad.decisionId, campaignId: ad.campaignId });
    this.observeViewability(placement, bannerEl, ad);
  }

  observeViewability(placement, bannerEl, ad) {
    if (this.viewableTimers[placement] && this.viewableTimers[placement].observer) {
      this.viewableTimers[placement].observer.disconnect();
    }

    const state = {
      startTime: null,
      accumulatedMs: 0,
      inViewport: false,
      reported: false,
      observer: null
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Criterio IAB: >= 50% de los píxeles visibles
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          state.inViewport = true;
          if (document.visibilityState === 'visible' && !state.startTime) {
            state.startTime = Date.now();
          }
        } else {
          state.inViewport = false;
          if (state.startTime) {
            state.accumulatedMs += Date.now() - state.startTime;
            state.startTime = null;
          }
        }

        // Evaluar si superó el umbral IAB (1000ms continuo)
        const currentMs = state.accumulatedMs + (state.startTime ? (Date.now() - state.startTime) : 0);
        if (currentMs >= this.config.iabMinViewableMs && !state.reported) {
          state.reported = true;
          this.trackEvent('ad_viewable', {
            placement,
            decisionId: ad.decisionId,
            campaignId: ad.campaignId,
            viewable_duration_ms: currentMs
          });
        }
      });
    }, { threshold: [0.0, 0.5, 1.0] });

    observer.observe(bannerEl);
    state.observer = observer;
    this.viewableTimers[placement] = state;
  }

  trackEvent(eventType, meta = {}) {
    const event = {
      event_type: eventType,
      decision_id: meta.decisionId || null,
      campaign_id: meta.campaignId || null,
      placement: meta.placement || 'top',
      viewable_duration_ms: meta.viewable_duration_ms || 0,
      is_offline_sync: !navigator.onLine,
      timestamp: Math.floor(Date.now() / 1000)
    };

    this.eventQueue.push(event);
    if (!navigator.onLine) {
      this.saveOfflineQueue();
    }
  }

  async flushEventQueue() {
    if (this.eventQueue.length === 0 || !navigator.onLine) return;

    const batch = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const res = await fetch(`${this.config.apiBaseUrl}/events/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch)
      });
      if (!res.ok) {
        // Reintentar en siguiente ciclo
        this.eventQueue.unshift(...batch);
      }
    } catch (e) {
      this.eventQueue.unshift(...batch);
      this.saveOfflineQueue();
    }
  }

  saveOfflineQueue() {
    try {
      localStorage.setItem(this.offlineQueueKey, JSON.stringify(this.eventQueue.slice(-100)));
    } catch (e) {}
  }

  loadOfflineQueue() {
    try {
      const stored = localStorage.getItem(this.offlineQueueKey);
      if (stored) {
        const items = JSON.parse(stored);
        if (Array.isArray(items)) {
          this.eventQueue.push(...items);
        }
        localStorage.removeItem(this.offlineQueueKey);
      }
    } catch (e) {}
  }
}

if (typeof window !== 'undefined') {
  window.CareAdsSDK = CareAdsSDK;
}
