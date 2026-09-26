// AI-GENERATED — not an architecture reference
import { ALIAS_MAX_CHARS, aliasSchema } from '../schema'
import { transliterateToLatin } from './transliterate'

/**
 * Turning a person's name into a proposal for their gradido address.
 *
 * The alias may only hold `[a-zA-Z0-9]` with `_` or `-` between, while a name may hold
 * any alphabet at all - `VALID_NAME_REGEX` allows `\p{L}`, and the schema tests accept
 * `张三` on purpose. So this is not a filter: dropping what the alias cannot take would
 * leave a member with a Greek or Cyrillic name holding nothing, and a member with a
 * Chinese name holding nothing at all.
 *
 * For CJK names `transliterateToLatin` has nothing to give (see there why), so the
 * fallback for those is the email local part, the one latin thing that already belongs
 * to them.
 *
 * ⚠️ Nothing here promises a usable result. The caller checks each candidate against
 * `aliasSchema` before writing it - a migration that stores an invalid alias is worse
 * than one that stores none, because `findUserByIdentifier` decides from the schema
 * what KIND of identifier it was given, so its owner would be unreachable at their own
 * address.
 */

/**
 * The name in latin letters, reduced to what an alias can hold. A script with no table
 * in `transliterateToLatin` comes back empty.
 */
export function transliterateForAlias(text: string): string {
  return transliterateToLatin(text)
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, ALIAS_MAX_CHARS)
}

/** What a member typed before the `@`, minus any `+tag` they added for themselves. */
export function aliasStemFromEmail(email: string): string {
  const local = email.split('@')[0]
  return transliterateForAlias(local.split('+')[0] ?? '')
}

/**
 * The first name plus the first `taken` letters of the last name, as an alias.
 *
 * The last name is cut BEFORE it is transliterated, never after: `Hückstädt` gives
 * `BerndH`, then `BerndHue` - not `BerndHu`, a replacement cut in half. NFC and whole
 * characters, so a decomposed `ü` (u + U+0308, as macOS sends it) is not split either.
 */
function nameWithLastNamePrefix(firstName: string, lastName: string, taken: number): string {
  const lastPrefix = Array.from(lastName.normalize('NFC')).slice(0, taken).join('')
  return transliterateForAlias(firstName + lastPrefix)
}

/**
 * Proposals for one person, best first. The caller takes the first that is still free,
 * appending digits for a clash - and falls back to something of its own if the list
 * runs out, which it does for a name in a script with no table here.
 *
 * Walking further into the last name is what answers both "too short" and "that word is
 * reserved": `A B` has no second letter to take and drops through to the email, while
 * `Al Bo` gives `AlB` - unusable at two letters, usable at three. Appending a digit
 * would answer neither, since a name that reads like an office is worse than a long
 * one.
 */
export function aliasCandidates(
  firstName: string,
  lastName: string,
  email: string,
  userId: number,
): string[] {
  const candidates: string[] = []

  const push = (value: string) => {
    if (value.length && !candidates.includes(value) && aliasSchema.safeParse(value).success) {
      candidates.push(value)
    }
  }

  const lastLength = Array.from(lastName.normalize('NFC')).length
  for (let taken = 1; taken <= lastLength; taken++) {
    push(nameWithLastNamePrefix(firstName, lastName, taken))
  }
  // A member with only one of the two still gets a proposal from it.
  push(transliterateForAlias(firstName))
  push(transliterateForAlias(lastName))
  push(aliasStemFromEmail(email))
  push(fallbackAlias(userId))

  return candidates
}

const numberedAlias = (candidate: string, suffix: number): string =>
  candidate.slice(0, ALIAS_MAX_CHARS - String(suffix).length) + suffix

/**
 * A regex matching the candidate and every numbered variant `findFirstFreeAlias` builds
 * from it - including the ones where the digits cut the candidate short to stay within
 * ALIAS_MAX_CHARS. Candidates are alphanumeric (`transliterateForAlias`), so nothing
 * needs escaping.
 */
export function aliasVariantsPattern(candidate: string): string {
  const oneDigit = candidate.slice(0, ALIAS_MAX_CHARS - 1)
  const twoDigits = candidate.slice(0, ALIAS_MAX_CHARS - 2)
  return `^(${candidate}|${oneDigit}[0-9]|${twoDigits}[0-9]{2})$`
}

export function findFirstFreeAlias(existing: string[], candidates: string[]): string | null {
  // The unique key on user_aliases.alias is case-insensitive (utf8mb4_unicode_ci), so the
  // comparison is too. What is returned keeps its spelling: `BerndH`, not `berndh`.
  const taken = new Set(existing.map((alias) => alias.toLowerCase()))
  const isFree = (alias: string) => !taken.has(alias.toLowerCase())

  // Every candidate as it is first, only then with 1..99 appended: `BerndHue` and
  // `BerndHo` are easier to tell apart than `BerndH1` and `BerndH2`.
  for (const candidate of candidates) {
    if (isFree(candidate)) {
      return candidate
    }
  }
  for (const candidate of candidates) {
    for (let suffix = 1; suffix <= 99; suffix++) {
      const numbered = numberedAlias(candidate, suffix)
      if (isFree(numbered)) {
        return numbered
      }
    }
  }
  return null
}

// The default generated alias, tried first because it is free in most cases. The same
// rule as the first rung of `aliasCandidates`, so both agree on what `BerndH` is.
export function primaryAliasCandidate(firstName: string, lastName: string): string | null {
  const candidate = nameWithLastNamePrefix(firstName, lastName, 1)
  return aliasSchema.safeParse(candidate).success ? candidate : null
}

/**
 * The last rung, and the one that must never fail. A migration that throws stops
 * `start.sh` before the services come up, so there has to be something valid at the
 * end of every path - including a name in a script with no table above and an address
 * that gives nothing either.
 *
 * The member id is what makes it unique without a counter, and `gradido` is not an
 * option: the word is on the reserved list itself.
 */
export function fallbackAlias(userId: number): string {
  return `member${userId}`
}
