// AI-GENERATED — not an architecture reference
import * as v from 'valibot'
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

/**
 * Proposals for one person, in the order they are to be tried (findFirstFreeAlias takes the
 * first that is free). The ladder: the first name with a growing prefix of the last name,
 * one letter at a time up to the whole of it (`Bernd Huber` -> `BerndH`, `BerndHu`, ...,
 * `BerndHuber`), then the first name alone, the last name alone, and last the local part of
 * the email address without its plus tag. The shortest form first, as it is what a member
 * expects; the longer rungs give a clash somewhere to go that still reads as a name -
 * `BerndHu` and `BerndHo` are easier to tell apart than `BerndH1` and `BerndH2`. The numbered
 * forms live in additionalAliasVariants and are asked about only once every plain one is
 * taken.
 *
 * Only what `aliasSchema` accepts gets onto the list, each form once. So a rung that is too
 * short (`A B` gives `AB`), a reserved word, or one that transliterated to nothing (a script
 * without a table) is simply skipped, and the ladder goes on to the next rung instead of
 * numbering a bad one. That is also why the list can be EMPTY - a CJK name over an address
 * like `ab@` - and the caller then falls back to something of its own (RegisterUserRole:
 * the gradido id).
 *
 * Letters of the last name are counted per code point after NFC, so an umlaut that arrived
 * decomposed is one step, and its replacement (`ü` -> `ue`) is never cut in half.
 */
export function aliasCandidates(user: {
  firstName: string
  lastName: string
  email: string
}): string[] {
  const { firstName, lastName, email } = user
  const candidates: string[] = []

  const push = (value: string) => {
    if (value.length && !candidates.includes(value) && v.safeParse(aliasSchema, value).success) {
      candidates.push(value)
    }
  }

  const lastLength = Array.from(lastName.normalize('NFC')).length
  for (let taken = 1; taken <= lastLength; taken++) {
    const lastPrefix = Array.from(lastName.normalize('NFC')).slice(0, taken).join('')
    push(transliterateForAlias(firstName + lastPrefix))
  }
  // A member with only one of the two still gets a proposal from it.
  push(transliterateForAlias(firstName))
  push(transliterateForAlias(lastName))
  push(transliterateForAlias(email.split('@')[0].split('+')[0]))
  return candidates
}

/**
 * The numbered forms of the candidates, for when every plain one is taken: each with 1..99
 * appended, in candidate order, cut short to stay within ALIAS_MAX_CHARS. The caller asks
 * the database about these only then, and chooses from the same list - `BerndHue` and
 * `BerndHo` are easier to tell apart than `BerndH1` and `BerndH2`, so the plain names of the
 * whole ladder come first.
 */
export function additionalAliasVariants(candidates: string[]): string[] {
  const variants = []
  for (const candidate of candidates) {
    for (let suffix = 1; suffix <= 99; suffix++) {
      variants.push(candidate.slice(0, ALIAS_MAX_CHARS - String(suffix).length) + suffix)
    }
  }
  return variants
}

export function findFirstFreeAlias(existing: string[], candidates: string[]): string | null {
  // The unique key on user_aliases.alias is case-insensitive (utf8mb4_unicode_ci), so the
  // comparison is too. What is returned keeps its spelling: `BerndH`, not `berndh`.
  const taken = new Set(existing.map((alias) => alias.toLowerCase()))
  return candidates.find((alias) => !taken.has(alias.toLowerCase())) ?? null
}
