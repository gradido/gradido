// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FIRST_ANSWER_PATIENCE_MS } from '@/composables/useMapMemberCount'
import { listMatchingEntries } from '@/graphql/queries'
import { ENTRIES_TO_ARRIVE } from '@/utils/newMatchingEntry'
import { rememberOwnMatchingEntries, useOwnMatchingEntries } from './useOwnMatchingEntries'

// Mutable, so a case can switch matching off.
const config = vi.hoisted(() => ({ MATCHING_ACTIVE: true }))
vi.mock('@/config', () => ({ default: config }))

// What the overview asked, and the two ways an answer can come back.
const asked = vi.hoisted(() => [])
vi.mock('@vue/apollo-composable', () => ({
  useQuery: (document, variables, options) => {
    const question = { document, variables, options, result: null, error: null }
    asked.push(question)
    return {
      onResult: (callback) => {
        question.result = callback
      },
      onError: (callback) => {
        question.error = callback
      },
    }
  },
}))

const HOME = { latitude: 49.28, longitude: 9.69 }
const ON_THE_MAP = { gradidoID: 'a-member', gmsAllowed: true, userLocation: HOME }
const NOT_ON_THE_MAP = { gradidoID: 'a-member', gmsAllowed: false, userLocation: null }
// What signing out leaves in the store while the page still stands.
const SIGNED_OUT = { gradidoID: null, gmsAllowed: null, userLocation: null }

// Written out, not built from the module: a key that changed its name would forget what
// every device has heard, and nothing else would notice.
const KEY = 'own-matching-entries:a-member'
const KEY_OF_ANOTHER = 'own-matching-entries:somebody-else'

let wrapper = null
let store = null

// The composable as the overview uses it: in a component's setup, with a store.
const open = (state = ON_THE_MAP) => {
  let held
  store = createStore({
    state: () => ({ ...state }),
    mutations: {
      gradidoID: (s, value) => {
        s.gradidoID = value
      },
    },
  })
  wrapper = mount(
    {
      setup() {
        held = useOwnMatchingEntries()
        return () => null
      },
    },
    { global: { plugins: [store] } },
  )
  return held
}

// A list the way the server sends it; the composable only counts it.
const list = (length) =>
  Array.from({ length }, (_, index) => ({ uuid: `entry-${index}`, summary: 'a sentence' }))
const answer = (length) => asked.at(-1).result({ data: { listMatchingEntries: list(length) } })
const remembered = (key = KEY) => window.localStorage.getItem(key)
const rememberedBefore = (raw, key = KEY) => window.localStorage.setItem(key, raw)

beforeEach(() => {
  vi.useFakeTimers()
  asked.length = 0
  config.MATCHING_ACTIVE = true
  window.localStorage.clear()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useOwnMatchingEntries', () => {
  describe('for a member the question is not for', () => {
    // They are invited onto the map first; what they have entered does not matter yet.
    it('asks nothing and holds nothing back when they are not on the map', () => {
      const { settled, entries } = open(NOT_ON_THE_MAP)

      expect(settled.value).toBe(true)
      expect(entries.value).toBeNull()
      expect(asked).toHaveLength(0)
    })

    it('does not even look at what the device remembers about them', () => {
      rememberedBefore('2')

      const { entries } = open(NOT_ON_THE_MAP)

      expect(entries.value).toBeNull()
    })

    it('asks nothing where matching is switched off', () => {
      config.MATCHING_ACTIVE = false

      const { settled } = open(ON_THE_MAP)

      expect(settled.value).toBe(true)
      expect(asked).toHaveLength(0)
    })

    // An emptied store has nobody on the map: nobody signed in, nobody asked about.
    it('asks nothing for a store that holds no member', () => {
      const { settled } = open(SIGNED_OUT)

      expect(settled.value).toBe(true)
      expect(asked).toHaveLength(0)
    })

    // A member first: a home and the permission with nobody named are nobody's, and there
    // is nobody to ask the server about.
    it('asks nothing where a home and a permission belong to nobody', () => {
      const { settled, entries } = open({ ...ON_THE_MAP, gradidoID: null })

      expect(settled.value).toBe(true)
      expect(entries.value).toBeNull()
      expect(asked).toHaveLength(0)
    })

    it('stays that way however long they look', () => {
      const { settled, entries } = open(NOT_ON_THE_MAP)

      vi.advanceTimersByTime(FIRST_ANSWER_PATIENCE_MS * 10)

      expect(settled.value).toBe(true)
      expect(entries.value).toBeNull()
      expect(asked).toHaveLength(0)
    })
  })

  describe('on a device that has never heard about this member', () => {
    it('holds the overview back and asks this server, past the cache', () => {
      const { settled, entries } = open()

      expect(settled.value).toBe(false)
      expect(entries.value).toBeNull()
      expect(asked).toHaveLength(1)
      expect(asked[0].document).toBe(listMatchingEntries)
      expect(asked[0].options).toEqual({ fetchPolicy: 'network-only' })
    })

    it.each([0, 1, 2])(
      'lets go with %i the moment the answer is in, and remembers it',
      (length) => {
        const { settled, entries } = open()

        answer(length)

        expect(settled.value).toBe(true)
        expect(entries.value).toBe(length)
        expect(remembered()).toBe(String(length))
      },
    )

    // The device keeps no more than the tile asks: none, one, two -- or arrived.
    it.each([3, 4, 12, 500])('counts %i entries no further than "arrived"', (length) => {
      const { entries } = open()

      answer(length)

      expect(entries.value).toBe(ENTRIES_TO_ARRIVE)
      expect(remembered()).toBe(String(ENTRIES_TO_ARRIVE))
      expect(ENTRIES_TO_ARRIVE).toBe(3)
    })

    // Should the library ever report without data: that is not an answer, and not "none".
    it.each([
      ['no data at all', undefined],
      ['data without the list', {}],
      ['nothing under the name', { listMatchingEntries: null }],
      ['a text under the name', { listMatchingEntries: 'two' }],
      ['a number under the name', { listMatchingEntries: 2 }],
    ])('goes on waiting through a report with %s', (_name, data) => {
      const { settled, entries } = open()

      asked[0].result({ data, loading: true })

      expect(settled.value).toBe(false)
      expect(entries.value).toBeNull()
      expect(remembered()).toBeNull()
    })

    it('waits no longer than the patience the overview has for its other question', () => {
      const { settled, entries } = open()

      vi.advanceTimersByTime(FIRST_ANSWER_PATIENCE_MS - 1)
      expect(settled.value).toBe(false)

      vi.advanceTimersByTime(1)
      expect(settled.value).toBe(true)
      // Not known is not "none": the tile stays away for this visit.
      expect(entries.value).toBeNull()
    })

    // ⛔ The reason the whole thing exists: the three shapes of the tile have three heights.
    it('does not change what the tile is when the answer comes after the patience', () => {
      const { settled, entries } = open()
      vi.advanceTimersByTime(FIRST_ANSWER_PATIENCE_MS)
      expect(settled.value).toBe(true)

      answer(0)

      expect(entries.value).toBeNull()
      // For the next visit, though.
      expect(remembered()).toBe('0')
    })

    it('lets go at once when no answer will come, and remembers nothing', () => {
      const { settled, entries } = open()

      asked[0].error(new Error('Failed to fetch'))

      expect(settled.value).toBe(true)
      expect(entries.value).toBeNull()
      // No answer is not "none": the next visit asks, and waits, again.
      expect(remembered()).toBeNull()
    })

    it('does not take a late answer after a failure either', () => {
      const { entries } = open()
      asked[0].error(new Error('Failed to fetch'))

      answer(1)

      expect(entries.value).toBeNull()
    })

    // Left on the way to another page before the answer or the patience: nothing fires
    // into an overview that is gone.
    it('takes its timer along when the overview goes', () => {
      const { settled } = open()

      wrapper.unmount()
      wrapper = null
      vi.advanceTimersByTime(FIRST_ANSWER_PATIENCE_MS * 2)

      expect(settled.value).toBe(false)
    })
  })

  describe('on a device that has heard about this member before', () => {
    it.each([0, 1, 2])('says %i at once, and asks again in the background', (heard) => {
      rememberedBefore(String(heard))

      const { settled, entries } = open()

      expect(settled.value).toBe(true)
      expect(entries.value).toBe(heard)
      expect(asked).toHaveLength(1)
    })

    // Entries made on another device, or deleted there: the tile changes with the next
    // visit, not under a finger.
    it('keeps saying it for this visit when the new answer differs', () => {
      rememberedBefore('0')
      const { entries } = open()

      answer(2)

      expect(entries.value).toBe(0)
      expect(remembered()).toBe('2')
    })

    it('is what the server said on the visit after', () => {
      rememberedBefore('0')
      const first = open()
      answer(1)
      expect(first.entries.value).toBe(0)
      wrapper.unmount()

      const second = open()

      expect(second.settled.value).toBe(true)
      expect(second.entries.value).toBe(1)
    })

    it('keeps what it heard through a visit without an answer', () => {
      rememberedBefore('1')
      open()

      asked[0].error(new Error('Failed to fetch'))

      expect(remembered()).toBe('1')
    })

    // The tile has nothing left to say, so there is nothing to ask the server on every
    // visit to the overview either.
    it('asks nothing for a member who has arrived', () => {
      rememberedBefore(String(ENTRIES_TO_ARRIVE))

      const { settled, entries } = open()

      expect(settled.value).toBe(true)
      expect(entries.value).toBe(ENTRIES_TO_ARRIVE)
      expect(asked).toHaveLength(0)
    })

    it('holds nothing back for them however long they look', () => {
      rememberedBefore(String(ENTRIES_TO_ARRIVE))
      const { settled, entries } = open()

      vi.advanceTimersByTime(FIRST_ANSWER_PATIENCE_MS * 10)

      expect(settled.value).toBe(true)
      expect(entries.value).toBe(ENTRIES_TO_ARRIVE)
    })
  })

  // ⛔ One member's own, so one key per member: on a shared device the next one would
  // otherwise be told about the previous one's entries.
  describe('for the next member on this device', () => {
    it('has heard nothing, whatever the device remembers about the one before', () => {
      rememberedBefore('2')

      const { settled, entries } = open({ ...ON_THE_MAP, gradidoID: 'somebody-else' })

      expect(settled.value).toBe(false)
      expect(entries.value).toBeNull()
    })

    it('remembers under their own name and leaves the other one alone', () => {
      rememberedBefore('2')
      open({ ...ON_THE_MAP, gradidoID: 'somebody-else' })

      answer(0)

      expect(remembered(KEY_OF_ANOTHER)).toBe('0')
      expect(remembered()).toBe('2')
    })
  })

  // Signing out empties the store while the overview still stands. An answer on its way
  // then is still the asking member's, and nobody else's.
  describe('when the answer arrives after the member is gone from the store', () => {
    it('remembers it for the member who asked', () => {
      open()

      store.commit('gradidoID', null)
      answer(1)

      expect(remembered()).toBe('1')
      expect(window.localStorage.length).toBe(1)
    })

    it('never files it under whoever is named by then', () => {
      open()

      store.commit('gradidoID', 'somebody-else')
      answer(1)

      expect(remembered()).toBe('1')
      expect(remembered(KEY_OF_ANOTHER)).toBeNull()
    })
  })

  describe('what the device holds', () => {
    it.each([
      ['not a number at all', 'abc'],
      ['a text in quotes', '"2"'],
      ['a negative number', '-1'],
      ['half an entry', '1.5'],
      ['an object', '{"entries":2}'],
      ['nothing', ''],
      // "No number" is an answer for the people on the map, never for one's own entries.
      ['the word for no answer', 'null'],
    ])('counts %s as never having heard', (_name, raw) => {
      rememberedBefore(raw)

      const { settled, entries } = open()

      expect(settled.value).toBe(false)
      expect(entries.value).toBeNull()
      expect(asked).toHaveLength(1)
    })

    // Nothing writes more than "arrived" today. Should the threshold ever sink, what an
    // older wallet wrote still reads as what it means.
    it('reads a number beyond "arrived" as arrived', () => {
      rememberedBefore('7')

      const { settled, entries } = open()

      expect(settled.value).toBe(true)
      expect(entries.value).toBe(ENTRIES_TO_ARRIVE)
      expect(asked).toHaveLength(0)
    })

    it('still works where the storage cannot be read', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError')
      })

      const { settled, entries } = open()
      expect(settled.value).toBe(false)

      answer(1)

      expect(settled.value).toBe(true)
      expect(entries.value).toBe(1)
    })

    it('still works where the storage cannot be written', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      const { settled, entries } = open()

      answer(0)

      expect(settled.value).toBe(true)
      expect(entries.value).toBe(0)
    })
  })

  /**
   * The matching page tells the device with every list it loads -- it is where entries are
   * made and deleted, so the overview is right the moment the member comes back from there.
   */
  describe('rememberOwnMatchingEntries', () => {
    it.each([0, 1, 2])('tells the device about %i entries, under the member', (count) => {
      rememberOwnMatchingEntries('a-member', count)

      expect(remembered()).toBe(String(count))
    })

    it.each([3, 4, 250])('counts %i no further than "arrived"', (count) => {
      rememberOwnMatchingEntries('a-member', count)

      expect(remembered()).toBe(String(ENTRIES_TO_ARRIVE))
    })

    it('is what the overview says at once on the next visit', () => {
      rememberOwnMatchingEntries('a-member', 1)

      const { settled, entries } = open()

      expect(settled.value).toBe(true)
      expect(entries.value).toBe(1)
    })

    // The page stands for a moment with an emptied store when the member signs out on it.
    it.each([null, undefined, ''])('says nothing without a member to say it about (%p)', (id) => {
      rememberOwnMatchingEntries(id, 2)

      expect(window.localStorage.length).toBe(0)
    })

    it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, '2', null, undefined])(
      'says nothing for %p, which is not a number of entries',
      (count) => {
        rememberedBefore('1')

        rememberOwnMatchingEntries('a-member', count)

        expect(remembered()).toBe('1')
      },
    )

    it('does not fall over where the storage refuses', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      expect(() => rememberOwnMatchingEntries('a-member', 1)).not.toThrow()
    })
  })
})
