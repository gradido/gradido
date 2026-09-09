// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
// The app registers these through createBootstrap(); the save button has to be a
// real button here, because that is where the enabled state is read.
import { BButton, BCol, BRow } from 'bootstrap-vue-next'
import de from '@/locales/de.json'
import Matching from './Matching.vue'
import { listMatchingEntries, userLocationQuery, verifyLogin } from '@/graphql/queries'

const push = vi.fn()
let currentTab = 'entries'
vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({
    params: {
      get tab() {
        return currentTab
      },
    },
  }),
}))

// One handler set per query document, keyed by the document itself: a mock that
// answers every query the same cannot tell whether the page asked for the right
// one.
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

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }),
}))

vi.mock('@/composables/useEntryDraft', () => ({
  useEntryDraft: () => ({ put: vi.fn(), take: () => null }),
}))

const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } })

const store = createStore({
  state: { gradidoID: 'a-member', gmsAllowed: true, gmsPublishLocation: 'GMS_LOCATION_TYPE_EXACT' },
  mutations: {
    gmsAllowed: () => {},
    gmsPublishLocation: () => {},
    userLocation: (state, value) => {
      state.userLocation = value
    },
  },
})

// The map is exercised by its own spec; here it only has to be able to report a
// picked position, which is what onPickPosition reads.
const UserLocationMapStub = {
  props: ['userMarkerCoords', 'communityMarkerCoords', 'showCoordinates', 'height', 'userIcon'],
  emits: ['update:userPosition'],
  template: '<div class="map-stub" />',
}

const entry = (uuid, summary, details) => ({
  uuid,
  matchingType: 'MATCHING_TYPE_GESUCH',
  summary,
  details,
  active: true,
  remote: false,
  createdAt: '2026-08-01T10:00:00.000Z',
})

let wrapper = null

// BModal is stubbed away by default - it teleports, and its content would show up
// in page.text() for every test whether the dialog is open or not. A test that
// needs to look inside one passes its own stub.
const mountPage = (tab = 'entries', extraStubs = {}) => {
  currentTab = tab
  wrapper = mount(Matching, {
    global: {
      plugins: [store, i18n],
      components: { BButton, BRow, BCol },
      stubs: {
        UserLocationMap: UserLocationMapStub,
        UserGMSLocationFormat: true,
        UserSettingsSwitch: true,
        BModal: true,
        TransitionGroup: false,
        ...extraStubs,
      },
    },
  })
  return wrapper
}

const openModals = { BModal: { template: '<div class="modal-stub"><slot /></div>' } }

beforeEach(() => {
  handlers.clear()
  push.mockClear()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

describe('Matching', () => {
  describe('the entries list', () => {
    // Saving, pausing or deleting any entry refetches the whole list. Rebuilding
    // it blind used to close every card, so reading entry A and then pausing
    // entry B collapsed A under the member's finger.
    it('keeps an opened entry open when the list reloads', async () => {
      const page = mountPage('entries')
      const list = [
        entry('a', 'Klavierlehrer', 'Am liebsten samstags'),
        entry('b', 'Fahrrad', 'Damenrad'),
      ]
      fire(listMatchingEntries, { listMatchingEntries: list })
      await page.vm.$nextTick()

      // Open the first card by its details toggle.
      await page.findAll('.pointer')[0].trigger('click')
      expect(page.text()).toContain('Am liebsten samstags')

      // Same data arriving again, as a refetch after pausing an unrelated entry.
      fire(listMatchingEntries, { listMatchingEntries: list })
      await page.vm.$nextTick()

      expect(page.text()).toContain('Am liebsten samstags')
    })

    it('starts an entry it has not seen before closed', async () => {
      const page = mountPage('entries')
      fire(listMatchingEntries, {
        listMatchingEntries: [entry('a', 'Klavierlehrer', 'Am liebsten samstags')],
      })
      await page.vm.$nextTick()

      expect(page.text()).not.toContain('Am liebsten samstags')
    })
  })

  describe('the find button', () => {
    const findButton = (page) => page.find('.find-btn')

    // hasPosition is false for everyone until the location query answers, and the
    // panel behind this button says "you have no position yet" - a sentence we
    // cannot honestly say before we know.
    it('waits until the location is known', async () => {
      const page = mountPage('entries')

      expect(findButton(page).attributes('disabled')).toBeDefined()
    })

    it('opens once the location has answered', async () => {
      const page = mountPage('entries')
      fire(userLocationQuery, {
        userLocation: {
          userLocation: { latitude: 48.2, longitude: 11.6 },
          communityLocation: { latitude: 48.1, longitude: 11.5 },
        },
      })
      await page.vm.$nextTick()

      expect(findButton(page).attributes('disabled')).toBeUndefined()
    })

    // ⭐ Both answers or neither: a position AND findability (Bernd, 09.09.2026).
    //
    // ⛔ `Boolean(loc.userLocation)` stood behind this button until then, and an account
    // that had never set a position was answered `{}` -- truthy. So the button carried
    // exactly the members who had nothing to show on the map straight onto it, where it
    // centred on nothing and reported the GMS as unreachable.
    const answer = (page, userLocation) => {
      fire(userLocationQuery, {
        userLocation: { userLocation, communityLocation: { latitude: 48.1, longitude: 11.5 } },
      })
      return page.vm.$nextTick()
    }

    it('carries a member with a position onto the map', async () => {
      const page = mountPage('entries')
      await answer(page, { latitude: 48.2, longitude: 11.6 })

      await findButton(page).trigger('click')

      expect(push).toHaveBeenCalledWith('/matching/karte')
    })

    // The guard in front of the map reads the store, this page reads the server. Left
    // apart, a position set on another device would light this button up and the guard
    // would send the member straight back -- a button that does nothing, and says nothing.
    it('writes what the server just said into the store the guard reads', async () => {
      const page = mountPage('entries')
      await answer(page, { latitude: 48.2, longitude: 11.6 })

      expect(store.state.userLocation).toEqual({ latitude: 48.2, longitude: 11.6 })

      await answer(page, {})

      expect(store.state.userLocation).toBeNull()
    })

    it.each([
      ['an empty object -- the answer that happened', {}],
      ['nothing at all', null],
      ['half a pair', { latitude: 48.2 }],
    ])('holds a member back and explains, for %s', async (_name, userLocation) => {
      const page = mountPage('entries')
      await answer(page, userLocation)

      await findButton(page).trigger('click')

      expect(push).not.toHaveBeenCalled()
    })
  })

  describe('the entry form', () => {
    // The column behind the summary is varchar(160) and the resolver passes the
    // value through untouched.
    it('stops the summary at the length its column can hold', () => {
      const page = mountPage('entries', openModals)
      const summary = page.findAll('input').find((i) => i.attributes('maxlength'))

      expect(summary.attributes('maxlength')).toBe('160')
    })
  })

  describe('the about tab', () => {
    const box = (page) => page.find('textarea.matching-textarea')

    // cache-and-network answers twice, and any later verifyLogin refetch answers
    // again. Every answer used to be written straight into the box the member is
    // typing in.
    it('keeps what the member has typed when the same answer arrives again', async () => {
      const page = mountPage('about')
      fire(verifyLogin, { verifyLogin: { aboutMe: 'Ich spiele Klavier.' } })
      await page.vm.$nextTick()

      await box(page).setValue('Ich spiele Klavier und suche Mitspieler.')
      fire(verifyLogin, { verifyLogin: { aboutMe: 'Ich spiele Klavier.' } })
      await page.vm.$nextTick()

      expect(box(page).element.value).toBe('Ich spiele Klavier und suche Mitspieler.')
    })

    // The other half, and the reason this is not simply "fill once": a stale cache
    // answering first must still be correctable by the network behind it.
    it('still takes a newer answer while the box is untouched', async () => {
      const page = mountPage('about')
      fire(verifyLogin, { verifyLogin: { aboutMe: 'aus dem Zwischenspeicher' } })
      await page.vm.$nextTick()

      fire(verifyLogin, { verifyLogin: { aboutMe: 'frisch vom Server' } })
      await page.vm.$nextTick()

      expect(box(page).element.value).toBe('frisch vom Server')
    })
  })

  describe('the position tab', () => {
    const location = {
      userLocation: { latitude: 48.2, longitude: 11.6 },
      communityLocation: { latitude: 48.1, longitude: 11.5 },
    }
    const saveButton = (page) =>
      page.findAll('button').find((button) => button.text().includes(de.matching.save))

    const openPositionTab = async () => {
      const page = mountPage('position')
      fire(userLocationQuery, { userLocation: location })
      await page.vm.$nextTick()
      return page
    }

    it('leaves save disabled while the pin sits where it was saved', async () => {
      const page = await openPositionTab()
      // The map echoes its own starting position once it is up.
      page
        .findComponent(UserLocationMapStub)
        .vm.$emit('update:userPosition', { lat: 48.2, lng: 11.6 })
      await page.vm.$nextTick()

      expect(saveButton(page).attributes('disabled')).toBeDefined()
    })

    it('arms save once the pin moves', async () => {
      const page = await openPositionTab()
      page.findComponent(UserLocationMapStub).vm.$emit('update:userPosition', { lat: 49, lng: 12 })
      await page.vm.$nextTick()

      expect(saveButton(page).attributes('disabled')).toBeUndefined()
    })

    // Moving away and back is easiest by searching your own address again, which
    // hands back the very coordinates that are already saved. The pin then shows
    // home while the held draft still points at the detour — and save would
    // commit the detour.
    it('disarms save again when the pin returns to the saved place', async () => {
      const page = await openPositionTab()
      const map = page.findComponent(UserLocationMapStub)

      map.vm.$emit('update:userPosition', { lat: 49, lng: 12 })
      await page.vm.$nextTick()
      expect(saveButton(page).attributes('disabled')).toBeUndefined()

      map.vm.$emit('update:userPosition', { lat: 48.2, lng: 11.6 })
      await page.vm.$nextTick()

      expect(saveButton(page).attributes('disabled')).toBeDefined()
    })
  })
})
