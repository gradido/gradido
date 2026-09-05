// AI-GENERATED — not an architecture reference
import { translateForLocale } from 'core'
import { DomainError, GradidoUnit, MEMO_MAX_CHARS, Result } from 'shared'
import { guessGender } from '@/apis/anthropic/crea/nameGender'

// Plain rules of the first creation: which sentence stems exist, how an entry becomes a
// memo, how 100 Gradido split over n entries, and how the four-line message is put
// together from locale keys (ES-006) and the model's lines. No orchestration here — that
// is interactions/firstCreation.

/** 100 Gradido, the whole first creation (E-022 / ES-008). */
export const FIRST_CREATION_TOTAL = GradidoUnit.fromNumber(100)

/** More entries than this and the smallest share drops under 10 GDD; the window stops at 10. */
export const FIRST_CREATION_MAX_ENTRIES = 10

/**
 * The sentence stems a member can complete (D §4, J §4). Each key is a phrase
 * `firstCreation.catalog.<key>` in core/src/locales with a `{text}` placeholder for what
 * the member wrote. The list is flat: how the window groups them is the window's business.
 */
export const FIRST_CREATION_CATALOG_KEYS = [
  'helpedSickPerson',
  'helpedOldPerson',
  'supportedDisabledPerson',
  'accompaniedHardTime',
  'caredForChildren',
  'lookedAfterGrandchildren',
  'nursedRelative',
  'supportedClub',
  'fireBrigadeRescue',
  'helpedParish',
  'communityProject',
  'helpedFellowStudents',
  'helpedNeighbourhood',
  'animalShelter',
  'natureEnvironment',
  'sharedKnowledge',
  'musicChoirCulture',
  'helpedAtHome',
  'madeSomeoneHappy',
  'lookedAfterOrTaught',
  'helpedElderlyPerson',
  'animalsOrNature',
] as const

/**
 * The sentences a member ticks instead of completing (D §5). A tick has no free text, no
 * model line, and a fixed line of thanks (`firstCreation.message.<key>Line`).
 */
export const FIRST_CREATION_CHECK_KEYS = ['retiree'] as const

export type FirstCreationCatalogKey = (typeof FIRST_CREATION_CATALOG_KEYS)[number]
export type FirstCreationCheckKey = (typeof FIRST_CREATION_CHECK_KEYS)[number]

export interface FirstCreationEntryDraft {
  catalogKey: string
  text?: string | null
}

export class FirstCreationEntryInvalid extends DomainError {
  constructor(
    public readonly index: number,
    public readonly detail: 'UNKNOWN_KEY' | 'TEXT_MISSING' | 'TEXT_ON_CHECK' | 'TOO_LONG',
  ) {
    super(`FIRST_CREATION_ENTRY_INVALID at ${index}: ${detail}`)
  }
}

export const isCheckKey = (key: string): key is FirstCreationCheckKey =>
  (FIRST_CREATION_CHECK_KEYS as readonly string[]).includes(key)

export const isCatalogKey = (key: string): key is FirstCreationCatalogKey =>
  (FIRST_CREATION_CATALOG_KEYS as readonly string[]).includes(key)

/**
 * The finished sentence, in the member's language, from key plus free text. Built here
 * and not in the client: the stem always comes from the locale file for the key, and the
 * client's part is the free text behind it, as typed — spelling is neither corrected nor
 * mentioned (D §7.3).
 */
export function buildFirstCreationMemo(
  entry: FirstCreationEntryDraft,
  language: string,
  index: number,
): Result<string, FirstCreationEntryInvalid> {
  const text = entry.text?.trim() ?? ''
  if (isCheckKey(entry.catalogKey)) {
    if (text.length > 0) {
      return { success: false, error: new FirstCreationEntryInvalid(index, 'TEXT_ON_CHECK') }
    }
    return {
      success: true,
      value: translateForLocale(language, `firstCreation.checks.${entry.catalogKey}`),
    }
  }
  if (!isCatalogKey(entry.catalogKey)) {
    return { success: false, error: new FirstCreationEntryInvalid(index, 'UNKNOWN_KEY') }
  }
  if (text.length === 0) {
    return { success: false, error: new FirstCreationEntryInvalid(index, 'TEXT_MISSING') }
  }
  const memo = translateForLocale(language, `firstCreation.catalog.${entry.catalogKey}`, { text })
  if (memo.length > MEMO_MAX_CHARS) {
    return { success: false, error: new FirstCreationEntryInvalid(index, 'TOO_LONG') }
  }
  return { success: true, value: memo }
}

/**
 * 100 Gradido over n entries, the remainder cent on the first (D §11.6): 100 / 3 becomes
 * 33,34 + 33,33 + 33,33. Integer arithmetic on Gradido cents, never a float; the shares
 * always add up to exactly FIRST_CREATION_TOTAL.
 */
export function splitFirstCreationAmount(entries: number): GradidoUnit[] {
  if (!Number.isInteger(entries) || entries < 1 || entries > FIRST_CREATION_MAX_ENTRIES) {
    throw new Error(`splitFirstCreationAmount: entries must be 1..${FIRST_CREATION_MAX_ENTRIES}`)
  }
  // GradidoUnit counts in ten-thousandths of a Gradido; the split is made in hundredths,
  // so the shares are whole cents as a person reads them (33,34 - not 33,3334).
  const hundredths = FIRST_CREATION_TOTAL.gddCent / GDD4_PER_HUNDREDTH
  const n = BigInt(entries)
  const share = hundredths / n
  const remainder = hundredths - share * n
  return Array.from({ length: entries }, (_, i) =>
    GradidoUnit.fromGradidoCent((i === 0 ? share + remainder : share) * GDD4_PER_HUNDREDTH),
  )
}

/** GradidoUnit's smallest unit is 1/10000 GDD (`amount_gdd4`); a cent is a hundred of them. */
const GDD4_PER_HUNDREDTH = 100n

export interface FirstCreationMessageParts {
  firstName: string | null | undefined
  language: string
  /** One line per catalog entry, in entry order, as the model wrote them. */
  lines: string[]
  /** The ticked sentences, if any; each gets its fixed line, placed last (D §7.2). */
  checks: FirstCreationCheckKey[]
}

/**
 * The greeting, from three locale keys picked by the first-name heuristic that already
 * serves the moderation Crea (ES-004): a known feminine or masculine name gets its form,
 * everything else the neutral one. English has one form for all three. The name is read
 * here and never sent to the model.
 */
export function composeFirstCreationGreeting(
  firstName: string | null | undefined,
  language: string,
): string {
  const name = firstName?.trim() ?? ''
  if (!name) {
    // A blank first name gets the greeting without a name, not "Willkommen, !".
    return translateForLocale(language, 'firstCreation.message.greetingAnonymous')
  }
  const gender = guessGender(name)
  const key =
    gender === 'female' ? 'greetingFemale' : gender === 'male' ? 'greetingMale' : 'greetingNeutral'
  return translateForLocale(language, `firstCreation.message.${key}`, { name })
}

/**
 * The four lines (D §7.2, ES-006): greeting · thanks · the fixed W1 sentence · closing.
 * Only the middle comes from the model. The ticked sentence, when there is one, closes
 * the thanks as the "And for …" line — the one that carries the most; without a tick the
 * entries stand side by side, the way Julia's three did.
 */
export function composeFirstCreationMessage(parts: FirstCreationMessageParts): string {
  const { language } = parts
  const t = (key: string, vars?: Record<string, string>) =>
    translateForLocale(language, `firstCreation.message.${key}`, vars)
  const lines = parts.lines.join(', ')
  const checkLines = parts.checks.map((check) => t(`${check}Line`)).join(', ')
  let thanks: string
  if (parts.lines.length > 0 && parts.checks.length > 0) {
    thanks = t('thanksWithCheck', { lines, checkLine: checkLines })
  } else if (parts.checks.length > 0) {
    thanks = t('thanksOnlyCheck', { checkLine: checkLines })
  } else {
    thanks = t('thanks', { lines })
  }
  return [
    composeFirstCreationGreeting(parts.firstName, language),
    thanks,
    t('w1'),
    t('closing'),
  ].join('\n')
}

/** The neutral note to the member when a human looks first (ES-018/ES-019, G §11.4). */
export function composeFirstCreationReviewMessage(language: string): string {
  return translateForLocale(language, 'firstCreation.message.review')
}

/**
 * The internal note for the moderation when Crea raised its hand (G §11.5). In German,
 * like the moderation Crea itself: its rule set, its reasoning and therefore the `reason`
 * it hands back are German today, and the note is read next to them in the admin.
 */
export function composeFirstCreationInternalNote(reason: string): string {
  return translateForLocale('de', 'firstCreation.message.internalNote', { reason })
}
