const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testSolitaire() {
  console.log('🚀 Iniciando pruebas detalladas con Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.error(`[PAGE ERROR] ${err.message}`);
  });

  page.on('requestfailed', request => {
    console.error(`[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      console.warn(`[HTTP ${response.status()}] ${response.url()}`);
    }
  });

  try {
    console.log('🌐 Navegando a https://caretechservices.com/games/solitario/...');
    await page.goto('https://caretechservices.com/games/solitario/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const screenshotDir = path.resolve(__dirname, '../../screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

    // Inspect buttons and event listeners
    const evalResult = await page.evaluate(() => {
      const settingsBtn = document.getElementById('nav-settings-btn');
      const settingsModal = document.getElementById('settings-modal');
      const statsBtn = document.getElementById('nav-stats-btn');
      const statsModal = document.getElementById('stats-modal');

      return {
        hasSettingsBtn: Boolean(settingsBtn),
        hasSettingsModal: Boolean(settingsModal),
        hasStatsBtn: Boolean(statsBtn),
        hasStatsModal: Boolean(statsModal),
        bodyClasses: document.body.className
      };
    });
    console.log('DOM Evaluation:', evalResult);

    // Test Clicking settings button directly via evaluate or page.click
    console.log('⚙️ Disparando clic en #nav-settings-btn...');
    await page.evaluate(() => {
      document.getElementById('nav-settings-btn').click();
    });
    await page.waitForTimeout(500);

    let isSettingsOpen = await page.$eval('#settings-modal', el => el.classList.contains('active'));
    console.log(`- Modal Ajustes activo tras direct click: ${isSettingsOpen}`);

    // If still false, check what happens when CarePlatform or solitaire attaches listeners
    const modalStyle = await page.$eval('#settings-modal', el => ({
      display: window.getComputedStyle(el).display,
      opacity: window.getComputedStyle(el).opacity,
      pointerEvents: window.getComputedStyle(el).pointerEvents,
      zIndex: window.getComputedStyle(el).zIndex
    }));
    console.log('Settings modal computed style:', modalStyle);

    await page.screenshot({ path: path.join(screenshotDir, 'mobile-390x844.png') });
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
}

testSolitaire();
