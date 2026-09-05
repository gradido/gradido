// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { GradidoUnit } from 'shared'
import {
  buildFirstCreationMemo,
  composeFirstCreationGreeting,
  composeFirstCreationInternalNote,
  composeFirstCreationMessage,
  composeFirstCreationReviewMessage,
  FIRST_CREATION_CATALOG_KEYS,
  FIRST_CREATION_CHECK_KEYS,
  FIRST_CREATION_MAX_ENTRIES,
  FIRST_CREATION_TOTAL,
  splitFirstCreationAmount,
} from './FirstCreation.logic'

// The locale files of core, read as files: what is under test is that every key the code
// names exists in BOTH languages the first creation ships in, and a mocked translator
// could not tell.
const coreLocale = (lang: string) =>
  JSON.parse(
    readFileSync(
      join(__dirname, '..', '..', '..', 'core', 'src', 'locales', `${lang}.json`),
      'utf8',
    ),
  ) as { firstCreation: Record<string, Record<string, string>> }

describe('first creation catalog keys', () => {
  it.each(['de', 'en'])('names only phrases that exist in %s, and all of them', (lang) => {
    const { catalog, checks, message } = coreLocale(lang).firstCreation
    expect([...FIRST_CREATION_CATALOG_KEYS].sort()).toEqual(Object.keys(catalog).sort())
    expect([...FIRST_CREATION_CHECK_KEYS].sort()).toEqual(Object.keys(checks).sort())
    for (const check of FIRST_CREATION_CHECK_KEYS) {
      expect(message[`${check}Line`]).toBeDefined()
    }
    for (const key of FIRST_CREATION_CATALOG_KEYS) {
      expect(catalog[key]).toContain('{text}')
    }
  })
})

describe('buildFirstCreationMemo', () => {
  it('puts the member’s text into the stem of their language, untouched', () => {
    const memo = buildFirstCreationMemo(
      { catalogKey: 'helpedParish', text: '  Kuchen fürs Gemeindefest gebacken habe ' },
      'de',
      0,
    )
    expect(memo).toEqual({
      success: true,
      value:
        'Ich habe in meiner Gemeinde oder Kirchengemeinde mitgeholfen, indem ich Kuchen fürs Gemeindefest gebacken habe',
    })
    // Spelling is neither corrected nor mentioned (D §7.3).
    const helena = buildFirstCreationMemo(
      {
        catalogKey: 'sharedKnowledge',
        text: 'oMa emmA gezeigt habe, wie man die kaRte gröSSer macht',
      },
      'de',
      0,
    )
    expect(helena.success && helena.value).toContain('oMa emmA gezeigt habe')
  })

  it('uses the English stem for an English member', () => {
    const memo = buildFirstCreationMemo(
      { catalogKey: 'helpedAtHome', text: 'carrying the pizza boxes' },
      'en',
      0,
    )
    expect(memo).toEqual({ success: true, value: 'I helped at home by carrying the pizza boxes' })
  })

  it('takes the fixed sentence for a tick and refuses text on it', () => {
    expect(buildFirstCreationMemo({ catalogKey: 'retiree' }, 'de', 0)).toEqual({
      success: true,
      value: 'Ich bin Rentnerin / Rentner.',
    })
    const withText = buildFirstCreationMemo({ catalogKey: 'retiree', text: 'seit 2010' }, 'de', 2)
    expect(withText.success).toBe(false)
    if (!withText.success) {
      expect(withText.error).toMatchObject({ index: 2, detail: 'TEXT_ON_CHECK' })
    }
  })

  it('refuses an unknown key, a missing text and a text that overflows the memo column', () => {
    const unknown = buildFirstCreationMemo({ catalogKey: 'somethingElse', text: 'x' }, 'de', 1)
    expect(!unknown.success && unknown.error.detail).toBe('UNKNOWN_KEY')
    const missing = buildFirstCreationMemo({ catalogKey: 'helpedAtHome', text: '   ' }, 'de', 1)
    expect(!missing.success && missing.error.detail).toBe('TEXT_MISSING')
    const long = buildFirstCreationMemo(
      { catalogKey: 'helpedAtHome', text: 'x'.repeat(600) },
      'de',
      1,
    )
    expect(!long.success && long.error.detail).toBe('TOO_LONG')
  })
})

describe('splitFirstCreationAmount', () => {
  it.each([1, 2, 3, 4, 7, FIRST_CREATION_MAX_ENTRIES])(
    'splits 100 GDD over %i entries so that the shares add up exactly',
    (n) => {
      const shares = splitFirstCreationAmount(n)
      expect(shares).toHaveLength(n)
      const sum = shares.reduce((acc, share) => acc.add(share), new GradidoUnit(0n))
      expect(sum.comparedTo(FIRST_CREATION_TOTAL)).toBe(0n)
      // The remainder sits on the first share only; all others are equal.
      for (const share of shares.slice(1)) {
        expect(share.comparedTo(shares[1]).toString()).toBe('0')
      }
      expect(shares[0].comparedTo(shares[n - 1]) >= 0n).toBe(true)
    },
  )

  it('gives 33,34 + 33,33 + 33,33 for three and 14,32 + 6 × 14,28 for seven, in whole cents', () => {
    // Compared in the unit's own ten-thousandths: 333400n is 33,34 GDD.
    expect(splitFirstCreationAmount(3).map((s) => s.gddCent)).toEqual([333400n, 333300n, 333300n])
    expect(splitFirstCreationAmount(7).map((s) => s.gddCent)).toEqual([
      143200n,
      142800n,
      142800n,
      142800n,
      142800n,
      142800n,
      142800n,
    ])
    // No share ever carries a fraction of a cent.
    for (const share of splitFirstCreationAmount(FIRST_CREATION_MAX_ENTRIES)) {
      expect(share.gddCent % 100n).toBe(0n)
    }
  })

  it('refuses zero and more than the maximum as a programmer error', () => {
    expect(() => splitFirstCreationAmount(0)).toThrow()
    expect(() => splitFirstCreationAmount(FIRST_CREATION_MAX_ENTRIES + 1)).toThrow()
  })
})

describe('the four-line message', () => {
  it('greets by the first-name heuristic, feminine, masculine and neutral', () => {
    expect(composeFirstCreationGreeting('Emma', 'de')).toBe('Liebe Emma, willkommen!')
    expect(composeFirstCreationGreeting('Gustav', 'de')).toBe('Lieber Gustav, willkommen!')
    expect(composeFirstCreationGreeting('Xqzy', 'de')).toBe('Willkommen, Xqzy!')
    expect(composeFirstCreationGreeting('Emma', 'en')).toBe('Dear Emma, welcome!')
  })

  it('greets without a name when there is none, instead of "Willkommen, !"', () => {
    expect(composeFirstCreationGreeting(null, 'de')).toBe('Willkommen!')
    expect(composeFirstCreationGreeting('   ', 'de')).toBe('Willkommen!')
    expect(composeFirstCreationGreeting(undefined, 'en')).toBe('Welcome!')
  })

  it('builds Emma: two lines, the tick as the "Und für" line, W1 and closing fixed', () => {
    const message = composeFirstCreationMessage({
      firstName: 'Emma',
      language: 'de',
      lines: ['für den Kuchen zum Gemeindefest', 'für das Kochen für die Nachbarskinder'],
      checks: ['retiree'],
    })
    expect(message).toBe(
      [
        'Liebe Emma, willkommen!',
        'Die Gemeinschaft dankt Dir — für den Kuchen zum Gemeindefest, für das Kochen für die Nachbarskinder. Und für Dein Lebenswerk: all die Jahre, in denen Du für andere da warst.',
        'Deine ersten 100 Gradido sind Dank für das, was Du längst getan hast.',
        'Schön, dass Du da bist.',
      ].join('\n'),
    )
  })

  it('builds Julia: three lines side by side, no "Und für"', () => {
    const message = composeFirstCreationMessage({
      firstName: 'Julia',
      language: 'de',
      lines: [
        'für die zwölf Gastfamilien',
        'für die Instrumente aus den Kellern',
        'für das Wort Haus',
      ],
      checks: [],
    })
    expect(message.split('\n')[1]).toBe(
      'Die Gemeinschaft dankt Dir — für die zwölf Gastfamilien, für die Instrumente aus den Kellern, für das Wort Haus.',
    )
    expect(message).not.toContain('Und für')
  })

  it('builds the tick-only message without a model line', () => {
    const message = composeFirstCreationMessage({
      firstName: 'Alice',
      language: 'de',
      lines: [],
      checks: ['retiree'],
    })
    expect(message.split('\n')[1]).toBe(
      'Die Gemeinschaft dankt Dir — für Dein Lebenswerk: all die Jahre, in denen Du für andere da warst.',
    )
  })

  it('has the review message and the internal note as fixed phrases', () => {
    expect(composeFirstCreationReviewMessage('de')).toBe(
      'Deine Einträge schaut sich noch ein Mensch an. Du hörst von uns.',
    )
    expect(composeFirstCreationReviewMessage('en')).toBe(
      'A person is still looking at your entries. You will hear from us.',
    )
    // French has no first-creation keys yet: English, not the key.
    expect(composeFirstCreationReviewMessage('fr')).toBe(
      'A person is still looking at your entries. You will hear from us.',
    )
    expect(composeFirstCreationInternalNote('Gewaltverherrlichung in Eintrag 2')).toBe(
      'Crea hat bei der Erst-Schöpfung angehalten: Gewaltverherrlichung in Eintrag 2. Bitte prüfen und von Hand bestätigen, ändern oder ablehnen.',
    )
  })
})
