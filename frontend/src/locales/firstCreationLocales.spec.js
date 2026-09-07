// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import de from './de.json'
import en from './en.json'
import {
  FIRST_CREATION_CATALOG_KEYS,
  FIRST_CREATION_CATEGORIES,
  FIRST_CREATION_CHECK_KEYS,
  FIRST_CREATION_EXCLUSIVE_CHECKS,
} from '@/utils/firstCreationCatalog'

/**
 * The catalog of the first creation is written down THREE times and nothing in the compiler
 * or the linter holds the three together:
 *
 *   1. `backend/src/data/FirstCreation.logic.ts` — the keys the server accepts. It builds
 *      the sentence that ends up in the ledger and refuses an entry whose key it does not
 *      know (`UNKNOWN_KEY`).
 *   2. `utils/firstCreationCatalog.js` — the same keys, grouped, because the wallet cannot
 *      import from the backend or from `core` (it depends on neither).
 *   3. `locales/de.json` and `en.json` — the texts the window shows before anything is sent.
 *
 * ⛔ The linter cannot help here. Every one of these keys is reached as
 * `firstCreation.catalog.${key}`, so `no-unused-keys` never sees it — the four prefixes are
 * on that rule's ignore list in `.eslintrc.js`, which is exactly why this file has to exist:
 * it took that rule's job for them.
 *
 * ⚠️ What this file can and cannot prove. It holds (2) against (3), so a key without a text
 * and a text without a key both fail here. It CANNOT reach (1): `core` is not a dependency
 * of the wallet, so the copy of the backend list below is typed out, and a key added on one
 * side and not the other would be caught by this test on the frontend side only. That is
 * why the list is here in full rather than derived — a mismatch is meant to be a diff a
 * reader can see, not a computation.
 */

/**
 * `FIRST_CREATION_CATALOG_KEYS` from `backend/src/data/FirstCreation.logic.ts`, copied
 * verbatim and in the backend's own order (measured at d583ec4f8).
 */
const BACKEND_CATALOG_KEYS = [
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
]

/** `FIRST_CREATION_CHECK_KEYS` from the same file, in the backend's own order. */
const BACKEND_CHECK_KEYS = ['retiree', 'child']

/**
 * `FIRST_CREATION_EXCLUSIVE_CHECKS` from the same file — the ticks that cannot both be true
 * of one person.
 *
 * ⚠️ The two sides do different jobs with this list and both have to hold it: here a tick
 * takes the other one's place as it goes on, there a bundle carrying both is handed to a
 * moderator (`CHECK_CONFLICT`). A key that fell out of one copy would leave the window
 * letting a pair through that the server then stops — silently, with the member's hundred
 * waiting on a human.
 */
const BACKEND_EXCLUSIVE_CHECKS = ['retiree', 'child']

const LANGUAGES = { de, en }

describe('first creation catalog', () => {
  it('offers exactly the keys the backend accepts', () => {
    expect([...FIRST_CREATION_CATALOG_KEYS].sort()).toEqual([...BACKEND_CATALOG_KEYS].sort())
    expect([...FIRST_CREATION_CHECK_KEYS].sort()).toEqual([...BACKEND_CHECK_KEYS].sort())
  })

  it('excludes the same pair of ticks the backend does', () => {
    expect([...FIRST_CREATION_EXCLUSIVE_CHECKS].sort()).toEqual(
      [...BACKEND_EXCLUSIVE_CHECKS].sort(),
    )
    // And every one of them is a tick at all — an exclusive key that is not in the check
    // list would be a rule about something the window never shows.
    FIRST_CREATION_EXCLUSIVE_CHECKS.forEach((key) => {
      expect(FIRST_CREATION_CHECK_KEYS).toContain(key)
    })
  })

  it('puts every stem in exactly one category', () => {
    // A stem in two categories would show up twice in the window; a stem in none would be
    // unreachable while the backend still counts it as part of the catalog.
    expect(FIRST_CREATION_CATALOG_KEYS).toHaveLength(BACKEND_CATALOG_KEYS.length)
    expect(new Set(FIRST_CREATION_CATALOG_KEYS).size).toBe(BACKEND_CATALOG_KEYS.length)
  })

  it('gives every category at least one stem', () => {
    // An empty category renders a heading with nothing under it.
    FIRST_CREATION_CATEGORIES.forEach((category) => {
      expect(category.stems.length).toBeGreaterThan(0)
    })
  })
})

describe.each(Object.entries(LANGUAGES))('first creation texts in %s', (language, messages) => {
  const block = messages.firstCreation

  it('has the block at all', () => {
    expect(block).toBeTypeOf('object')
  })

  it('has a sentence stem for every catalog key, and no stray ones', () => {
    expect(Object.keys(block.catalog).sort()).toEqual([...BACKEND_CATALOG_KEYS].sort())
    Object.entries(block.catalog).forEach(([key, text]) => {
      expect(text, `${language}.firstCreation.catalog.${key}`).toBeTruthy()
      // ⛔ The stem is only the FIRST half. The connector ("indem ich", "by") is a separate
      // key because the window puts the member's own words behind it, and the placeholder
      // form belongs to the backend copy in `core` — a `{text}` here would reach the screen
      // as those seven characters.
      expect(text, `${language}.firstCreation.catalog.${key}`).not.toContain('{text}')
    })
  })

  it('has a tick sentence and a hint for every check key', () => {
    expect(Object.keys(block.checks).sort()).toEqual([...BACKEND_CHECK_KEYS].sort())
    BACKEND_CHECK_KEYS.forEach((key) => {
      expect(block.checks[key], `${language}.firstCreation.checks.${key}`).toBeTruthy()
      expect(block.checkHints[key], `${language}.firstCreation.checkHints.${key}`).toBeTruthy()
    })
  })

  it('has a heading for every category, and no stray ones', () => {
    const used = FIRST_CREATION_CATEGORIES.map((category) => category.key)
    expect(Object.keys(block.categories).sort()).toEqual([...used].sort())
    used.forEach((key) => {
      expect(block.categories[key], `${language}.firstCreation.categories.${key}`).toBeTruthy()
    })
  })

  it('has every text the window asks for by a literal key', () => {
    // The window would show the bare key path where one of these is missing.
    const literal = [
      'welcome',
      'welcomeAnonymous',
      'intro',
      'question',
      'subtitle',
      'connector',
      'showMore',
      'showLess',
      'placeholder',
      'again',
      'remove',
      'entries',
      'maxEntries',
      'tooShort',
      'failed',
      'nothing',
      'waiting',
      'waitingHint',
      'review',
      'confirmedFor',
      'alsoFound',
      'unbooked',
      'balance',
      'whyHundredTitle',
      'whyHundred',
      'whyMore',
      'whyMoreLink',
      'whyConfirmed',
      'thankSomeone',
      'toAccount',
    ]
    literal.forEach((key) => {
      expect(block[key], `${language}.firstCreation.${key}`).toBeTruthy()
    })
  })

  it('keeps the placeholders the window fills in', () => {
    expect(block.showMore).toContain('{count}')
    expect(block.maxEntries).toContain('{max}')
    // The sentence is put together by `i18n-t`; without the slot the linked word would
    // have nowhere to stand and the sentence would end at "findest Du".
    expect(block.whyMore).toContain('{link}')
    expect(block.confirmedFor).toContain('{community}')
    expect(block.welcome).toContain('{name}')
    // ⚠️ And the nameless form must NOT carry it -- an account without a first name would
    // otherwise be greeted with "Willkommen, {name}!" spelled out.
    expect(block.welcomeAnonymous).not.toContain('{name}')
    // `$t(key, count)` picks the form; `{n}` is what the count is bound to.
    expect(block.entries).toContain('|')
    expect(block.entries).toContain('{n}')
  })
})
