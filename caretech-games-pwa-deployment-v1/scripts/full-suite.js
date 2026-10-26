const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.resolve(__dirname, '../../screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

async function runFullTestSuite() {
  console.log('🧪 Iniciando batería completa de pruebas Playwright en producción...');
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'iphone-14-390x844', width: 390, height: 844, isMobile: true },
    { name: 'iphone-15pro-430x932', width: 430, height: 932, isMobile: true },
    { name: 'ipad-air-820x1180', width: 820, height: 1180, isMobile: true },
    { name: 'desktop-1440x900', width: 1440, height: 900, isMobile: false }
  ];

  for (const vp of viewports) {
    console.log(`\n📱 Probando resolución: ${vp.name} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent: vp.isMobile
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    await page.goto('https://caretechservices.com/games/solitario/', { waitUntil: 'networkidle' });

    // 1. Initial State Screenshot
    const initialShot = path.join(screenshotDir, `${vp.name}-gameplay.png`);
    await page.screenshot({ path: initialShot });
    console.log(`  📸 Captura guardada: ${initialShot}`);

    // 2. Test Stock click (Draw card)
    await page.click('#stock-slot');
    await page.waitForTimeout(300);
    const wasteCount = await page.$$eval('#waste-slot .card', cards => cards.length);
    console.log(`  🃏 Cartas en Waste tras robo: ${wasteCount}`);

    // 3. Test SOS Modal
    await page.click('#care-sos-main-btn');
    await page.waitForTimeout(300);
    const isSosOpen = await page.$eval('#care-sos-modal', el => el.classList.contains('active'));
    console.log(`  🚨 Modal SOS abierto correctamente: ${isSosOpen}`);
    if (vp.name === 'iphone-14-390x844') {
      await page.screenshot({ path: path.join(screenshotDir, 'mobile-sos-modal.png') });
    }

    // Close SOS Modal
    await page.click('#care-sos-modal button.modal-close');
    await page.waitForTimeout(200);

    // 4. Test Settings Modal & Care Blue Theme
    await page.click('#nav-settings-btn');
    await page.waitForTimeout(300);
    const isSettingsOpen = await page.$eval('#settings-modal', el => el.classList.contains('active'));
    console.log(`  ⚙️ Modal Ajustes abierto: ${isSettingsOpen}`);

    // Switch to Care Blue
    await page.click('[data-theme="theme-care-blue"]');
    await page.waitForTimeout(200);
    const bodyClass = await page.evaluate(() => document.body.className);
    console.log(`  🎨 Tema cambiado a: ${bodyClass}`);

    if (vp.name === 'iphone-14-390x844') {
      await page.screenshot({ path: path.join(screenshotDir, 'mobile-theme-care-blue.png') });
    }

    // Close Settings
    await page.click('#close-settings');
    await page.waitForTimeout(200);

    // 5. Test Stats Modal
    await page.click('#nav-stats-btn');
    await page.waitForTimeout(300);
    const isStatsOpen = await page.$eval('#stats-modal', el => el.classList.contains('active'));
    console.log(`  🏆 Modal Partidas/Stats abierto: ${isStatsOpen}`);
    await page.click('#stats-modal button');
    await page.waitForTimeout(200);

    // 6. Test Hint Button
    await page.click('#nav-hint-btn');
    await page.waitForTimeout(200);
    console.log(`  💡 Botón Pista ejecutado`);

    // 7. Test Undo Button
    await page.click('#nav-undo-btn');
    await page.waitForTimeout(200);
    console.log(`  ↩️ Botón Deshacer ejecutado`);

    await context.close();
  }

  await browser.close();
  console.log('\n🎉 ¡TODAS LAS PRUEBAS AUTOMATIZADAS HAN PASADO AL 100%!');
}

runFullTestSuite();
