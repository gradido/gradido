// AI-GENERATED — not an architecture reference
import { hasPhraseInLocale, translateForLocale } from 'core'
import { DomainError, GradidoUnit, MEMO_MAX_CHARS, MEMO_MIN_CHARS, Result } from 'shared'
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
 * The sentence stems a member can complete (D §4, J §4). The list is flat: how the window
 * groups them is the window's business.
 *
 * ⚠️ Where the stems LIVE moved with the editable box. The wallet has its own copy
 * (`utils/firstCreationCatalog.js` plus `locales/*.json`) and puts one into the box as the
 * opening; core's copy no longer builds anything — `hasFirstCreationCatalog` below is the
 * only thing that still reads it, as the answer to "does this language have a catalog at
 * all". Its `{text}` placeholder is therefore no longer filled anywhere; it marks a phrase
 * as a completable stem and nothing more.
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
export const FIRST_CREATION_CHECK_KEYS = ['retiree', 'child'] as const

export type FirstCreationCatalogKey = (typeof FIRST_CREATION_CATALOG_KEYS)[number]

/**
 * Whether the member's language has the sentence stems — asked of core, because core is
 * the copy both packages can be measured against. A language without them gets no window
 * rather than a box that opens in English under a German heading. de and en today; the
 * others follow through the localisation work, not through a fallback.
 */
export function hasFirstCreationCatalog(language: string): boolean {
  return FIRST_CREATION_CATALOG_KEYS.every((key) =>
    hasPhraseInLocale(language, `firstCreation.catalog.${key}`),
  )
}

/**
 * The member's calendar day, as the wallet's own form sends it (ISO date without a time).
 * The month bookkeeping in creations.ts indexes months in the CLIENT's frame; a server
 * instant would name a different month for the first hours of every month west of UTC.
 */
export function firstCreationContributionDate(clientTimezoneOffset: number): string {
  return new Date(Date.now() - clientTimezoneOffset * 60 * 1000).toISOString().slice(0, 10)
}
export type FirstCreationCheckKey = (typeof FIRST_CREATION_CHECK_KEYS)[number]

export interface FirstCreationEntryDraft {
  catalogKey: string
  text?: string | null
}

export class FirstCreationEntryInvalid extends DomainError {
  constructor(
    public readonly index: number,
    public readonly detail:
      | 'UNKNOWN_KEY'
      | 'TEXT_MISSING'
      | 'TEXT_ON_CHECK'
      | 'TOO_SHORT'
      | 'TOO_LONG',
  ) {
    super(`FIRST_CREATION_ENTRY_INVALID at ${index}: ${detail}`)
  }
}

export const isCheckKey = (key: string): key is FirstCreationCheckKey =>
  (FIRST_CREATION_CHECK_KEYS as readonly string[]).includes(key)

export const isCatalogKey = (key: string): key is FirstCreationCatalogKey =>
  (FIRST_CREATION_CATALOG_KEYS as readonly string[]).includes(key)

/**
 * The sentence that goes into the ledger.
 *
 * ⛔ For a CATALOG entry this is now the member's own sentence, verbatim (Bernd, 06.09.).
 * The stem used to be glued on here from the locale file, with only the tail coming from
 * the client — and that forced everybody into one grammar: whoever opened "Ich habe einem
 * kranken Menschen geholfen" could not write "Ich habe meinem kranken Bruder
 * Vitamin-Tabletten gekauft". The wallet now puts the opening INTO the box as an editable
 * value and sends whatever stands there.
 *
 * What that costs, plainly: the server no longer guarantees the sentence begins with a
 * stem it knows. Measured against the house, that is not a step down — `createContribution`
 * has always taken a completely free memo, and the first creation was the stricter one. The
 * key still travels and is still checked, because it tells a tick from a written entry.
 *
 * Spelling is neither corrected nor mentioned (D §7.3).
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
  // A floor on the LEDGER TEXT, and only that: a memo has to be a memo, not "ja".
  //
  // ⛔ It is NOT the wallet's floor made safe, and an earlier version of this comment said
  // it was. The wallet asks for a few words OF THE MEMBER'S OWN, measured against the
  // opening it put in the box — and the server cannot repeat that measurement honestly: it
  // is handed one sentence, with no way to tell a completed opening from one thrown away
  // and rewritten, and reconstructing the opening here would tie the two locale copies back
  // together in a way that fails silently when they drift. So a completed opening clears
  // this floor by its stem, and that is what it is: an effort floor lives in the window, a
  // sanity floor lives here, and the moderation (ES-018) is what stands behind both.
  if (text.length < MEMO_MIN_CHARS) {
    return { success: false, error: new FirstCreationEntryInvalid(index, 'TOO_SHORT') }
  }
  if (text.length > MEMO_MAX_CHARS) {
    return { success: false, error: new FirstCreationEntryInvalid(index, 'TOO_LONG') }
  }
  return { success: true, value: text }
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
