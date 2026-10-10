// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
// The app registers these through createBootstrap(); the save button has to be a
// real button here, because that is where the enabled state is read.
import { BButton, BCol, BRow } from 'bootstrap-vue-next'
import de from '@/locales/de.json'
import Matching from './Matching.vue'
import UserSettingsSwitch from '@/components/UserSettings/UserSettingsSwitch'
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
// Shared, so a test can read what the page said, and answer a save the way the server would.
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }))
const mutate = vi.hoisted(() => vi.fn())
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
  useMutation: () => ({ mutate }),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError: toast.error, toastSuccess: toast.success }),
}))

// What the map handed over, if anything. Read once on mount, like the real one.
const kept = vi.hoisted(() => ({ draft: null }))
vi.mock('@/composables/useEntryDraft', () => ({
  useEntryDraft: () => ({ put: vi.fn(), take: () => kept.draft }),
}))

const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } })

const store = createStore({
  state: { gradidoID: 'a-member', gmsAllowed: true, gmsPublishLocation: 'GMS_LOCATION_TYPE_EXACT' },
  // Real mutations, not no-ops: the find button reads findability and the position off
  // this store now, so a store that cannot be changed could only ever measure one half of
  // the rule -- and it was the half that is easiest to delete unnoticed.
  mutations: {
    gmsAllowed: (state, value) => {
      state.gmsAllowed = value
    },
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
const mountPage = (tab = 'entries', extraStubs = {}, options = {}) => {
  currentTab = tab
  wrapper = mount(Matching, {
    ...options,
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

// The entry form with its footer, and with what the page tells the dialog about where to
// stand. `centered` is the library's own prop name; the page used it before this stub did.
const entryModal = {
  BModal: {
    props: { centered: Boolean },
    template:
      '<div class="modal-stub" :data-centered="String(centered)"><slot /><slot name="footer" /></div>',
  },
}
const typeButtons = (page) => page.findAll('.type-choice-btn')
const pick = (page, key) => page.find(`.type-choice-btn.type-${key}`).trigger('click')
const openNewEntry = (page) => page.find('[data-test="matching-entries-new"]').trigger('click')
// The entry form is the first dialog in the page; the position tab's own "save" sits in a later one.
const saveButton = (page) =>
  page
    .find('.modal-stub')
    .findAll('button')
    .find((b) => b.text() === de.matching.save)

beforeEach(() => {
  handlers.clear()
  push.mockClear()
  toast.error.mockClear()
  toast.success.mockClear()
  mutate.mockReset()
  mutate.mockResolvedValue({})
  kept.draft = null
  window.localStorage.clear()
  // The store is shared by the whole file; put it back so no case inherits the answers of
  // the one before it.
  store.state.gmsAllowed = true
  store.state.userLocation = null
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

    // The empty page used to hide "new entry" under a picture and a paragraph, and move
    // it to the top right after the first entry. One line now, the same for both.
    describe('the line above it', () => {
      const count = (page) => page.find('[data-test="matching-entries-count"]')
      const empty = (page) => page.find('[data-test="matching-entries-empty"]')
      const newEntry = (page) => page.findAll('[data-test="matching-entries-new"]')

      it('counts nothing as nothing, and offers the new entry in the same place', async () => {
        const page = mountPage('entries')
        fire(listMatchingEntries, { listMatchingEntries: [] })
        await page.vm.$nextTick()

        expect(count(page).text()).toBe('0 Einträge · 0 live · 0 pausiert')
        expect(newEntry(page)).toHaveLength(1)
        expect(empty(page).text()).toContain(de.matching.entries.emptyTitle)
        expect(empty(page).text()).toContain(de.matching.entries.emptyText)
        // The second "new entry" stood inside the empty block.
        expect(empty(page).find('button').exists()).toBe(false)
      })

      it('keeps that one button where it is once there are entries', async () => {
        const page = mountPage('entries')
        fire(listMatchingEntries, { listMatchingEntries: [] })
        await page.vm.$nextTick()
        const before = newEntry(page)[0].element

        const paused = { ...entry('b', 'Fahrrad', 'Damenrad'), active: false }
        fire(listMatchingEntries, {
          listMatchingEntries: [entry('a', 'Klavierlehrer', 'Samstags'), paused],
        })
        await page.vm.$nextTick()

        expect(count(page).text()).toBe('2 Einträge · 1 live · 1 pausiert')
        expect(newEntry(page)).toHaveLength(1)
        // The same element, not a second one drawn elsewhere.
        expect(newEntry(page)[0].element).toBe(before)
        expect(empty(page).exists()).toBe(false)
      })

      it('says neither "0" nor "none yet" before the server has answered', () => {
        const page = mountPage('entries')

        expect(count(page).text()).toBe('')
        expect(empty(page).exists()).toBe(false)
        // The button does not wait.
        expect(newEntry(page)).toHaveLength(1)
      })
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

    // ...but only when it actually differs. Every mutation makes vuex-persistedstate
    // serialize the WHOLE store and write it to localStorage synchronously, and the store
    // carries the member's avatar as base64 -- so an unconditional commit would put a
    // ~12 KB write behind every answer of a network-only query, to store two floats that
    // did not change. cache-and-network and a refetch both answer more than once.
    it('does not write the store again for an answer that says the same', async () => {
      const page = mountPage('entries')
      const place = { latitude: 48.2, longitude: 11.6 }
      await answer(page, place)

      const commit = vi.spyOn(store, 'commit')
      await answer(page, { ...place })

      expect(commit).not.toHaveBeenCalledWith('userLocation', expect.anything())
      commit.mockRestore()
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

    // The other half of the rule, and the one nothing measured until now: a position is
    // not enough, the member has to allow it to travel. Delete the findability half of
    // the gate and this is the case that goes red.
    it('holds a member back who has a position but is not findable', async () => {
      store.state.gmsAllowed = false
      const page = mountPage('entries')
      await answer(page, { latitude: 48.2, longitude: 11.6 })

      await findButton(page).trigger('click')

      expect(push).not.toHaveBeenCalled()
    })
  })

  // An instance whose admin never set the community's coordinates answers null for them.
  // That must not stop a member from setting their own -- this is the page where they do
  // it, and the map on it needs a centre to draw.
  describe('when the instance has no coordinates of its own', () => {
    it('still gives the position map a centre to show', async () => {
      const page = mountPage('position')
      fire(userLocationQuery, { userLocation: { userLocation: null, communityLocation: null } })
      await page.vm.$nextTick()

      const centre = page.findComponent(UserLocationMapStub).props('userMarkerCoords')
      expect(Number.isFinite(centre.lat)).toBe(true)
      expect(Number.isFinite(centre.lng)).toBe(true)
    })
  })

  // Bernd, 11.09.2026: the community's own point is gone from this map - nobody needs its
  // centre here, and it confused wherever a home stood right on it. It still decides
  // where the map opens for a member who has no home on it yet.
  describe("the community's point", () => {
    it('is not handed to the map, but still opens it for a member without a home', async () => {
      const page = mountPage('position')
      fire(userLocationQuery, {
        userLocation: {
          userLocation: null,
          communityLocation: { latitude: 48.1, longitude: 11.5 },
        },
      })
      await page.vm.$nextTick()

      const map = page.findComponent(UserLocationMapStub)
      expect(map.exists()).toBe(true)
      expect(map.props('communityMarkerCoords')).toBeUndefined()
      expect(map.props('userMarkerCoords')).toEqual({ lat: 48.1, lng: 11.5 })
    })
  })

  // The second reader of the map's settings, and the one a change like this leaves behind:
  // it decides whether the button offers the map or the list. Keyed by the member since
  // 10.09.2026, or it would show this member the look the previous one left on the device.
  describe('what the find button offers', () => {
    const beschriftung = (page) => page.find('.find-btn').text()

    it('offers the list when THIS member last used the list', () => {
      window.localStorage.setItem(
        `pref.gms.map.${store.state.gradidoID}.mode`,
        JSON.stringify('liste'),
      )
      expect(beschriftung(mountPage('entries'))).toContain('Liste')
    })

    it('ignores what the device was left in', () => {
      window.localStorage.setItem('pref.gms.map.mode', JSON.stringify('liste'))
      expect(beschriftung(mountPage('entries'))).not.toContain('Liste')
    })

    it('ignores what another member set', () => {
      window.localStorage.setItem('pref.gms.map.somebody-else.mode', JSON.stringify('liste'))
      expect(beschriftung(mountPage('entries'))).not.toContain('Liste')
    })
  })

  describe('the entry form', () => {
    // The column behind the summary is varchar(160) and the resolver passes the
    // value through untouched.
    // Since the map has a reach switch the box is a gate, not a label: an entry without
    // it is never found in the wide search. That has to be said where it is ticked.
    it('says what the supra-regional box now does, under the box', async () => {
      const page = mountPage('entries', openModals)
      await openNewEntry(page)
      await pick(page, 'angebot')

      expect(page.text()).toContain(de.matching.new.remoteHint)
    })

    it('stops the summary at the length its column can hold', async () => {
      const page = mountPage('entries', openModals)
      await openNewEntry(page)
      await pick(page, 'angebot')
      const summary = page.findAll('input').find((i) => i.attributes('maxlength'))

      expect(summary.attributes('maxlength')).toBe('160')
    })

    // "Interest" used to be lit when the form opened. The three read as a setting already
    // made, and a first entry became an interest because nobody knew there was a choice.
    describe('for a new entry', () => {
      const chooseLine = (page) => page.find('[data-test="matching-entry-choose"]')

      it('opens on the choice alone: nothing picked, nothing to fill in, nothing to save', async () => {
        const page = mountPage('entries', entryModal)
        await openNewEntry(page)

        expect(chooseLine(page).text()).toBe(de.matching.new.choose)
        expect(chooseLine(page).classes()).not.toContain('invisible')
        expect(typeButtons(page).map((b) => b.attributes('aria-pressed'))).toEqual([
          'false',
          'false',
          'false',
        ])
        expect(page.find('.is-sel').exists()).toBe(false)
        expect(page.find('input').exists()).toBe(false)
        expect(page.find('textarea').exists()).toBe(false)
        expect(saveButton(page)).toBeUndefined()
        expect(page.text()).toContain(de.matching.new.cancel)
      })

      it('shows on each button the sentence it starts', async () => {
        const page = mountPage('entries', entryModal)
        await openNewEntry(page)

        expect(typeButtons(page).map((b) => b.find('.type-choice-starts').text())).toEqual([
          'Ich liebe …',
          'Ich biete …',
          'Ich suche …',
        ])
      })

      it('names the three as one choice for a screen reader', async () => {
        const page = mountPage('entries', entryModal)
        await openNewEntry(page)

        const group = page.find('[role="group"]')
        expect(group.attributes('aria-label')).toBe(de.matching.new.choose)
        expect(group.findAll('.type-choice-btn')).toHaveLength(3)
      })

      it('brings the fields for the kind that was picked, and keeps the line its place', async () => {
        const page = mountPage('entries', entryModal)
        await openNewEntry(page)
        await pick(page, 'gesuch')

        expect(typeButtons(page).map((b) => b.attributes('aria-pressed'))).toEqual([
          'false',
          'false',
          'true',
        ])
        expect(page.find('.entry-prefix').text()).toBe('Ich suche')
        expect(page.find('input').attributes('placeholder')).toBe(
          de.matching.type.gesuch.placeholder,
        )
        expect(page.find('textarea').exists()).toBe(true)
        expect(saveButton(page).exists()).toBe(true)
        // Still there, so the buttons do not move up under the finger; only unseen.
        expect(chooseLine(page).exists()).toBe(true)
        expect(chooseLine(page).classes()).toContain('invisible')
      })

      it('stands at the top of the window, before and after the choice', async () => {
        const page = mountPage('entries', entryModal)
        await openNewEntry(page)
        // The entry form is the first dialog in the page.
        const dialog = page.find('.modal-stub')
        expect(dialog.attributes('data-centered')).toBe('false')

        await pick(page, 'interesse')

        expect(dialog.attributes('data-centered')).toBe('false')
      })

      it('saves the kind that was picked, not the one that used to be the default', async () => {
        const page = mountPage('entries', entryModal)
        await openNewEntry(page)
        await pick(page, 'angebot')
        await page.find('input').setValue('Fahrradreparatur')
        await page.find('textarea').setValue('Alte und neue Räder')
        await saveButton(page).trigger('click')

        expect(mutate).toHaveBeenCalledWith({
          input: {
            matchingType: 'offer',
            summary: 'Fahrradreparatur',
            details: 'Alte und neue Räder',
            remote: false,
          },
        })
      })

      it('asks again the next time, whatever was picked last time', async () => {
        const page = mountPage('entries', entryModal)
        await openNewEntry(page)
        await pick(page, 'angebot')
        await openNewEntry(page)

        expect(page.find('.is-sel').exists()).toBe(false)
        expect(chooseLine(page).classes()).not.toContain('invisible')
        expect(page.find('input').exists()).toBe(false)
      })
    })

    it('does not ask a search kept from the map, which brings its kind along', async () => {
      kept.draft = { summary: 'einen Schlosser', matchingType: 'gesuch' }
      const page = mountPage('entries', entryModal)
      await page.vm.$nextTick()

      expect(page.find('[data-test="matching-entry-choose"]').exists()).toBe(false)
      expect(page.find('.is-sel').classes()).toContain('type-gesuch')
      expect(page.find('input').element.value).toBe('einen Schlosser')
      expect(page.find('.modal-stub').attributes('data-centered')).toBe('true')
    })

    it('does not ask for an entry that is being edited', async () => {
      const page = mountPage('entries', entryModal)
      fire(listMatchingEntries, {
        // The server's own word for a request, so the kind shown is the entry's and not the
        // fallback for a word nobody knows.
        listMatchingEntries: [
          { ...entry('a', 'Klavierlehrer', 'Am liebsten samstags'), matchingType: 'need' },
        ],
      })
      await page.vm.$nextTick()
      // A new entry was begun first, so the form last stood on the choice: editing must not
      // inherit that.
      await openNewEntry(page)
      // Details · Pause · Edit · Delete
      await page.findAll('.pointer')[2].trigger('click')

      expect(page.find('[data-test="matching-entry-choose"]').exists()).toBe(false)
      expect(page.find('.is-sel').classes()).toContain('type-gesuch')
      expect(page.find('input').element.value).toBe('Klavierlehrer')
      expect(page.find('.modal-stub').attributes('data-centered')).toBe('true')
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

    // Findable needs a home (Bernd, 27.09.2026): the GMS cannot place a member without one,
    // so the switch holds, the hint beneath it says what is missing, and save never carries
    // findable on its own. The map opens on the community's point for a member without a
    // home, and the house standing there is not one.
    describe('for a member without a home', () => {
      const noHome = {
        userLocation: null,
        communityLocation: { latitude: 48.1, longitude: 11.5 },
      }
      const findableSwitch = (page) => page.findComponent(UserSettingsSwitch)
      const hint = (page) => page.find('.border-top .text-end.small').text()

      const openWithoutHome = async (extraStubs = {}, options = {}) => {
        store.state.gmsAllowed = false
        const page = mountPage('position', extraStubs, options)
        fire(userLocationQuery, { userLocation: noHome })
        await page.vm.$nextTick()
        return page
      }

      it('holds the findable switch and says why beneath it', async () => {
        const page = await openWithoutHome()

        expect(findableSwitch(page).props('locked')).toBe(true)
        expect(findableSwitch(page).props('notAllowedText')).toBe(de.matching.position.needsHome)
        expect(hint(page)).toBe(de.matching.position.needsHome)
      })

      it('frees the switch as soon as a home is picked on the map', async () => {
        const page = await openWithoutHome()
        page
          .findComponent(UserLocationMapStub)
          .vm.$emit('update:userPosition', { lat: 49, lng: 12 })
        await page.vm.$nextTick()

        expect(findableSwitch(page).props('locked')).toBe(false)
        expect(hint(page)).toBe(de.matching.position.findableHint)
      })

      // Until the location has answered nobody knows, and "set your home first" would
      // reach members who have one.
      it('says nothing about a missing home before the location has answered', () => {
        store.state.gmsAllowed = false
        const page = mountPage('position')

        expect(findableSwitch(page).props('locked')).toBe(false)
        expect(hint(page)).toBe(de.matching.position.findableHint)
      })

      // The pin is picked, findable goes on, and then the pin comes back to where the map
      // opened - most easily by searching a place that lands on the community's point. The
      // draft is gone then, and findable must not go out alone.
      it('keeps save off while findable would go out without a home', async () => {
        const page = await openWithoutHome()
        const map = page.findComponent(UserLocationMapStub)
        map.vm.$emit('update:userPosition', { lat: 49, lng: 12 })
        await page.vm.$nextTick()
        findableSwitch(page).vm.$emit('value-changed', true)
        await page.vm.$nextTick()
        expect(saveButton(page).attributes('disabled')).toBeUndefined()

        map.vm.$emit('update:userPosition', { lat: 48.1, lng: 11.5 })
        await page.vm.$nextTick()

        expect(saveButton(page).attributes('disabled')).toBeDefined()
        expect(hint(page)).toBe(de.matching.position.needsHome)
      })

      // Only the way on is held. Somebody findable without a home - saved before the server
      // refused it - has to be able to leave.
      it('lets a member switch off who is findable without one', async () => {
        const page = await openWithoutHome()
        store.state.gmsAllowed = true
        await page.vm.$nextTick()
        expect(findableSwitch(page).props('locked')).toBe(false)

        findableSwitch(page).vm.$emit('value-changed', false)
        await page.vm.$nextTick()

        expect(saveButton(page).attributes('disabled')).toBeUndefined()
      })

      // The wire between the page and the real switch, which the cases above cannot see:
      // they stub the switch and read what it was handed.
      it('answers a tap on the real switch with the reason, and it stays off', async () => {
        const page = await openWithoutHome(
          { UserSettingsSwitch: false },
          { attachTo: document.body },
        )
        const input = findableSwitch(page).find('input')

        await input.trigger('click')

        expect(input.element.checked).toBe(false)
        expect(toast.error).toHaveBeenCalledWith(de.matching.position.needsHome)
        expect(saveButton(page).attributes('disabled')).toBeDefined()
        // Its name, which the words beside it do not give it.
        expect(input.attributes('aria-label')).toBe(de.matching.position.findable)
      })
    })

    // The server refuses findable without a home as well (GMS_LOCATION_REQUIRED). This page
    // does not send it, but should the two ever disagree, the member reads the sentence.
    describe('when the server refuses findable', () => {
      const confirmOnly = {
        BModal: {
          props: ['modelValue'],
          template:
            '<div v-if="modelValue" class="modal-stub"><slot /><slot name="footer" /></div>',
        },
      }
      const saveWith = async (error) => {
        store.state.gmsAllowed = false
        const page = mountPage('position', confirmOnly)
        fire(userLocationQuery, { userLocation: location })
        await page.vm.$nextTick()
        page.findComponent(UserSettingsSwitch).vm.$emit('value-changed', true)
        await page.vm.$nextTick()
        mutate.mockRejectedValueOnce(error)

        await saveButton(page).trigger('click')
        const confirm = page
          .find('.modal-stub')
          .findAll('button')
          .find((button) => button.text() === de.matching.save)
        await confirm.trigger('click')
        await flushPromises()
      }

      it('says what is missing instead of the code', async () => {
        await saveWith(new Error('GMS_LOCATION_REQUIRED'))

        expect(mutate).toHaveBeenCalledWith({ gmsAllowed: true })
        expect(toast.error).toHaveBeenCalledWith(de.matching.position.needsHome)
      })

      it('passes any other failure on as it came', async () => {
        await saveWith(new Error('something else'))

        expect(toast.error).toHaveBeenCalledWith('something else')
      })
    })
  })
})
