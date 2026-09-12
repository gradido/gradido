// AI-GENERATED — not an architecture reference

/**
 * What a member's circle shows when there is no picture, and what colour it is — the
 * wallet's rule (AS-010), so the same member looks the same in both interfaces.
 *
 * The two halves come from different sources on purpose:
 *
 *   * the LETTERS from the alias, because the line beside the circle shows the alias;
 *   * the COLOUR from the real initials, so no existing member's colour moves — and where
 *     the server sends the finished digit (`avatarColorIndex`, NU-017) that one wins, which
 *     is how a circle keeps its colour where the real name is not delivered at all.
 *
 * ⛔ The seed is returned RAW, in the case the names are stored in: `avatarPaletteEntry`
 * hashes with `charCodeAt`, so "bh" and "BH" are different colours. Uppercase the LETTERS,
 * never the seed.
 *
 * ★ Returned as one pair from one call, because letters and seed have to agree about which
 * member they describe. A caller that cannot take one half from here and the other from
 * somewhere else cannot get it wrong.
 *
 * @param {{alias?: string|null, firstName?: string|null, lastName?: string|null, avatarColorIndex?: number|null}|null} member
 * @returns {{letters: string, colorSeed: string, colorIndex: number|null}}
 */
export const avatarLettering = (member) => {
  const { alias, firstName, lastName, avatarColorIndex } = member ?? {}
  const colorSeed = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`
  return {
    letters: aliasLetters(alias) || colorSeed.toUpperCase(),
    colorSeed,
    // Integer or null, nothing in between: a query that does not ask for the field leaves
    // undefined, and anything unexpected falls back to the seed rather than breaking the
    // palette lookup.
    colorIndex: Number.isInteger(avatarColorIndex) ? avatarColorIndex : null,
  }
}

/**
 * The two characters an alias contributes.
 *
 * ⚠️ Separators first: an alias may carry `-` or `_` inside it, and a blind `slice(0, 2)`
 * would put a hyphen in front of a member. Stripping first also keeps the two letters the
 * ones a reader sees at the start of the alias: `j-doe` reads "JD".
 */
const aliasLetters = (alias) =>
  (alias ?? '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase()
