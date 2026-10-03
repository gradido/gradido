// AI-GENERATED — not an architecture reference

/**
 * The font of the printed starting-bonus cheque has to be THERE before the drawer measures or
 * writes its first word -- a canvas does not wait for a web font, it draws in the fallback and
 * the next drawing looks different.
 *
 * The wallet has a file of the same name (frontend/src/utils/printFont.js; the measurements
 * behind both are written down there). The two differ in one thing: the wallet's stylesheet
 * declares Open Sans, the admin's pages do not know the family. So this one declares it first.
 *
 * - The declaration is a copy of the wallet's (assets/fonts/open-sans/open-sans.css, kept
 *   byte-identical by printFont.spec.js). Its addresses are /fonts/open-sans/..., the files
 *   the wallet serves from its root -- where the cheque fetches its pictures as well.
 * - ⛔ Imported with `?raw` and hung in as a <style>, not imported as a stylesheet: vite cannot
 *   resolve those addresses in the admin (base '/admin/', no public folder) and warns once
 *   per file. As text it arrives unchanged.
 * - Declared once, and only when somebody draws a cheque. A declared face costs nothing until
 *   a text uses it, but two declarations of one family fetch every file twice.
 * - ⛔ Declared BEFORE the wait: for a family that is not declared, `document.fonts.load()`
 *   answers with an empty list and no error, and the cheque would be drawn in the fallback
 *   without anybody noticing.
 */

import declaration from '../assets/fonts/open-sans/open-sans.css?raw'

const STYLE_ID = 'print-font-open-sans'

// The weights the drawer asks for, as in the wallet's file.
const WEIGHTS = [400, 500, 600, 700]

const declareOnce = () => {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = declaration
  document.head.appendChild(style)
}

/**
 * Resolves when Open Sans can draw the given texts.
 *
 * Never rejects and has no time limit, like the pictures the drawer waits for beside it. If
 * the font cannot be loaded -- or the environment has no `document.fonts` -- the cheque is
 * drawn in the fallback: a cheque in the wrong font is better than no cheque.
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

  // ⛔ allSettled, not all: `Promise.all` gives up at the first weight that cannot be loaded,
  // and the drawer would measure while another weight is still on its way -- the first
  // drawing would differ from the next again. A weight that failed is drawn in the fallback.
  try {
    declareOnce()
    await Promise.allSettled(
      WEIGHTS.map((weight) => fonts.load(`${weight} 16px "Open Sans"`, text || ' ')),
    )
  } catch {
    // declaring or load() itself threw: drawn in the fallback
  }
}
