// AI-GENERATED — not an architecture reference

import { avatarPaletteEntry } from './avatarColor'

/**
 * What a members's avatar shows when there is no picture, and what colour it is.
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
 * community, or an old row -- which is exactly today's behaviour. Aliases are `[a-zA-Z0-9]`
 * and at least three characters long (VALID_ALIAS_REGEX), so where one exists there are
 * always two plain characters to take, and never an umlaut or a space.
 *
 * @param {{alias?: string|null, firstName?: string|null, lastName?: string|null}} member
 * @returns {{letters: string, colorSeed: string}}
 */
export const avatarLettering = ({ alias, firstName, lastName } = {}) => {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
  const fromAlias = (alias ?? '').slice(0, 2).toUpperCase()
  return {
    letters: fromAlias || initials,
    // Unchanged from what every caller passed before this file existed, which is what
    // keeps existing colours where they are.
    colorSeed: initials,
  }
}

/**
 * The palette entry for a member, by the same rule. Here so that anything drawing an avatar
 * outside a Vue component -- the card, the cheque -- asks the same question in the same
 * way rather than reaching for the seed and the palette separately.
 */
export const avatarPaletteFor = (member) => avatarPaletteEntry(avatarLettering(member).colorSeed)
