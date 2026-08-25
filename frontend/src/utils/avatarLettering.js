// AI-GENERATED — not an architecture reference

/**
 * What a member's avatar shows when there is no picture, and what colour it is.
 *
 * ★ The two are deliberately NOT the same source, and that is the whole reason this file
 * exists (decision AS-010):
 *
 *   * the LETTERS come from the alias, because the line next to the avatar shows the alias.
 *     A circle reading "BH" beside a line reading "berndh" is the real name coming back in
 *     through the picture that the line was chosen to avoid.
 *   * the COLOUR keeps coming from the real initials, so not one existing member's colour
 *     changes -- and so the printed card and the cheque, which seed from initials on a
 *     canvas that cannot ask a Vue component, stay in step with the screen.
 *
 * ⛔ The colour seed is returned RAW, in the case the names are stored in, and that single
 * word carries the whole promise above. `avatarPaletteEntry` hashes with `charCodeAt`, so
 * it is case-sensitive: "bh" and "BH" are different colours. Every other producer of this
 * seed passes the characters through untouched -- `Navbar.vue`, `UserCard.vue`,
 * `ContributionMessagesListItem.vue`, `useGradidoCard.js`, `useThankYouCheque.js` -- and
 * the uppercasing a member sees is `text-transform` in CSS, which never reaches the hash.
 * A `.toUpperCase()` here moves the colour of every member whose first or last name starts
 * lower case ("van Dijk", "de la Cruz", or a name simply typed in lower case), and leaves
 * their already-printed card behind at the old one. Uppercase the LETTERS, never the seed.
 *
 * ★★ The pair is returned together, from one call, on purpose. The letters and the seed
 * are two values that must agree about which member they describe, and the last time this
 * house let several call sites assemble such a pair themselves, three of four passed the
 * right value and the fourth put a raw placeholder in front of members. A caller that
 * cannot take one half from here and the other from somewhere else cannot get it wrong.
 *
 * ★ A welcome side effect of two independent sources: the circle now carries two signals
 * instead of one. Two members with similar aliases get the same two letters but different
 * colours, because the colour is drawn from somewhere else entirely. With a single source
 * they would have been indistinguishable.
 *
 * Falling back to the real initials where there is no alias -- a member of another
 * community, or an old row -- which is exactly today's behaviour.
 *
 * ★ `colorIndex` is the server-computed form of the same colour (NU-017): the backend
 * hashes the real initials itself and sends the finished digit, so the circle keeps its
 * colour even where firstName and lastName are no longer delivered for other members.
 * Where it is present it wins over the locally built seed (AppAvatar decides that); here
 * it is only passed through, next to the seed, so the pair-from-one-call rule above
 * covers all three values.
 *
 * ⚠️ A null member is not a programmer error here. A booking row whose counterparty the
 * backend could not resolve arrives as `linkedUser: null` (the field is nullable, and the
 * resolver's if/else-if chain has no final branch), and the sibling components in the same
 * row guard for it. A default parameter would not: `= {}` fires for `undefined` only, so
 * `null` would tear down the whole row -- and in the sidebar the whole list -- over a
 * circle. Hence the explicit `?? {}` below.
 *
 * @param {{alias?: string|null, firstName?: string|null, lastName?: string|null, avatarColorIndex?: number|null}|null} member
 * @returns {{letters: string, colorSeed: string, colorIndex: number|null}}
 */
export const avatarLettering = (member) => {
  const { alias, firstName, lastName, avatarColorIndex } = member ?? {}
  // Raw. See the second paragraph above -- this is the seed, not the display.
  const colorSeed = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`
  return {
    letters: aliasLetters(alias) || colorSeed.toUpperCase(),
    colorSeed,
    // Integer or null, nothing in between: a query that does not ask for the field
    // leaves undefined, and anything unexpected must fall back to the seed, not crash
    // the palette lookup.
    colorIndex: Number.isInteger(avatarColorIndex) ? avatarColorIndex : null,
  }
}

/**
 * The two characters an alias contributes to the circle.
 *
 * ⚠️ The separators have to come out first. VALID_ALIAS_REGEX is
 * `^(?=.{3,20}$)[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$` -- only the FIRST character is
 * guaranteed alphanumeric, so `a-team` and `j_doe` are valid aliases and a blind
 * `slice(0, 2)` puts a hyphen or an underscore in front of a member. Stripping first also
 * keeps the two letters the ones a reader sees at the start of the alias beside the circle:
 * `j-doe` reads "JD", `a-team` reads "AT".
 *
 * The length floor of three, with at least one alphanumeric per segment, means a valid
 * alias always has two of them -- so this returns either two characters or, for an absent
 * alias, an empty string, never one.
 */
const aliasLetters = (alias) =>
  (alias ?? '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase()
