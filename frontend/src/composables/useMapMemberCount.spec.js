// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { walletStore } from '@test/walletStore'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mapMemberCount } from '@/graphql/queries'
import {
  FIRST_ANSWER_PATIENCE_MS,
  MAP_MEMBER_COUNT_STORAGE_KEY,
  useMapMemberCount,
} from './useMapMemberCount'

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
const NOT_ON_THE_MAP = { gradidoID: 'a-member', gmsAllowed: false, userLocation: null }
const ON_THE_MAP = { gradidoID: 'a-member', gmsAllowed: true, userLocation: HOME }
// What signing out leaves in the store while the page still stands.
const SIGNED_OUT = { gradidoID: null, gmsAllowed: null, userLocation: null }

let wrapper = null

// The composable as the overview uses it: in a component's setup, with a store.
const open = (state = NOT_ON_THE_MAP) => {
  let held
  wrapper = mount(
    {
      setup() {
        held = useMapMemberCount()
        return () => null
      },
    },
    { global: { plugins: [walletStore({ ...state })] } },
  )
  return held
}

const answer = (data) => asked.at(-1).result({ data })
const remembered = () => window.localStorage.getItem(MAP_MEMBER_COUNT_STORAGE_KEY)
const rememberedBefore = (raw) => window.localStorage.setItem(MAP_MEMBER_COUNT_STORAGE_KEY, raw)

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

describe('useMapMemberCount', () => {
  describe('for a member the invitation is not for', () => {
    it('asks nothing and holds nothing back when they are on the map', () => {
      const { settled, count } = open(ON_THE_MAP)

      expect(settled.value).toBe(true)
      expect(count.value).toBeNull()
      expect(asked).toHaveLength(0)
    })

    it('asks nothing where matching is switched off', () => {
      config.MATCHING_ACTIVE = false

      const { settled } = open(NOT_ON_THE_MAP)

      expect(settled.value).toBe(true)
      expect(asked).toHaveLength(0)
    })

    // An emptied store reads like somebody without a home: nobody signed in, nobody asked for.
    it('asks nothing for a store that holds no member', () => {
      const { settled } = open(SIGNED_OUT)

      expect(settled.value).toBe(true)
      expect(asked).toHaveLength(0)
    })

    it('stays that way however long they look', () => {
      const { settled, count } = open(ON_THE_MAP)

      vi.advanceTimersByTime(FIRST_ANSWER_PATIENCE_MS * 10)

      expect(settled.value).toBe(true)
      expect(count.value).toBeNull()
      expect(asked).toHaveLength(0)
    })
  })

  describe('on a device that has never heard an answer', () => {
    it('holds the overview back and asks this server, past the cache', () => {
      const { settled, count } = open()

      expect(settled.value).toBe(false)
      expect(count.value).toBeNull()
      expect(asked).toHaveLength(1)
      expect(asked[0].document).toBe(mapMemberCount)
      expect(asked[0].options).toEqual({ fetchPolicy: 'network-only' })
    })

    it('lets go with the number the moment the answer is in, and remembers it', () => {
      const { settled, count } = open()

      answer({ mapMemberCount: 773 })

      expect(settled.value).toBe(true)
      expect(count.value).toBe(773)
      expect(remembered()).toBe('773')
    })

    it('lets go without a number where the server has none, and remembers that too', () => {
      const { settled, count } = open()

      answer({ mapMemberCount: null })

      expect(settled.value).toBe(true)
      expect(count.value).toBeNull()
      // Asked, and no number: the next visit does not wait for the same answer again.
      expect(remembered()).toBe('null')
    })

    it('takes a map with nobody on it for a number', () => {
      const { count } = open()

      answer({ mapMemberCount: 0 })

      expect(count.value).toBe(0)
      expect(remembered()).toBe('0')
    })

    // Should the library ever report without data: that is not an answer.
    it('goes on waiting through a report without data', () => {
      const { settled } = open()

      asked[0].result({ data: undefined, loading: true })

      expect(settled.value).toBe(false)
      expect(remembered()).toBeNull()
    })

    it('waits no longer than its patience', () => {
      const { settled, count } = open()

      vi.advanceTimersByTime(FIRST_ANSWER_PATIENCE_MS - 1)
      expect(settled.value).toBe(false)

      vi.advanceTimersByTime(1)
      expect(settled.value).toBe(true)
      expect(count.value).toBeNull()
      expect(FIRST_ANSWER_PATIENCE_MS).toBe(300)
    })

    // ⛔ The reason the whole thing exists: with the number the heading is a line taller.
    it('does not change what the tile says when the answer comes after the patience', () => {
      const { settled, count } = open()
      vi.advanceTimersByTime(FIRST_ANSWER_PATIENCE_MS)
      expect(settled.value).toBe(true)

      answer({ mapMemberCount: 773 })

      expect(count.value).toBeNull()
      // For the next visit, though.
      expect(remembered()).toBe('773')
    })

    it('lets go at once when no answer will come, and remembers nothing', () => {
      const { settled, count } = open()

      asked[0].error(new Error('Failed to fetch'))

      expect(settled.value).toBe(true)
      expect(count.value).toBeNull()
      // No answer is not "no number": the next visit asks, and waits, again.
      expect(remembered()).toBeNull()
    })

    it('does not take a late answer after a failure either', () => {
      const { count } = open()
      asked[0].error(new Error('Failed to fetch'))

      answer({ mapMemberCount: 773 })

      expect(count.value).toBeNull()
    })

    it.each([
      ['a text', '773'],
      ['half a member', 12.5],
      ['a negative number', -3],
      ['nothing under the name', undefined],
    ])('takes %s for no number', (_name, value) => {
      const { settled, count } = open()

      answer({ mapMemberCount: value })

      expect(settled.value).toBe(true)
      expect(count.value).toBeNull()
      expect(remembered()).toBe('null')
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

  describe('on a device that has heard an answer before', () => {
    it('says what it heard at once, and asks again in the background', () => {
      rememberedBefore('773')

      const { settled, count } = open()

      expect(settled.value).toBe(true)
      expect(count.value).toBe(773)
      expect(asked).toHaveLength(1)
    })

    it('keeps saying it for this visit when the new answer differs', () => {
      rememberedBefore('773')
      const { count } = open()

      answer({ mapMemberCount: 781 })

      expect(count.value).toBe(773)
      expect(remembered()).toBe('781')
    })

    it('stands without a number at once where the last answer had none', () => {
      rememberedBefore('null')

      const { settled, count } = open()

      expect(settled.value).toBe(true)
      expect(count.value).toBeNull()
    })

    // The GMS learns to answer one day (a release over there). The tile shows it from the
    // visit after -- not in the middle of this one.
    it('does not grow a number in the middle of a visit, but has it for the next', () => {
      rememberedBefore('null')
      const first = open()
      answer({ mapMemberCount: 773 })
      expect(first.count.value).toBeNull()
      wrapper.unmount()

      const second = open()

      expect(second.settled.value).toBe(true)
      expect(second.count.value).toBe(773)
    })

    it('forgets the number again when the server no longer has one', () => {
      rememberedBefore('773')
      const first = open()
      answer({ mapMemberCount: null })
      expect(first.count.value).toBe(773)
      wrapper.unmount()

      expect(open().count.value).toBeNull()
    })

    it('keeps what it heard through a visit without an answer', () => {
      rememberedBefore('773')
      open()

      asked[0].error(new Error('Failed to fetch'))

      expect(remembered()).toBe('773')
    })

    it('is the same for the next member on this device', () => {
      rememberedBefore('773')

      const { count } = open({ ...NOT_ON_THE_MAP, gradidoID: 'somebody-else' })

      expect(count.value).toBe(773)
    })
  })

  describe('what the device holds', () => {
    it.each([
      ['not a number at all', 'abc'],
      ['a text in quotes', '"773"'],
      ['a negative number', '-5'],
      ['half a member', '12.5'],
      ['an object', '{"count":773}'],
      ['nothing', ''],
    ])('counts %s as never having heard', (_name, raw) => {
      rememberedBefore(raw)

      const { settled, count } = open()

      expect(settled.value).toBe(false)
      expect(count.value).toBeNull()
    })

    it('still works where the storage cannot be read', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError')
      })

      const { settled, count } = open()
      expect(settled.value).toBe(false)

      answer({ mapMemberCount: 773 })
      expect(settled.value).toBe(true)
      expect(count.value).toBe(773)
    })

    it('still shows the number where the storage refuses to keep it', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      const { settled, count } = open()

      expect(() => answer({ mapMemberCount: 773 })).not.toThrow()

      expect(settled.value).toBe(true)
      expect(count.value).toBe(773)
    })
  })
})
