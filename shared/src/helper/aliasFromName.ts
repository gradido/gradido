// AI-GENERATED — not an architecture reference
import { ALIAS_MAX_CHARS, aliasSchema } from '../schema/user.schema'
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
  return transliterateToLatin(text).replace(/[^a-zA-Z0-9]/g, '')
}

/** What a member typed before the `@`, minus any `+tag` they added for themselves. */
export function aliasStemFromEmail(email?: string | null): string {
  if (!email) {
    return ''
  }
  const local = email.split('@')[0] ?? ''
  return transliterateForAlias(local.split('+')[0] ?? '')
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
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
): string[] {
  const candidates: string[] = []
  const push = (value: string) => {
    const trimmed = value.slice(0, ALIAS_MAX_CHARS)
    if (value.length && !candidates.includes(trimmed) && aliasSchema.safeParse(trimmed).success) {
      candidates.push(trimmed)
    }
  }

  const first = transliterateForAlias(firstName ?? '')
  const last = transliterateForAlias(lastName ?? '')

  for (let taken = 1; taken <= last.length; taken++) {
    push(first + last.slice(0, taken))
  }
  // A member with only one of the two still gets a proposal from it.
  push(first)
  push(last)
  push(aliasStemFromEmail(email))

  return candidates
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

/**
 * Walks the proposals until one is free, widening each with a digit before moving on.
 * `isTaken` belongs to the caller because the two of them ask different things: the
 * migration only knows the users table it is filling, while registration has the whole
 * check including names other members left behind.
 *
 * ⚠️ The result is not trusted on the way out - the caller still parses it. This
 * function decides what to offer; only the schema decides what may be written.
 */
export async function pickFreeAlias(
  candidates: string[],
  userId: number,
  isTaken: (alias: string) => Promise<boolean>,
): Promise<string> {
  for (const candidate of [...candidates, fallbackAlias(userId)]) {
    if (!(await isTaken(candidate))) {
      return candidate
    }
    for (let suffix = 1; suffix <= 99; suffix++) {
      const numbered = candidate.slice(0, ALIAS_MAX_CHARS - String(suffix).length) + suffix
      if (!(await isTaken(numbered))) {
        return numbered
      }
    }
  }
  // Only reachable if `member<id>` and its hundred variants are all spoken for, which
  // takes a member deliberately hoarding them.
  throw new Error(`no free alias could be built for user ${userId}`)
}
