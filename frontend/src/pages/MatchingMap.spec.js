// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import de from '@/locales/de.json'
import MatchingMap from './MatchingMap.vue'
import { listMatchingEntries, userLocationQuery } from '@/graphql/queries'

const replace = vi.fn()
const push = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push, replace }),
}))

// Keyed by the query document: a mock answering every query the same could not
// show which of the two this page is reacting to, and the order of those two is
// the whole point of one of the tests below.
const handlers = new Map()
const fire = (document, data) => handlers.get(document)?.result?.({ data })

vi.mock('@vue/apollo-composable', () => ({
  useQuery: (document) => {
    const handler = { result: null, error: null }
    handlers.set(document, handler)
    return {
      refetch: vi.fn(),
      onResult: (callback) => {
        handler.result = callback
      },
      onError: (callback) => {
        handler.error = callback
      },
    }
  },
  useMutation: () => ({ mutate: vi.fn().mockResolvedValue({}) }),
}))

const load = vi.fn()
vi.mock('@/composables/useMatches', async () => {
  const actual = await vi.importActual('@/composables/useMatches')
  return {
    ...actual,
    useMatches: () => ({ matches: ref([]), presence: ref([]), load }),
  }
})

vi.mock('@/composables/useEntryDraft', () => ({
  useEntryDraft: () => ({ put: vi.fn(), take: () => null }),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }),
}))

vi.mock('leaflet-geosearch', () => ({
  OpenStreetMapProvider: class {
    async search() {
      return []
    }
  },
  GeoSearchControl: class {
    addTo() {
      return this
    }
  },
}))

const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } })

const makeStore = (gmsAllowed) =>
  createStore({ state: { gradidoID: 'a-member', gmsAllowed }, mutations: {} })

const location = {
  userLocation: { latitude: 48.2, longitude: 11.6 },
  communityLocation: { latitude: 48.1, longitude: 11.5 },
}

const entry = (uuid) => ({
  uuid,
  matchingType: 'MATCHING_TYPE_GESUCH',
  summary: 'Klavierlehrer',
  details: null,
  active: true,
  remote: false,
  createdAt: '2026-08-01T10:00:00.000Z',
})

let wrapper = null

const mountMap = ({ gmsAllowed = true } = {}) => {
  wrapper = mount(MatchingMap, {
    global: {
      plugins: [makeStore(gmsAllowed), i18n],
      stubs: { MatchQuery: true, MatchProfile: true, MatchList: true },
    },
  })
  return wrapper
}

beforeEach(() => {
  handlers.clear()
  replace.mockClear()
  push.mockClear()
  load.mockClear()
  window.localStorage.clear()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

describe('MatchingMap', () => {
  describe('when findability is off', () => {
    // The location query is switched off with it, so the redirect that lives in
    // that query's result — the one for "no pin yet" — can never speak. Without an
    // answer here the address, a bookmark or the back button would open a map
    // centred on nothing.
    it('sends the member to the position tab instead of building a map', async () => {
      const page = mountMap({ gmsAllowed: false })
      await page.vm.$nextTick()

      expect(replace).toHaveBeenCalledWith('/matching/position')
    })
  })

  describe('when my entries arrive after the location', () => {
    // Both queries go out together on a cold load and either can win. When the
    // location wins, the first search carries none of my uuids, so nothing comes
    // back able to say which of my entries it answers.
    it('asks again, this time carrying the uuids', async () => {
      const page = mountMap()

      fire(userLocationQuery, { userLocation: location })
      await page.vm.$nextTick()

      expect(load).toHaveBeenCalledTimes(1)
      expect(load.mock.calls[0][0].mineUuids).toEqual([])

      fire(listMatchingEntries, { listMatchingEntries: [entry('a'), entry('b')] })
      await page.vm.$nextTick()

      expect(load).toHaveBeenCalledTimes(2)
      expect(load.mock.calls[1][0].mineUuids).toEqual(['a', 'b'])
    })

    it('does not ask twice when the list arrives unchanged', async () => {
      const page = mountMap()
      const list = [entry('a')]

      fire(userLocationQuery, { userLocation: location })
      fire(listMatchingEntries, { listMatchingEntries: list })
      await page.vm.$nextTick()
      const asked = load.mock.calls.length

      // cache-and-network answers a second time with the very same list.
      fire(listMatchingEntries, { listMatchingEntries: list })
      await page.vm.$nextTick()

      expect(load).toHaveBeenCalledTimes(asked)
    })
  })

  describe('when my entries arrive before the location', () => {
    it('does not search before there is a place to search around', async () => {
      const page = mountMap()

      fire(listMatchingEntries, { listMatchingEntries: [entry('a')] })
      await page.vm.$nextTick()

      expect(load).not.toHaveBeenCalled()

      fire(userLocationQuery, { userLocation: location })
      await page.vm.$nextTick()

      expect(load).toHaveBeenCalledTimes(1)
      expect(load.mock.calls[0][0].mineUuids).toEqual(['a'])
    })
  })
})
