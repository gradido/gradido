// AI-GENERATED — not an architecture reference

/**
 * The motifs a thank-you greeting can carry: five pictures of one family (ZE-021), each under
 * the key the server stores (shared/src/data/ThankYouGreeting.logic.ts, held together by
 * thankYouMotifs.drift.spec.js).
 *
 * ⛔ Always shown as an `<img>`, never inlined: the five files share the ids of their
 * gradients, and inlined into one page the second picture would be painted with the
 * gradients of the first.
 *
 * The pictures are 360 x 250 (36 : 25), with a ground of their own, so they look the same on
 * a light and on a dark page.
 */
export const THANK_YOU_MOTIF_KEYS = [
  'heart-leaves',
  'giving-hands',
  'bouquet',
  'glowing-swirl',
  'morning-light',
]

export const THANK_YOU_MOTIF_WIDTH = 360
export const THANK_YOU_MOTIF_HEIGHT = 250

/**
 * What a motif is called, in the language of the page. The keys are written out one by one:
 * the unused-keys rule of the linter only counts a key it finds as a literal.
 */
const motifName = (key, t) => {
  switch (key) {
    case 'heart-leaves':
      return t('thank-you-greeting.motif.heart-leaves')
    case 'giving-hands':
      return t('thank-you-greeting.motif.giving-hands')
    case 'bouquet':
      return t('thank-you-greeting.motif.bouquet')
    case 'glowing-swirl':
      return t('thank-you-greeting.motif.glowing-swirl')
    case 'morning-light':
      return t('thank-you-greeting.motif.morning-light')
    default:
      return null
  }
}

/**
 * The picture and the name of a motif, or null where there is none to show: no key, or a key
 * this wallet does not know -- a server newer than the wallet may name a sixth, and a
 * greeting may one day carry a photo instead of a motif.
 *
 * @param {string | null | undefined} key the motif as the server stores it
 * @param {(key: string) => string} t the page's translate function
 * @returns {{ key: string, src: string, name: string } | null}
 */
export const thankYouMotif = (key, t) =>
  THANK_YOU_MOTIF_KEYS.includes(key)
    ? { key, src: `/img/thank-you-greeting/${key}.svg`, name: motifName(key, t) }
    : null

/** All five, in the order the picker shows them. */
export const thankYouMotifs = (t) => THANK_YOU_MOTIF_KEYS.map((key) => thankYouMotif(key, t))
