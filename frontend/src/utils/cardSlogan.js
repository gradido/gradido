// AI-GENERATED — not an architecture reference

/**
 * The slogan as both printed cards carry it: the first of the three triads on the sign-in
 * pages (`components/Auth/AuthTriads.vue`), on one line.
 *
 * Built in one place, so the business card and the thank-you card cannot come to say it
 * differently -- and reused from the sign-in pages rather than written again, so it needs no
 * translation of its own in any of the ten languages.
 *
 * @param {(key: string) => string} t
 * @returns {string}
 */
export const cardSlogan = (t) =>
  [t('auth.triads.slogan.help'), t('auth.triads.slogan.give'), t('auth.triads.slogan.thank')].join(
    ' ',
  )
