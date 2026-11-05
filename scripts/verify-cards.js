/**
 * Automated Verification Script for CareTech Games - 4 SVG Card Decks
 * Verifies that all 4 decks (accessible, classic, modern, minimalist)
 * contain exactly 53 normalized SVG files (52 cards in {SUIT}-{VALUE}.svg + 1 back.svg).
 */

const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.resolve(__dirname, '../assets/cards'),
  path.resolve(__dirname, '../caretech-games-pwa-deployment-v1/templates/solitario/assets/cards')
];

const decks = ['accessible', 'classic', 'modern', 'minimalist'];
const suits = ['H', 'D', 'S', 'C'];
const values = Array.from({ length: 13 }, (_, i) => i + 1);

const expectedFiles = [];
suits.forEach(s => {
  values.forEach(v => {
    expectedFiles.push(`${s}-${v}.svg`);
  });
});
expectedFiles.push('back.svg');

let totalErrors = 0;

targetDirs.forEach(baseDir => {
  if (!fs.existsSync(baseDir)) {
    console.warn(`[Skip] Directory does not exist yet: ${baseDir}`);
    return;
  }

  console.log(`\n🔍 Verifying assets in: ${baseDir}`);

  decks.forEach(deck => {
    const deckDir = path.join(baseDir, deck);
    if (!fs.existsSync(deckDir)) {
      console.error(`❌ [${deck}] Missing directory: ${deckDir}`);
      totalErrors++;
      return;
    }

    const files = fs.readdirSync(deckDir).filter(f => !f.startsWith('.'));
    if (files.length !== 53) {
      console.error(`❌ [${deck}] Expected 53 files, found: ${files.length}`);
      totalErrors++;
    } else {
      console.log(`✅ [${deck}] Contains exactly 53 files.`);
    }

    // Verify all required cards and back exist and are non-empty
    let missingOrEmpty = 0;
    expectedFiles.forEach(file => {
      const p = path.join(deckDir, file);
      if (!fs.existsSync(p)) {
        console.error(`   ❌ Missing: ${file}`);
        missingOrEmpty++;
      } else {
        const stat = fs.statSync(p);
        if (stat.size === 0) {
          console.error(`   ❌ Empty SVG: ${file}`);
          missingOrEmpty++;
        }
      }
    });

    if (missingOrEmpty > 0) {
      totalErrors += missingOrEmpty;
    }
  });
});

if (totalErrors === 0) {
  console.log('\n🎉 ALL 4 SVG DECKS FULLY VERIFIED (53 files each: 52 cards + 1 back.svg)!');
  process.exit(0);
} else {
  console.error(`\n❌ VERIFICATION FAILED: Found ${totalErrors} errors.`);
  process.exit(1);
}
