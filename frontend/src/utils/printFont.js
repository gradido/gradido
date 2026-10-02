// AI-GENERATED — not an architecture reference

/**
 * The font of the printed pieces -- the Gradido card, the thank-you card, the cheque -- has to
 * be THERE before a drawer measures or writes its first word.
 *
 * A canvas does not wait for a web font. If the font has not arrived, the browser draws in the
 * fallback and only then starts fetching; the next drawing looks different. That is what the
 * printed pieces did until Open Sans shipped with the wallet: the first card of a session came
 * out in the device's font, every later one in Open Sans.
 *
 * `document.fonts.load(font, text)` fetches the faces THE TEXT needs and resolves when they are
 * usable. Measured in Chrome:
 * - ⛔ The text decides which files are fetched. Open Sans is declared in ten subsets
 *   (assets/fonts/open-sans/open-sans.css); without the text only the Latin one arrives, and
 *   a Greek or Cyrillic name would stand in the fallback the first time. So a drawer hands in
 *   EVERY text it sets, the fixed ones too.
 * - A missing file makes `load()` reject. A family that is not declared at all gives an empty
 *   list and no error.
 *
 * The family is declared in the wallet's stylesheet (main.js imports it) and nowhere else:
 * two declarations of one family in a page fetch every file twice.
 *
 * The admin has a file of the same name that declares the family first, because the admin's
 * pages do not know it. Same name, same call -- which is what lets thankYouCheque.js stay
 * byte-identical in both.
 */

// The weights the drawers ask for. 500 is drawn in the face declared for 400 -- asking for it
// by its own number keeps this list a copy of what the drawers say, not of how it resolves.
const WEIGHTS = [400, 500, 600, 700]

/**
 * Resolves when Open Sans can draw the given texts.
 *
 * Never rejects and has no time limit, like the pictures the drawers wait for beside it. If
 * the font cannot be loaded -- or the environment has no `document.fonts` -- the piece is
 * drawn in the fallback: a card in the wrong font is better than no card.
 *
 * @param {Array<string|null|undefined>} texts every text the piece will set
 * @returns {Promise<void>}
 */
export const printFontReady = async (texts) => {
  const fonts = typeof document === 'undefined' ? undefined : document.fonts
  if (!fonts || typeof fonts.load !== 'function') return

  const text = (Array.isArray(texts) ? texts : [texts])
    .filter((part) => typeof part === 'string' && part.length > 0)
    .join(' ')

  try {
    await Promise.all(
      WEIGHTS.map((weight) => fonts.load(`${weight} 16px "Open Sans"`, text || ' ')),
    )
  } catch {
    // drawn in the fallback
  }
}
