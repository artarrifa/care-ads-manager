/**
 * Solitaire Logic & SVG Card Deck Asset Resolver
 * Compatible with the normalized 4 SVG Decks:
 * - accessible (Jumbo Senior)
 * - classic (Casino Poker)
 * - modern (Adrian Kennard / RevK)
 * - minimalist (Matt Cain)
 *
 * File naming convention:
 * Card: {SUIT}-{VALUE}.svg (e.g. H-1.svg, D-10.svg, S-13.svg)
 * Back: back.svg
 */

export type SuitCode = 'H' | 'D' | 'S' | 'C';
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type DeckTheme = 'accessible' | 'classic' | 'modern' | 'minimalist';

export const SUITS: Record<string, SuitCode> = {
  hearts: 'H',
  diamonds: 'D',
  spades: 'S',
  clubs: 'C'
};

export interface CardData {
  id: number;
  suit: SuitCode;
  value: CardValue;
  faceUp: boolean;
}

/**
 * Returns the relative or absolute path to a specific card's SVG
 */
export function getCardSvgPath(deck: DeckTheme, suit: SuitCode, value: CardValue, basePath = 'assets/cards'): string {
  return `${basePath}/${deck}/${suit}-${value}.svg`;
}

/**
 * Returns the path to the deck's card back SVG
 */
export function getCardBackSvgPath(deck: DeckTheme, basePath = 'assets/cards'): string {
  return `${basePath}/${deck}/back.svg`;
}

/**
 * Validates that a card filename conforms to {SUIT}-{VALUE}.svg or back.svg
 */
export function isValidCardFilename(filename: string): boolean {
  if (filename === 'back.svg') return true;
  const match = filename.match(/^([HDSC])-([1-9]|1[0-3])\.svg$/);
  return match !== null;
}
