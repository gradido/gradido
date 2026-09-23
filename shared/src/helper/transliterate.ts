// AI-GENERATED — not an architecture reference

/**
 * Writing a name in latin letters is transliteration, not extraction - you cannot pull
 * a letter out of `张三`, you have to know that 张 reads "Zhang". For Greek and Cyrillic
 * that is a fixed table of some forty entries. For CJK it is a dictionary of thousands
 * with ambiguous readings, which is why there is no table for it here and no library
 * either.
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

function isUpper(char: string | undefined): boolean {
  return char !== undefined && char !== char.toLowerCase()
}

function isLetter(char: string | undefined): boolean {
  return char !== undefined && /\p{L}/u.test(char)
}

/**
 * The tables only hold lower case, so a capital needs its case put back - `Äpfel` reads
 * as `Aepfel`, not `aepfel`. One letter alone cannot tell a capitalised word from one
 * written in capitals, so the neighbour decides: `MÜLLER` becomes `MUELLER`, not
 * `MUeLLER`. At the end of a word the letter before stands in for the one after.
 *
 * `ß` counts as lower case although it is written in capitals too, because hardly anyone
 * types `ẞ`. So it follows the capitals around it: `GROß` becomes `GROSS`, `Weiß` stays
 * `Weiss`.
 */
function matchCase(
  mapped: string,
  char: string,
  prev: string | undefined,
  next: string | undefined,
): string {
  if (char === 'ß') {
    const inCapitals = isUpper(prev) && (!isLetter(next) || isUpper(next))
    return inCapitals ? mapped.toUpperCase() : mapped
  }
  if (!isUpper(char)) {
    return mapped
  }
  const inCapitals = isLetter(next) ? isUpper(next) : isUpper(prev)
  return inCapitals ? mapped.toUpperCase() : mapped.charAt(0).toUpperCase() + mapped.slice(1)
}

/** Replaces every letter found in `table` (keyed in lower case), keeping its case. */
function mapLetters(table: Record<string, string>, text: string): string {
  const chars = Array.from(text)
  let out = ''
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    const mapped = table[char.toLowerCase()]
    out += mapped === undefined ? char : matchCase(mapped, char, chars[i - 1], chars[i + 1])
  }
  return out
}

/**
 * Spells out the German umlauts and `ß` the way German writes them without: `Müller`
 * becomes `Mueller`, `Weiß` becomes `Weiss`.
 *
 * NFC comes first because the table matches the PRECOMPOSED letters. The same name typed
 * on macOS arrives decomposed - a plain `u` followed by U+0308 - and without this the
 * mark is later stripped on its own, so `Müller` would end up as `Muller`.
 *
 * `normaliseKeyWord` in `backend/src/apis/anthropic/matching/keyWords.ts` keeps its own
 * copy of this rule on purpose: it has to stay textually identical to the GMS's.
 */
export function foldGermanLetters(text: string): string {
  return mapLetters(GERMAN, text.normalize('NFC'))
}

/**
 * The rungs, in order. German first, because stripping accents would otherwise turn
 * `ö` into `o` and lose the `e` that belongs to it.
 *
 * Only letters are replaced; spaces, digits and punctuation pass through, as does any
 * letter of a script with no table here.
 */
export function transliterateToLatin(text: string): string {
  let out = foldGermanLetters(text)
  out = mapLetters(LATIN_SOLID, out)
  // NFD splits `é` into `e` + accent, and the accent falls to the class below. It also
  // strips the accents Greek vowels carry, which is why the Greek table needs no
  // accented entries of its own.
  out = out.normalize('NFD').replace(/\p{Mn}/gu, '')
  out = mapLetters(GREEK, out)
  return mapLetters(CYRILLIC, out)
}
