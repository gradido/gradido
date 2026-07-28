// First-name -> grammatical-gender heuristic for Crea's salutation (design doc
// `G` ch. 4, E-013). The Gradido account has no gender field, so the code guesses
// "Liebe/Lieber" from a name list. This is only the FIRST GUESS -- the moderator
// corrects it via the salutation field / gender buttons (E-013). A wrong guess is
// worse than a neutral one, so genuinely ambiguous names (Kim, Toni, ...) stay
// uncertain and fall through to the neutral, flagged path (E-005).
//
// The list is a ~35k-entry dataset derived from nam_dict.txt (Joerg Michael), with
// the German reading preferred and unisex / cross-locale-ambiguous names omitted
// on purpose. Data + its GFDL licence: nameGenderData.ts / nameGenderData.GFDL.txt.
//
// PII stays local: the recipient's name is only used here to build the salutation;
// it never reaches the Anthropic API (E-012).

import { FEMALE_NAMES, MALE_NAMES } from './nameGenderData'

export type NameGender = 'male' | 'female' | null

// Normalise to the lookup key the dataset was built with: umlauts/ss to their
// German ASCII form, then strip remaining diacritics and non-letters, so
// "Guenther" / "Gunther" all reach the same key as "Guenther" from "Günther".
export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z]/g, '')
}

const MALE_SET = new Set(MALE_NAMES.split(','))
const FEMALE_SET = new Set(FEMALE_NAMES.split(','))

/**
 * Guesses the grammatical gender of a first name, or `null` when the name is
 * unknown or ambiguous. Uses the leading given name (split on space/hyphen), so
 * "Anna-Lena" and "Anna Maria" resolve on the first name.
 */
export function guessGender(firstName: string | null | undefined): NameGender {
  if (!firstName) {
    return null
  }
  const key = normalizeName(firstName.split(/[\s-]+/)[0] ?? '')
  if (!key) {
    return null
  }
  if (MALE_SET.has(key)) {
    return 'male'
  }
  if (FEMALE_SET.has(key)) {
    return 'female'
  }
  return null
}
