const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));

  await page.goto('https://caretechservices.com/games/solitario/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  const diag = await page.evaluate(() => {
    const sBtn = document.getElementById('nav-settings-btn');
    const sModal = document.getElementById('settings-modal');
    const pBtn = document.getElementById('nav-stats-btn');
    const pModal = document.getElementById('stats-modal');

    // Test clicking directly
    sBtn.click();
    const isSettingsOpen = sModal.classList.contains('active');

    pBtn.click();
    const isStatsOpen = pModal.classList.contains('active');

    return {
      bodyClass: document.body.className,
      isSettingsOpen,
      isStatsOpen,
      settingsModalClasses: sModal.className,
      statsModalClasses: pModal.className,
      stockCount: document.querySelectorAll('#stock-slot .card').length,
      tableauCards: document.querySelectorAll('.tableau-col .card').length
    };
  });

  console.log('DIAGNOSTIC RESULT:', diag);
  await browser.close();
})();
