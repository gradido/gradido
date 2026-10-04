// AI-GENERATED — not an architecture reference

/**
 * Whether a line can be set in the wallet's handwriting, "Caveat" -- the first line of a
 * thank-you greeting.
 *
 * The font shipped with the wallet (assets/fonts/caveat/Caveat-600.woff2) is cut down to one
 * weight and three scripts: Latin, Latin Extended and Cyrillic. It carries no Greek -- the
 * typeface has none -- and nothing beyond these. A line holding one letter the font lacks
 * would come out mixed: that letter in the page's font, in the middle of handwriting. So the
 * LINE decides, whole: with such a letter in it, all of it is set in the page's font. Not the
 * language of the page -- a sender writes in her own language whatever the reader's wallet is
 * set to.
 *
 * Only letters, their marks and digits decide. A heart or another sign the font lacks is not
 * a letter set in the wrong hand.
 *
 * ⚠️ The ranges below are the code points of the shipped file, read from its `cmap`. They
 * belong to that one file (handwriting.spec.js holds its checksum): whoever replaces the font
 * reads them again --
 *   fonttools: sorted(TTFont('Caveat-600.woff2').getBestCmap()), folded into ranges.
 */
const CAVEAT_RANGES = [
  [32, 126],
  [160, 382],
  [399, 399],
  [402, 402],
  [452, 460],
  [468, 468],
  [485, 485],
  [487, 487],
  [489, 491],
  [495, 495],
  [497, 501],
  [506, 539],
  [543, 543],
  [567, 567],
  [601, 601],
  [658, 658],
  [700, 700],
  [710, 711],
  [713, 713],
  [730, 730],
  [732, 733],
  [769, 769],
  [772, 772],
  [776, 776],
  [1024, 1119],
  [1168, 1169],
  [1200, 1201],
  [7692, 7693],
  [7716, 7717],
  [7748, 7749],
  [7770, 7771],
  [7778, 7779],
  [7788, 7789],
  [7808, 7813],
  [7826, 7827],
  [7922, 7923],
  [7928, 7929],
  [8208, 8208],
  [8211, 8212],
  [8216, 8218],
  [8220, 8222],
  [8224, 8226],
  [8230, 8230],
  [8240, 8240],
  [8242, 8243],
  [8249, 8250],
  [8260, 8260],
  [8274, 8274],
  [8353, 8353],
  [8355, 8356],
  [8358, 8358],
  [8361, 8361],
  [8364, 8364],
  [8366, 8366],
  [8372, 8372],
  [8376, 8378],
  [8381, 8381],
  [8470, 8470],
  [8482, 8482],
  [8722, 8722],
  [8725, 8725],
]

const inCaveat = (codePoint) =>
  CAVEAT_RANGES.some(([from, to]) => codePoint >= from && codePoint <= to)

const DECIDES = /[\p{L}\p{M}\p{N}]/u

/**
 * @param {string | null | undefined} line
 * @returns {boolean} true where every letter, mark and digit of the line is in the font
 */
export const canWriteByHand = (line) =>
  // By code point, not by code unit: a letter beyond the basic plane is one letter.
  Array.from(line ?? '').every((char) => !DECIDES.test(char) || inCaveat(char.codePointAt(0)))

/** The family as caveat.css declares it: one name, one weight. */
export const HANDWRITING_FAMILY = 'Caveat'
export const HANDWRITING_WEIGHT = 600

/**
 * Resolves when the handwriting can draw the given texts on a canvas.
 *
 * A canvas does not wait for a web font -- printFont.js says it of Open Sans, and it holds for
 * this face as well: a face is fetched when a text uses it, and a canvas that draws before the
 * file has come draws, and MEASURES, in the fallback. `printFontReady` knows Open Sans only, so
 * the handwriting has a waiting of its own, with the texts that are set in it.
 *
 * Whoever calls this takes caveat.css in (see the note there): a family that is not declared
 * gives an empty list and no error, and the text is drawn in the fallback.
 *
 * Never rejects and has no time limit, like `printFontReady` beside it. Without a text nothing
 * is set in the handwriting, and its file is not fetched.
 *
 * @param {Array<string|null|undefined>} texts every text that will be set in the handwriting
 * @returns {Promise<void>}
 */
export const handwritingReady = async (texts) => {
  const fonts = typeof document === 'undefined' ? undefined : document.fonts
  if (!fonts || typeof fonts.load !== 'function') return

  const text = (Array.isArray(texts) ? texts : [texts])
    .filter((part) => typeof part === 'string' && part.length > 0)
    .join(' ')
  if (!text) return

  try {
    await fonts.load(`${HANDWRITING_WEIGHT} 16px ${HANDWRITING_FAMILY}`, text)
  } catch {
    // The file did not come: drawn in the fallback
  }
}
