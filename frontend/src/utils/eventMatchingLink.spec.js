// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  EVENT_MATCHING_DETAILS_MAX_CHARS,
  EVENT_MATCHING_ENTRY_KEPT_MS,
  EVENT_MATCHING_SUMMARY_MAX_CHARS,
  eventMatchingEntryToKeep,
  keptEventMatchingEntry,
  readEventMatchingLink,
} from './eventMatchingLink'

// What vue-router makes of an address: the query of a route.
const queryOf = (search) => {
  const query = {}
  for (const [key, value] of new URLSearchParams(search)) {
    query[key] = key in query ? [].concat(query[key], value) : value
  }
  return query
}

describe('readEventMatchingLink', () => {
  describe('the two links of the contract', () => {
    it('reads a sentence with details, found from afar', () => {
      const query = queryOf(
        'interest=Kongress%20Frequency%20Healing&details=Die%20lang%20verschwiegenen%20Geheimnisse%20%C3%BCber%20Selbstheilung%2C%20Biohacking%2C%20Longevity&remote=1&v=1',
      )

      expect(readEventMatchingLink(query)).toEqual({
        summary: 'Kongress Frequency Healing',
        details: 'Die lang verschwiegenen Geheimnisse über Selbstheilung, Biohacking, Longevity',
        remote: true,
      })
    })

    it('reads a sentence without details, only where the member lives', () => {
      const query = queryOf('interest=Training%20R%C3%BCcken%20ohne%20Bewegung&remote=0&v=1')

      expect(readEventMatchingLink(query)).toEqual({
        summary: 'Training Rücken ohne Bewegung',
        details: null,
        remote: false,
      })
    })

    it('reads a blank written as a plus, as a form writes it', () => {
      expect(readEventMatchingLink(queryOf('interest=Kongress+Frequency+Healing')).summary).toBe(
        'Kongress Frequency Healing',
      )
    })
  })

  describe('the sentence', () => {
    it.each([
      ['no parameter at all', {}],
      ['an empty one', { interest: '' }],
      ['nothing but blanks', { interest: '   ' }],
      ['one without a value', { interest: null }],
      ['no query', undefined],
    ])('is no event link with %s', (_, query) => {
      expect(readEventMatchingLink(query)).toBeNull()
    })

    it('loses the blanks around it', () => {
      expect(readEventMatchingLink({ interest: '  Kongress X  ' }).summary).toBe('Kongress X')
    })

    it('stands on one line, whatever the address broke it into', () => {
      expect(readEventMatchingLink({ interest: 'Kongress\nFrequency\t\tHealing' }).summary).toBe(
        'Kongress Frequency Healing',
      )
    })

    it('is taken whole at the length an entry holds', () => {
      const sentence = 'k'.repeat(EVENT_MATCHING_SUMMARY_MAX_CHARS)

      expect(readEventMatchingLink({ interest: sentence }).summary).toBe(sentence)
    })

    it('is cut to the length an entry holds', () => {
      const { summary } = readEventMatchingLink({
        interest: 'k'.repeat(EVENT_MATCHING_SUMMARY_MAX_CHARS) + 'too much',
      })

      expect(summary).toBe('k'.repeat(EVENT_MATCHING_SUMMARY_MAX_CHARS))
    })

    it('does not end on a blank where the cut falls behind one', () => {
      const { summary } = readEventMatchingLink({
        interest: `${'k'.repeat(EVENT_MATCHING_SUMMARY_MAX_CHARS - 1)} and more`,
      })

      expect(summary).toBe('k'.repeat(EVENT_MATCHING_SUMMARY_MAX_CHARS - 1))
    })

    it('is not cut through the middle of a character that takes two places', () => {
      // The emoji would stand on places 160 and 161.
      const { summary } = readEventMatchingLink({
        interest: `${'k'.repeat(EVENT_MATCHING_SUMMARY_MAX_CHARS - 1)}🌱`,
      })

      expect(summary).toBe('k'.repeat(EVENT_MATCHING_SUMMARY_MAX_CHARS - 1))
    })

    it('keeps a character of two places that still fits', () => {
      const sentence = `${'k'.repeat(EVENT_MATCHING_SUMMARY_MAX_CHARS - 2)}🌱`

      expect(readEventMatchingLink({ interest: `${sentence} and more` }).summary).toBe(sentence)
    })

    it('takes the first where the address names it twice', () => {
      expect(readEventMatchingLink(queryOf('interest=Kongress%20A&interest=Kongress%20B'))).toEqual(
        { summary: 'Kongress A', details: null, remote: true },
      )
    })

    it('stays the text it is: markup, quotes and braces are letters', () => {
      const sentence = '<b>Kongress</b> "X" {name} @:matching | $t'

      expect(readEventMatchingLink({ interest: sentence }).summary).toBe(sentence)
    })
  })

  describe('the details', () => {
    it.each([
      ['a missing parameter', {}],
      ['an empty one', { details: '' }],
      ['nothing but blanks', { details: ' \n ' }],
      ['one without a value', { details: null }],
    ])('are none with %s', (_, rest) => {
      expect(readEventMatchingLink({ interest: 'Kongress X', ...rest }).details).toBeNull()
    })

    it('keep their line breaks', () => {
      expect(
        readEventMatchingLink(queryOf('interest=Kongress%20X&details=Zeile%201%0AZeile%202'))
          .details,
      ).toBe('Zeile 1\nZeile 2')
    })

    it('are taken whole at the length an entry holds', () => {
      const text = 'd'.repeat(EVENT_MATCHING_DETAILS_MAX_CHARS)

      expect(readEventMatchingLink({ interest: 'Kongress X', details: text }).details).toBe(text)
    })

    it('are cut to the length an entry holds', () => {
      const { details } = readEventMatchingLink({
        interest: 'Kongress X',
        details: 'd'.repeat(EVENT_MATCHING_DETAILS_MAX_CHARS + 500),
      })

      expect(details).toBe('d'.repeat(EVENT_MATCHING_DETAILS_MAX_CHARS))
    })
  })

  describe('found from afar', () => {
    it.each([
      ['a missing parameter', {}, true],
      ['1', { remote: '1' }, true],
      ['0', { remote: '0' }, false],
      ['anything else', { remote: 'abc' }, true],
      ['an empty one', { remote: '' }, true],
      ['one without a value', { remote: null }, true],
      ['false, which is not 0', { remote: 'false' }, true],
    ])('with %s', (_, rest, remote) => {
      expect(readEventMatchingLink({ interest: 'Kongress X', ...rest }).remote).toBe(remote)
    })

    it('takes the first where the address names it twice', () => {
      expect(readEventMatchingLink(queryOf('interest=Kongress%20X&remote=0&remote=1')).remote).toBe(
        false,
      )
    })
  })

  describe('what is not known', () => {
    it('is passed over: another version, a referrer, a page to go on to', () => {
      const query = queryOf(
        'interest=Kongress%20X&v=7&referrer=somebody&redirect=https%3A%2F%2Felsewhere.example&type=offer',
      )

      expect(readEventMatchingLink(query)).toEqual({
        summary: 'Kongress X',
        details: null,
        remote: true,
      })
    })
  })
})

/**
 * What a link offered somebody who was not signed in is kept for the sign-in that follows, and
 * nobody is there yet whose it could be. So it has an end: an hour.
 */
describe('the entry the store keeps for a visitor who is not signed in', () => {
  const ENTRY = { summary: 'Kongress X', details: 'Zwei Zeilen', remote: false }
  const NOON = Date.UTC(2026, 9, 13, 12, 0, 0)
  const MINUTE = 60 * 1000

  it('is kept for an hour', () => {
    expect(EVENT_MATCHING_ENTRY_KEPT_MS).toBe(60 * MINUTE)
  })

  it('is written with the moment it was kept', () => {
    expect(eventMatchingEntryToKeep(ENTRY, NOON)).toEqual({ ...ENTRY, keptAt: NOON })
  })

  it('takes the device’s clock where no moment is given', () => {
    const before = Date.now()
    const { keptAt } = eventMatchingEntryToKeep(ENTRY)

    expect(keptAt).toBeGreaterThanOrEqual(before)
    expect(keptAt).toBeLessThanOrEqual(Date.now())
  })

  it('counts at once, and for the whole hour', () => {
    const kept = eventMatchingEntryToKeep(ENTRY, NOON)

    expect(keptEventMatchingEntry(kept, NOON)).toEqual(ENTRY)
    expect(keptEventMatchingEntry(kept, NOON + 59 * MINUTE)).toEqual(ENTRY)
    expect(keptEventMatchingEntry(kept, NOON + EVENT_MATCHING_ENTRY_KEPT_MS - 1)).toEqual(ENTRY)
  })

  it('counts no longer once the hour is over', () => {
    const kept = eventMatchingEntryToKeep(ENTRY, NOON)

    expect(keptEventMatchingEntry(kept, NOON + EVENT_MATCHING_ENTRY_KEPT_MS)).toBeNull()
    expect(keptEventMatchingEntry(kept, NOON + 14 * 24 * 60 * MINUTE)).toBeNull()
  })

  // A clock that was set back says nothing about how old the entry is.
  it('does not count where it was kept after "now"', () => {
    const kept = eventMatchingEntryToKeep(ENTRY, NOON)

    expect(keptEventMatchingEntry(kept, NOON - 1)).toBeNull()
  })

  it('is handed on without the moment: the entry as the link said it', () => {
    const kept = eventMatchingEntryToKeep(
      { summary: 'Kongress X', details: null, remote: true },
      NOON,
    )

    expect(keptEventMatchingEntry(kept, NOON)).toEqual({
      summary: 'Kongress X',
      details: null,
      remote: true,
    })
  })

  it.each([[null], [undefined], [{ summary: 'Kongress X', details: null, remote: true }]])(
    'is nothing where the store holds %j -- nothing, or an entry without its moment',
    (kept) => {
      expect(keptEventMatchingEntry(kept, NOON)).toBeNull()
    },
  )

  it('takes the device’s clock where no "now" is given', () => {
    expect(keptEventMatchingEntry(eventMatchingEntryToKeep(ENTRY))).toEqual(ENTRY)
    expect(
      keptEventMatchingEntry(eventMatchingEntryToKeep(ENTRY, Date.now() - 61 * MINUTE)),
    ).toBeNull()
  })
})

// The two lengths exist a second time, each where the wallet cannot import it from.
describe('the lengths an entry holds, here and where they are set', () => {
  const here = dirname(fileURLToPath(import.meta.url))

  it('is the length of the sentence the form takes', () => {
    const form = readFileSync(join(here, '..', 'pages', 'Matching.vue'), 'utf8')
    const [, field] = form.match(/v-model="newSummary"[^>]*?maxlength="(\d+)"/s) ?? []

    // The fixture has to prove itself: no match would compare a number with nothing.
    expect(field).toBeDefined()
    expect(EVENT_MATCHING_SUMMARY_MAX_CHARS).toBe(Number(field))
  })

  it('is the length of the details the server takes', () => {
    // Read as text, not imported: shared/src/const/index.ts loads a native binding.
    const shared = readFileSync(
      join(here, '..', '..', '..', 'shared', 'src', 'const', 'index.ts'),
      'utf8',
    )
    const [, chars] = shared.match(/^export const MATCHING_ENTRY_DETAILS_MAX_CHARS = (\d+)$/m) ?? []

    expect(chars).toBeDefined()
    expect(EVENT_MATCHING_DETAILS_MAX_CHARS).toBe(Number(chars))
  })
})
