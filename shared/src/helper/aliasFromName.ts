// AI-GENERATED — not an architecture reference
import {
  ALIAS_MAX_CHARS,
  ALIAS_MIN_CHARS,
  RESERVED_ALIAS,
  VALID_ALIAS_REGEX,
} from '../schema/user.schema'

/**
 * Turning a person's name into a proposal for their gradido address.
 *
 * The alias may only hold `[a-zA-Z0-9]` with `_` or `-` between, while a name may hold
 * any alphabet at all - `VALID_NAME_REGEX` allows `\p{L}`, and the schema tests accept
 * `张三` on purpose. So this is not a filter: dropping what the alias cannot take would
 * leave a member with a Greek or Cyrillic name holding nothing, and a member with a
 * Chinese name holding nothing at all.
 *
 * Writing a name in latin letters is transliteration, not extraction - you cannot pull
 * a letter out of `张三`, you have to know that 张 reads "Zhang". For Greek and Cyrillic
 * that is a fixed table of some forty entries. For CJK it is a dictionary of thousands
 * with ambiguous readings, which is why there is no table for it here and no library
 * either: the fallback for those names is the email local part, the one latin thing
 * that already belongs to them.
 *
 * ⚠️ Nothing here promises a usable result. The caller checks each candidate against
 * `aliasSchema` before writing it - a migration that stores an invalid alias is worse
 * than one that stores none, because `findUserByIdentifier` decides from the schema
 * what KIND of identifier it was given, so its owner would be unreachable at their own
 * address.
 */

/** Written out before accents are stripped, or `ö` would arrive as `o`. */
const GERMAN: Record<string, string> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
}

/** Latin letters that carry no combining mark to strip, so NFD leaves them whole. */
const LATIN_SOLID: Record<string, string> = {
  ø: 'o',
  ł: 'l',
  đ: 'd',
  ð: 'd',
  þ: 'th',
  æ: 'ae',
  œ: 'oe',
  ı: 'i',
  ŋ: 'n',
  ħ: 'h',
}

const GREEK: Record<string, string> = {
  α: 'a',
  β: 'v',
  γ: 'g',
  δ: 'd',
  ε: 'e',
  ζ: 'z',
  η: 'i',
  θ: 'th',
  ι: 'i',
  κ: 'k',
  λ: 'l',
  μ: 'm',
  ν: 'n',
  ξ: 'x',
  ο: 'o',
  π: 'p',
  ρ: 'r',
  σ: 's',
  ς: 's',
  τ: 't',
  υ: 'y',
  φ: 'f',
  χ: 'ch',
  ψ: 'ps',
  ω: 'o',
}

const CYRILLIC: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  ё: 'e',
  і: 'i',
  ї: 'i',
  є: 'e',
  ґ: 'g',
}

/** Keeps `Müller` reading as `Mueller` rather than `MUeller`. */
function matchCase(source: string, mapped: string): string {
  if (mapped.length === 0 || source === source.toLowerCase()) {
    return mapped
  }
  return mapped.charAt(0).toUpperCase() + mapped.slice(1)
}

function mapWith(table: Record<string, string>, text: string): string {
  let out = ''
  for (const char of text) {
    const mapped = table[char.toLowerCase()]
    out += mapped === undefined ? char : matchCase(char, mapped)
  }
  return out
}

/**
 * The rungs, in order. German first, because stripping accents would otherwise turn
 * `ö` into `o` and lose the `e` that belongs to it.
 */
export function transliterateForAlias(text: string): string {
  if (!text) {
    return ''
  }
  let out = mapWith(GERMAN, text)
  out = mapWith(LATIN_SOLID, out)
  // NFD splits `é` into `e` + accent, and the accent falls to the class below. It also
  // strips the accents Greek vowels carry, which is why the Greek table needs no
  // accented entries of its own.
  out = out.normalize('NFD').replace(/\p{Mn}/gu, '')
  out = mapWith(GREEK, out)
  out = mapWith(CYRILLIC, out)
  return out.replace(/[^a-zA-Z0-9]/g, '')
}

/** What a member typed before the `@`, minus any `+tag` they added for themselves. */
export function aliasStemFromEmail(email?: string | null): string {
  if (!email) {
    return ''
  }
  const local = email.split('@')[0] ?? ''
  return transliterateForAlias(local.split('+')[0] ?? '')
}

function isUsable(candidate: string): boolean {
  return (
    candidate.length >= ALIAS_MIN_CHARS &&
    VALID_ALIAS_REGEX.test(candidate) &&
    !RESERVED_ALIAS.includes(candidate.toLowerCase())
  )
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
  const first = transliterateForAlias(firstName ?? '')
  const last = transliterateForAlias(lastName ?? '')
  const candidates: string[] = []

  const push = (value: string) => {
    const trimmed = value.slice(0, ALIAS_MAX_CHARS)
    if (isUsable(trimmed) && !candidates.includes(trimmed)) {
      candidates.push(trimmed)
    }
  }

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
