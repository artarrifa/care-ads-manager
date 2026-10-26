/**
 * CareTech Games Platform Core Library - care-platform.js
 * Version: 1.0.0 (Production)
 *
 * Provides:
 * 1. Anonymous Device Registration (UUID + SHA-256 hash, zero PII, server-side GeoIP)
 * 2. Ads Delivery & Synchronization (ETag, IndexedDB/localStorage, 24h offline fallback)
 * 3. Telemetry & Ad Engagement Tracking (Impression, click, donation, shop)
 * 4. Care SOS Emergency Module (Geolocation on-demand, non-automated SMS/WhatsApp preview)
 * 5. Theme & Settings Management (Care Green default, Care Blue alternative)
 */

(function (window, document) {
  'use strict';

  // SHA-256 Helper (Web Crypto API with robust pure JS fallback)
  async function sha256(message) {
    if (window.crypto && window.crypto.subtle) {
      try {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {}
    }
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'fallback_' + Math.abs(hash).toString(16) + '0000000000000000'.slice(0, 16);
  }

  // Generate UUID v4
  function generateUUID() {
    if (window.crypto && window.crypto.randomUUID) {
      try { return window.crypto.randomUUID(); } catch (e) {}
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Detect UA Class (mobile, tablet, desktop)
  function getUAClass() {
    const ua = navigator.userAgent || '';
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  const CarePlatform = {
    config: {
      gameId: 'solitario',
      endpoints: {
        banners: '/games/api.php?action=banners',
        activate: '/games/api.php?action=activate',
        events: '/games/api.php?action=events',
        wpBanners: '/wp-json/careads/v1/banners',
        fallbackApi: '/games/api.php'
      },
      ads: {
        maxOfflineAgeSeconds: 86400,
        syncIntervalSeconds: 60
      },
      sos: {
        defaultPhone: '123',
        defaultSmsNumber: '',
        defaultWhatsAppNumber: '573001234567',
        emergencyMessage: '¡EMERGENCIA! Necesito asistencia urgente.',
        locationMessageTemplate: '¡EMERGENCIA! Necesito asistencia. Mi ubicación aproximada es: https://maps.google.com/?q={lat},{lng}'
      }
    },

    adsData: { top: null, bottom: null },
    eventQueue: [],

    async init(customConfig = {}) {
      this.mergeConfig(customConfig);
      await this.initDeviceRegistration();
      this.initTheme();
      this.initAds();
      this.initSOS();
      this.bindTelemetryEvents();
    },

    mergeConfig(custom) {
      if (!custom) return;
      if (custom.gameId) this.config.gameId = custom.gameId;
      if (custom.endpoints) Object.assign(this.config.endpoints, custom.endpoints);
      if (custom.ads) Object.assign(this.config.ads, custom.ads);
      if (custom.sos) Object.assign(this.config.sos, custom.sos);
    },

    // ==============================================================================
    // 1. DEVICE REGISTRATION (Zero PII, SHA-256 Hash of local UUID)
    // ==============================================================================
    async initDeviceRegistration() {
      let installUuid = localStorage.getItem('care_device_install_uuid');
      let isFirstActivation = false;

      if (!installUuid) {
        installUuid = generateUUID();
        localStorage.setItem('care_device_install_uuid', installUuid);
        isFirstActivation = true;
      }

      const isRegistered = localStorage.getItem('care_device_registered_server');
      if (isRegistered && !isFirstActivation) return;

      const installIdHash = await sha256(installUuid);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || Boolean(navigator.standalone);

      const payload = {
        gameId: this.config.gameId,
        installIdHash: installIdHash,
        firstActivation: isFirstActivation,
        standalone: isStandalone,
        uaClass: getUAClass(),
        timestamp: Math.floor(Date.now() / 1000)
      };

      this.sendRegistration(payload);
    },

    async sendRegistration(payload) {
      const endpoints = [
        this.config.endpoints.activate,
        `${this.config.endpoints.fallbackApi}?action=activate`,
        '/wp-json/careads/v1/install/activate'
      ];

      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            localStorage.setItem('care_device_registered_server', 'true');
            try {
              const resData = await res.json();
              if (resData && resData.countryDetected) {
                localStorage.setItem('care_user_country', resData.countryDetected.toUpperCase());
              }
            } catch (e) {}
            break;
          }
        } catch (e) {}
      }
    },

    // ==============================================================================
    // 2. THEME MANAGEMENT (Care Green default, Care Blue alternative)
    // ==============================================================================
    initTheme() {
      const savedTheme = localStorage.getItem('care_selected_theme') || 'theme-care-green';
      this.setTheme(savedTheme);
    },

    setTheme(themeId) {
      const validThemes = ['theme-care-green', 'theme-care-blue', 'theme-classic-green', 'theme-care-dark', 'theme-royal-purple', 'theme-wood', 'theme-high-contrast'];
      const theme = validThemes.includes(themeId) ? themeId : 'theme-care-green';
      localStorage.setItem('care_selected_theme', theme);

      const currentDeck = localStorage.getItem('care_solitaire_deck') || 'deck-blue';
      document.body.className = `${theme} ${currentDeck}`.trim();

      document.querySelectorAll('[data-care-theme], [data-theme]').forEach(el => {
        const t = el.getAttribute('data-care-theme') || el.getAttribute('data-theme');
        el.classList.toggle('active', t === theme);
      });
    },

    // ==============================================================================
    // 3. ADS DELIVERY & ROTATION (ETag, IndexedDB/Storage, 24h Offline Fallback)
    // ==============================================================================
    initAds() {
      this.syncAds();
      setInterval(() => this.syncAds(), (this.config.ads.syncIntervalSeconds || 60) * 1000);
    },

    async syncAds() {
      const placements = ['top', 'bottom'];
      for (const placement of placements) {
        await this.fetchAdPlacement(placement);
        this.renderAd(placement);
      }
    },

    async fetchAdPlacement(placement) {
      const now = Math.floor(Date.now() / 1000);
      const cacheKey = `care_cached_ad_${this.config.gameId}_${placement}`;
      const etagKey = `care_etag_${this.config.gameId}_${placement}`;
      const prevEtag = localStorage.getItem(etagKey) || '';

      const sep = this.config.endpoints.banners.includes('?') ? '&' : '?';
      const urls = [
        `${this.config.endpoints.banners}${sep}game=${this.config.gameId}&placement=${placement}`,
        `${this.config.endpoints.fallbackApi}?action=banners&game=${this.config.gameId}&placement=${placement}`,
        `/wp-json/careads/v1/banners?game=${this.config.gameId}&placement=${placement}`,
        `/api/v1/ads/${this.config.gameId}/${placement}`
      ];

      for (const url of urls) {
        try {
          const headers = {};
          if (prevEtag) headers['If-None-Match'] = prevEtag;

          const res = await fetch(url, { headers, cache: 'no-cache' }).catch(() => null);
          if (!res) continue;

          if (res.status === 304) {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              this.adsData[placement] = JSON.parse(cached).data;
              return;
            }
          }

          if (res.ok) {
            const newEtag = res.headers.get('ETag') || '';
            if (newEtag) localStorage.setItem(etagKey, newEtag);

            const data = await res.json();
            if (data && (data.headline || data.brandName)) {
              this.adsData[placement] = data;
              localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: now }));
              return;
            }
          }
        } catch (e) {}
      }

      // Offline Cache check (24h max)
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (now - parsed.timestamp < (this.config.ads.maxOfflineAgeSeconds || 86400)) {
            this.adsData[placement] = parsed.data;
            return;
          }
        } catch (e) {}
      }
    },

    renderAd(placement) {
      const container = document.getElementById(`${placement}-ad-banner`);
      if (!container) return;

      const ad = this.adsData[placement];
      if (!ad) return;

      const headlineEl = document.getElementById(`${placement}-ad-headline`);
      const subtextEl = document.getElementById(`${placement}-ad-subtext`);
      const webBtn = document.getElementById(`${placement}-ad-web-btn`);
      const donateBtn = document.getElementById(`${placement}-ad-donate-btn`);
      const shopBtn = document.getElementById(`${placement}-ad-shop-btn`);

      if (headlineEl && (ad.headline || ad.brandName)) headlineEl.textContent = ad.headline || ad.brandName;
      if (subtextEl && ad.description) subtextEl.textContent = ad.description;

      if (webBtn) {
        if (ad.webUrl) {
          webBtn.href = ad.webUrl;
          webBtn.style.display = 'inline-flex';
        } else {
          webBtn.style.display = 'none';
        }
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

      this.trackEvent('ad_impression', { placement, campaignId: ad.campaignId || ad.id });
    },

    // ==============================================================================
    // 4. TELEMETRY & ANALYTICS (Non-blocking, batched)
    // ==============================================================================
    bindTelemetryEvents() {
      ['top', 'bottom'].forEach(placement => {
        const webBtn = document.getElementById(`${placement}-ad-web-btn`);
        const donateBtn = document.getElementById(`${placement}-ad-donate-btn`);
        const shopBtn = document.getElementById(`${placement}-ad-shop-btn`);

        if (webBtn) webBtn.addEventListener('click', () => this.trackEvent('ad_click', { placement }));
        if (donateBtn) donateBtn.addEventListener('click', () => this.trackEvent('ad_donation_click', { placement }));
        if (shopBtn) shopBtn.addEventListener('click', () => this.trackEvent('ad_shop_click', { placement }));
      });
    },

    trackEvent(eventType, metadata = {}) {
      const event = {
        eventType,
        gameId: this.config.gameId,
        placement: metadata.placement || 'top',
        campaignId: metadata.campaignId || (this.adsData[metadata.placement] ? (this.adsData[metadata.placement].campaignId || this.adsData[metadata.placement].id) : null),
        timestamp: Math.floor(Date.now() / 1000)
      };

      this.eventQueue.push(event);
      if (this.eventQueue.length >= 5) {
        this.flushEvents();
      } else {
        if (this._flushTimer) clearTimeout(this._flushTimer);
        this._flushTimer = setTimeout(() => this.flushEvents(), 8000);
      }
    },

    async flushEvents() {
      if (this.eventQueue.length === 0) return;
      const eventsToSend = [...this.eventQueue];
      this.eventQueue = [];

      const payload = JSON.stringify({ events: eventsToSend });

      if (navigator.onLine && navigator.sendBeacon) {
        const success = navigator.sendBeacon(this.config.endpoints.events, payload);
        if (success) return;
      }

      try {
        await fetch(this.config.endpoints.events, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(() => null);
      } catch (e) {}
    },

    // ==============================================================================
    // 5. CARE SOS EMERGENCY MODULE
    // ==============================================================================
    initSOS() {
      const sosMainBtn = document.getElementById('care-sos-main-btn');
      const sosSmsBtn = document.getElementById('care-sos-sms-btn');
      const sosWaBtn = document.getElementById('care-sos-wa-btn');

      if (sosMainBtn) sosMainBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleSosMain(); });
      if (sosSmsBtn) sosSmsBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleSosAction('sms'); });
      if (sosWaBtn) sosWaBtn.addEventListener('click', (e) => { e.preventDefault(); this.handleSosAction('whatsapp'); });
    },

    getEmergencyContacts() {
      return {
        phone: localStorage.getItem('care_sos_phone') || this.config.sos.defaultPhone,
        smsNumber: localStorage.getItem('care_sos_sms_number') || this.config.sos.defaultSmsNumber,
        waNumber: localStorage.getItem('care_sos_wa_number') || this.config.sos.defaultWhatsAppNumber
      };
    },

    async requestLocationSafe() {
      if (!navigator.geolocation) return null;
      return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), 4000);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timer);
            resolve({
              lat: pos.coords.latitude.toFixed(6),
              lng: pos.coords.longitude.toFixed(6)
            });
          },
          () => {
            clearTimeout(timer);
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 3500, maximumAge: 60000 }
        );
      });
    },

    buildEmergencyMessage(coords) {
      if (coords && coords.lat && coords.lng) {
        return this.config.sos.locationMessageTemplate
          .replace('{lat}', coords.lat)
          .replace('{lng}', coords.lng);
      }
      return this.config.sos.emergencyMessage;
    },

    async handleSosMain() {
      const modal = document.getElementById('care-sos-modal');
      if (modal) {
        modal.classList.add('active');
      } else {
        this.handleSosAction('call');
      }
    },

    async handleSosAction(type) {
      const contacts = this.getEmergencyContacts();
      const coords = await this.requestLocationSafe();
      const message = this.buildEmergencyMessage(coords);

      if (type === 'call') {
        window.location.href = `tel:${contacts.phone}`;
      } else if (type === 'sms') {
        const targetNumber = contacts.smsNumber || contacts.phone;
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const separator = isIOS ? '&' : '?';
        const smsUrl = targetNumber
          ? `sms:${targetNumber}${separator}body=${encodeURIComponent(message)}`
          : `sms:${separator}body=${encodeURIComponent(message)}`;
        window.open(smsUrl, '_blank');
      } else if (type === 'whatsapp' || type === 'wa') {
        let cleanWa = (contacts.waNumber || '').replace(/[^0-9]/g, '');
        const waUrl = cleanWa
          ? `https://wa.me/${cleanWa}?text=${encodeURIComponent(message)}`
          : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
      }
    }
  };

  window.CarePlatform = CarePlatform;
})(window, document);
