// AI-GENERATED — not an architecture reference

/**
 * Whether a name can be set in the typeface of the logo's wordmark, "Afacad" -- the name of
 * the community beside the coin, top left in the wallet (Menu/Navbar.vue).
 *
 * The font shipped with the wallet (assets/fonts/afacad/Afacad-525.woff2) is one weight of a
 * Latin typeface: it carries no Greek, no Cyrillic and nothing beyond Latin. A name holding
 * one letter the font lacks would come out mixed, that letter in the page's font in the
 * middle of the wordmark's. So the NAME decides, whole: with such a letter in it, all of it
 * is set in the page's font -- the rule the handwriting follows (handwriting.js).
 *
 * Only letters, their marks and digits decide; a sign the font lacks is not a letter set in
 * the wrong face.
 *
 * ⚠️ The ranges below are the code points of the shipped file, read from its `cmap`. They
 * belong to that one file (logoFace.spec.js holds its checksum): whoever replaces the font
 * reads them again --
 *   fonttools: sorted(TTFont('Afacad-525.woff2').getBestCmap()), folded into ranges.
 */
const AFACAD_RANGES = [
  [13, 13],
  [32, 126],
  [160, 172],
  [174, 328],
  [330, 382],
  [399, 399],
  [402, 402],
  [416, 417],
  [431, 432],
  [439, 439],
  [452, 460],
  [484, 491],
  [494, 495],
  [506, 539],
  [554, 557],
  [560, 563],
  [567, 567],
  [601, 601],
  [658, 658],
  [710, 711],
  [728, 733],
  [768, 772],
  [774, 780],
  [783, 783],
  [785, 786],
  [795, 795],
  [803, 804],
  [806, 808],
  [814, 814],
  [817, 817],
  [821, 822],
  [956, 956],
  [960, 960],
  [3647, 3647],
  [7808, 7813],
  [7838, 7838],
  [7840, 7929],
  [8194, 8202],
  [8208, 8208],
  [8211, 8212],
  [8214, 8214],
  [8216, 8218],
  [8220, 8222],
  [8224, 8226],
  [8230, 8230],
  [8240, 8240],
  [8242, 8243],
  [8249, 8250],
  [8258, 8258],
  [8260, 8260],
  [8274, 8274],
  [8304, 8304],
  [8308, 8318],
  [8320, 8334],
  [8353, 8353],
  [8358, 8358],
  [8360, 8366],
  [8369, 8370],
  [8372, 8373],
  [8376, 8378],
  [8380, 8383],
  [8453, 8453],
  [8467, 8467],
  [8470, 8470],
  [8482, 8482],
  [8486, 8486],
  [8494, 8494],
  [8531, 8532],
  [8539, 8542],
  [8586, 8587],
  [8592, 8601],
  [8706, 8706],
  [8709, 8710],
  [8719, 8719],
  [8721, 8722],
  [8725, 8725],
  [8729, 8730],
  [8734, 8734],
  [8747, 8747],
  [8776, 8776],
  [8800, 8800],
  [8804, 8805],
  [9632, 9633],
  [9642, 9643],
  [9650, 9657],
  [9660, 9667],
  [9670, 9671],
  [9674, 9675],
  [9679, 9679],
  [9702, 9702],
  [10216, 10217],
  [63743, 63743],
  [64257, 64258],
]

const inAfacad = (codePoint) =>
  AFACAD_RANGES.some(([from, to]) => codePoint >= from && codePoint <= to)

const DECIDES = /[\p{L}\p{M}\p{N}]/u

/**
 * @param {string | null | undefined} name
 * @returns {boolean} true where every letter, mark and digit of the name is in the font
 */
export const inLogoFace = (name) =>
  // By code point, not by code unit: a letter beyond the basic plane is one letter.
  Array.from(name ?? '').every((char) => !DECIDES.test(char) || inAfacad(char.codePointAt(0)))
