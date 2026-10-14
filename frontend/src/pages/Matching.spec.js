// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { reactive } from 'vue'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
// The app registers these through createBootstrap(); the save button has to be a
// real button here, because that is where the enabled state is read.
import { BButton, BCol, BRow } from 'bootstrap-vue-next'
import de from '@/locales/de.json'
import es from '@/locales/es.json'
import Matching from './Matching.vue'
import UserSettingsSwitch from '@/components/UserSettings/UserSettingsSwitch'
import { listMatchingEntries, userLocationQuery, verifyLogin } from '@/graphql/queries'

const push = vi.fn()
// Reactive, so a case can move the member on the way the router would - to another tab, or
// to the same tab with a query - and the page follows. `push` itself stays a spy: where a
// case needs the move, it makes it here.
const place = reactive({ tab: 'entries', query: {} })
// Replacing is how the page takes a wish out of the address it arrived with. The address
// follows, as it would: a page that read the wish a second time would find it gone.
const replace = vi.fn((to) => {
  if (to?.query) place.query = to.query
})
vi.mock('vue-router', () => ({
  useRouter: () => ({ push, replace }),
  useRoute: () => ({
    params: {
      get tab() {
        return place.tab
      },
    },
    get query() {
      return place.query
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
// What a query answers the moment the page asks for it, before the page stands: the cache,
// where it holds the answer already. Keyed by the document, like the handlers.
const early = new Map()

vi.mock('@vue/apollo-composable', () => ({
  useQuery: (document) => {
    const handler = { result: null, error: null, refetch: vi.fn() }
    handlers.set(document, handler)
    return {
      refetch: handler.refetch,
      onResult: (callback) => {
        handler.result = callback
        if (early.has(document)) callback({ data: early.get(document) })
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
const mountPage = (tab = 'entries', extraStubs = {}, options = {}, language = i18n) => {
  place.tab = tab
  wrapper = mount(Matching, {
    ...options,
    global: {
      plugins: [store, language],
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
// The same, and whether the page has the dialog open: `modelValue` is the library's name for
// what `v-model` binds. The stubs above draw a dialog's content open or not.
const shownModal = {
  BModal: {
    props: { modelValue: Boolean, centered: Boolean },
    template:
      '<div class="modal-stub" :data-open="String(modelValue)" :data-centered="String(centered)"><slot /><slot name="footer" /></div>',
  },
}
// The entry form is the first dialog in the page.
const formOpen = (page) => page.find('.modal-stub').attributes('data-open') === 'true'
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
  early.clear()
  push.mockClear()
  replace.mockClear()
  toast.error.mockClear()
  toast.success.mockClear()
  mutate.mockReset()
  mutate.mockResolvedValue({})
  kept.draft = null
  place.query = {}
  window.localStorage.clear()
  // The store is shared by the whole file; put it back so no case inherits the answers of
  // the one before it.
  store.state.gradidoID = 'a-member'
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

    /**
     * The overview's matching tile is one of three things by how many entries the member
     * has (useOwnMatchingEntries), and it must be right the moment they come back from
     * here -- this is where entries are made and deleted. So the page tells the device with
     * every list it loads. Wiring: nothing else notices if the line goes, and the overview
     * would then hold its tiles back to ask, or invite a member to a "first" entry they made
     * a minute ago.
     */
    describe('what it tells the overview', () => {
      // Written out: the key the overview reads, for the member of this file's store.
      const told = () => window.localStorage.getItem('own-matching-entries:a-member')

      it('says how many entries the member has, with every list', async () => {
        mountPage('entries')
        expect(told()).toBeNull()

        fire(listMatchingEntries, { listMatchingEntries: [] })
        expect(told()).toBe('0')

        // After a save the list is fetched again, and the answer says one more.
        fire(listMatchingEntries, { listMatchingEntries: [entry('a', 'Klavierlehrer', '')] })
        expect(told()).toBe('1')

        // And after deleting it, none again.
        fire(listMatchingEntries, { listMatchingEntries: [] })
        expect(told()).toBe('0')
      })

      it('counts paused entries too, and no further than "arrived"', () => {
        mountPage('entries')
        const paused = { ...entry('b', 'Fahrrad', ''), active: false }

        fire(listMatchingEntries, { listMatchingEntries: [entry('a', 'Klavier', ''), paused] })
        expect(told()).toBe('2')

        fire(listMatchingEntries, {
          listMatchingEntries: ['a', 'b', 'c', 'd', 'e'].map((uuid) => entry(uuid, uuid, '')),
        })
        expect(told()).toBe('3')
      })

      // The page asks for the list on every tab, so the member who came onto the map on the
      // home tab is known before they are back on the overview.
      it.each(['about', 'position'])('says it from the %s tab as well', (tab) => {
        mountPage(tab)

        fire(listMatchingEntries, { listMatchingEntries: [] })

        expect(told()).toBe('0')
      })

      it('says nothing for a report without the list', () => {
        mountPage('entries')

        fire(listMatchingEntries, {})
        fire(listMatchingEntries, { listMatchingEntries: null })

        expect(told()).toBeNull()
      })

      /**
       * A save takes the server a round trip to the GMS, and the list comes back only after
       * it. A member who leaves the page in between -- the browser's back button works over
       * the open form -- would find the overview inviting them to a "first" entry they have
       * just made. So the device is told the moment the server has confirmed the entry, and
       * the list corrects it when it comes (the second reader's finding, 11.10.2026).
       *
       * The refetch of this file's mock answers nothing, which is exactly that case.
       */
      describe('before the list is back', () => {
        const writeEntry = async (page) => {
          await openNewEntry(page)
          await pick(page, 'angebot')
          await page.find('input').setValue('Fahrradreparatur')
          await page.find('textarea').setValue('Alte und neue Räder')
          await saveButton(page).trigger('click')
          await flushPromises()
        }
        // The fourth of a card's four: details, pause, edit, delete. Then the window's own button.
        const deleteFirst = async (page) => {
          await page.findAll('.pointer')[3].trigger('click')
          const windows = page.findAll('.modal-stub')
          const confirm = windows
            .find((w) => w.text().includes(de.matching.entries.deleteConfirm))
            .findAll('button')
            .find((b) => b.text() === de.matching.entries.delete)
          await confirm.trigger('click')
          await flushPromises()
        }
        const two = [entry('a', 'Klavierlehrer', 'Am liebsten samstags'), entry('b', 'Rad', 'Rot')]

        it('says one more the moment an entry is saved', async () => {
          const page = mountPage('entries', entryModal)
          fire(listMatchingEntries, { listMatchingEntries: [] })
          expect(told()).toBe('0')

          await writeEntry(page)

          expect(mutate).toHaveBeenCalledTimes(1)
          expect(told()).toBe('1')
        })

        it('says one fewer the moment an entry is deleted', async () => {
          const page = mountPage('entries', entryModal)
          fire(listMatchingEntries, { listMatchingEntries: two })
          await page.vm.$nextTick()
          expect(told()).toBe('2')

          await deleteFirst(page)

          expect(mutate).toHaveBeenCalledWith({ uuid: 'a' })
          expect(told()).toBe('1')
        })

        it('takes the list for the truth when it comes', async () => {
          const page = mountPage('entries', entryModal)
          fire(listMatchingEntries, { listMatchingEntries: [] })
          await writeEntry(page)
          expect(told()).toBe('1')

          // Entries made on another device meanwhile.
          fire(listMatchingEntries, { listMatchingEntries: two.concat(entry('c', 'Chor', 'Alt')) })

          expect(told()).toBe('3')
        })

        it('says nothing new where the server refuses the entry', async () => {
          mutate.mockRejectedValueOnce(new Error('the server is away'))
          const page = mountPage('entries', entryModal)
          fire(listMatchingEntries, { listMatchingEntries: [] })

          await writeEntry(page)

          expect(toast.error).toHaveBeenCalledWith('the server is away')
          expect(told()).toBe('0')
        })

        it('says nothing new where the server refuses the deletion', async () => {
          mutate.mockRejectedValueOnce(new Error('the server is away'))
          const page = mountPage('entries', entryModal)
          fire(listMatchingEntries, { listMatchingEntries: two })
          await page.vm.$nextTick()

          await deleteFirst(page)

          expect(told()).toBe('2')
        })

        // An edit changes the words, not the number.
        it('leaves the number alone for an entry that is edited', async () => {
          const page = mountPage('entries', entryModal)
          fire(listMatchingEntries, { listMatchingEntries: [two[0]] })
          await page.vm.$nextTick()
          await page.findAll('.pointer')[2].trigger('click')
          await page.find('input').setValue('Klavierlehrerin')
          await saveButton(page).trigger('click')
          await flushPromises()

          expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ uuid: 'a' }))
          expect(told()).toBe('1')
        })

        // One more than unknown is unknown: the overview then asks for itself.
        it('does not guess where the list has not answered yet', async () => {
          const page = mountPage('entries', entryModal)

          await writeEntry(page)

          expect(mutate).toHaveBeenCalledTimes(1)
          expect(told()).toBeNull()
        })

        // A sign-out empties the store while the answer is on its way. The entry is still
        // that member's.
        it('files it under the member who saved, whoever the store names by then', async () => {
          let confirm
          mutate.mockReturnValueOnce(
            new Promise((resolve) => {
              confirm = resolve
            }),
          )
          const page = mountPage('entries', entryModal)
          fire(listMatchingEntries, { listMatchingEntries: [] })
          await writeEntry(page)
          expect(told()).toBe('0')

          store.state.gradidoID = null
          confirm({})
          await flushPromises()

          expect(told()).toBe('1')
          expect(window.localStorage.length).toBe(1)
        })
      })
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

      // "1 Einträge · 1 live · 0 pausiert" stood here: each number has its own word now
      // (locales/matchingEntriesCount.spec.js has the ten languages).
      it('counts one entry as one', async () => {
        const page = mountPage('entries')
        fire(listMatchingEntries, {
          listMatchingEntries: [entry('a', 'Klavierlehrer', 'Samstags')],
        })
        await page.vm.$nextTick()

        expect(count(page).text()).toBe('1 Eintrag · 1 live · 0 pausiert')
      })

      // The word for the live ones follows THEIR number, not the number of entries: German
      // cannot show that ("live" is "live"), Spanish can. Three entries, one of them live.
      it('declines the live ones by their own number', async () => {
        const spanish = createI18n({ legacy: false, locale: 'es', messages: { es } })
        const page = mountPage('entries', {}, {}, spanish)
        const paused = (uuid) => ({ ...entry(uuid, uuid, ''), active: false })
        fire(listMatchingEntries, {
          listMatchingEntries: [entry('a', 'Piano', ''), paused('b'), paused('c')],
        })
        await page.vm.$nextTick()

        expect(count(page).text()).toBe('3 entradas · 1 activa · 2 en pausa')
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

    // What the held-back member is offered instead (Bernd, 11.10.2026): the button of the
    // tile on the overview, saying what it does, and carrying the yes to the home tab.
    describe('the window for a member who is not on the map', () => {
      const openOnly = {
        BModal: {
          props: ['modelValue'],
          template:
            '<div v-if="modelValue" class="modal-stub"><slot /><slot name="footer" /></div>',
        },
      }
      const showMe = (page) => page.find('[data-test="find-gate-show-me"]')
      const openWindow = async (tab) => {
        store.state.gmsAllowed = false
        const page = mountPage(tab, openOnly)
        await answer(page, null)
        await findButton(page).trigger('click')
        return page
      }

      it('offers the way on in the words of the tile, and it carries the yes', async () => {
        const page = await openWindow('entries')
        expect(showMe(page).text()).toBe(de.matching.invitation.go)

        await showMe(page).trigger('click')

        expect(push).toHaveBeenCalledWith({
          path: '/matching/position',
          query: { findable: 'yes' },
        })
        expect(showMe(page).exists()).toBe(false)
      })

      // On the home tab the window used to say "understood" and change nothing. It is the
      // same button now, and the switch on the tab beneath it stands on once the address
      // has changed - which the router does, and this case does for it.
      it('is the same button on the home tab, and stands the switch there on', async () => {
        const page = await openWindow('position')
        expect(page.findComponent(UserSettingsSwitch).props('initialValue')).toBe(false)

        await showMe(page).trigger('click')
        expect(push).toHaveBeenCalledWith({
          path: '/matching/position',
          query: { findable: 'yes' },
        })
        place.query = { findable: 'yes' }
        await page.vm.$nextTick()

        expect(page.findComponent(UserSettingsSwitch).props('initialValue')).toBe(true)
      })

      // Here with the yes in the address already, and the switch turned back off since. The
      // address cannot change a second time, so the arrival does not run again; the button
      // said it shows the member on the map and changed nothing (coderabbit on #4124). No
      // router here that could cover for it: the query stays what it is, as it would.
      it('stands the switch on again for a member who is here with the yes and took it back', async () => {
        store.state.gmsAllowed = false
        place.query = { findable: 'yes' }
        const page = mountPage('position', openOnly)
        await answer(page, null)
        const findable = () => page.findComponent(UserSettingsSwitch)
        expect(findable().props('initialValue')).toBe(true)
        findable().vm.$emit('value-changed', false)
        await page.vm.$nextTick()
        expect(findable().props('initialValue')).toBe(false)

        await findButton(page).trigger('click')
        await showMe(page).trigger('click')

        expect(showMe(page).exists()).toBe(false)
        expect(findable().props('initialValue')).toBe(true)
        // A draft like the arrival's: nothing is saved by pressing it.
        expect(mutate).not.toHaveBeenCalled()
      })
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

    /**
     * The overview's matching tile leads here with `?new=entry` (utils/newMatchingEntry): its
     * button means "let me write one now", so the form opens by itself. The wish is read
     * once and taken out of the address, the way the contacts page does with a conversation
     * it is asked for -- a reload, or the way back, must not open the form again.
     */
    describe('for a member the overview sent to write an entry', () => {
      const cancel = (page) =>
        page
          .find('.modal-stub')
          .findAll('button')
          .find((b) => b.text() === de.matching.new.cancel)

      it('opens the form by itself, on the choice of what to enter', async () => {
        place.query = { new: 'entry' }
        const page = mountPage('entries', shownModal)
        await page.vm.$nextTick()

        expect(formOpen(page)).toBe(true)
        expect(page.find('[data-test="matching-entry-choose"]').text()).toBe(de.matching.new.choose)
        expect(page.find('.is-sel').exists()).toBe(false)
        expect(page.find('input').exists()).toBe(false)
      })

      it('takes the wish out of the address at once, and leaves the rest of it', async () => {
        place.query = { new: 'entry', pid: '7' }
        const page = mountPage('entries', shownModal)
        await page.vm.$nextTick()

        expect(replace).toHaveBeenCalledTimes(1)
        expect(replace).toHaveBeenCalledWith({ query: { pid: '7' } })
        // Replaced, not pushed: the way back leads to the overview, not to the wish.
        expect(push).not.toHaveBeenCalled()
      })

      it('leaves the form closed for a member who simply opens the tab', async () => {
        const page = mountPage('entries', shownModal)
        await page.vm.$nextTick()

        expect(formOpen(page)).toBe(false)
        expect(replace).not.toHaveBeenCalled()
      })

      // The query goes with the tab: on the home tab it is not a wish for an entry.
      it.each(['about', 'position'])('does not read the wish on the %s tab', async (tab) => {
        place.query = { new: 'entry' }
        const page = mountPage(tab, shownModal)
        await page.vm.$nextTick()

        expect(formOpen(page)).toBe(false)
        expect(replace).not.toHaveBeenCalled()
      })

      it.each([
        ['another word', { new: 'yes' }],
        ['an empty one', { new: '' }],
        ['the word twice', { new: ['entry', 'entry'] }],
        ['another name', { entry: 'new' }],
      ])('does not take %s for the wish', async (_name, query) => {
        place.query = query
        const page = mountPage('entries', shownModal)
        await page.vm.$nextTick()

        expect(formOpen(page)).toBe(false)
        expect(replace).not.toHaveBeenCalled()
      })

      // Read once. The member closes the form, looks at another tab and comes back: the
      // form stays closed, whatever the address says by then.
      it('does not open the form again after the member closed it', async () => {
        place.query = { new: 'entry' }
        const page = mountPage('entries', shownModal)
        await page.vm.$nextTick()
        await cancel(page).trigger('click')
        expect(formOpen(page)).toBe(false)

        place.tab = 'about'
        await page.vm.$nextTick()
        place.tab = 'entries'
        place.query = { new: 'entry' }
        await page.vm.$nextTick()

        expect(formOpen(page)).toBe(false)
        expect(replace).toHaveBeenCalledTimes(1)
      })

      // A search kept from the map brings words along, and there is one form.
      it('opens with a kept search where there is one, and still clears the address', async () => {
        kept.draft = { summary: 'einen Schlosser', matchingType: 'gesuch' }
        place.query = { new: 'entry' }
        const page = mountPage('entries', shownModal)
        await page.vm.$nextTick()

        expect(formOpen(page)).toBe(true)
        expect(page.find('[data-test="matching-entry-choose"]').exists()).toBe(false)
        expect(page.find('input').element.value).toBe('einen Schlosser')
        expect(replace).toHaveBeenCalledWith({ query: {} })
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

    /**
     * An event link (`/event?interest=…`, utils/eventMatchingLink) hands its entry over with
     * `unlessThere`: the page makes it at once, without the form, and the server says whether
     * it was there already -- then nothing is said at all (KA-014).
     */
    describe('for an entry an event link offers', () => {
      const offered = (over = {}) => ({
        summary: 'Kongress Frequency Healing',
        details: 'Selbstheilung, Biohacking, Longevity',
        remote: true,
        matchingType: 'interesse',
        unlessThere: true,
        ...over,
      })
      const answer = (created, summary = 'Kongress Frequency Healing', uuid = 'made') => ({
        data: { acceptEventMatchingEntry: { created, entry: { uuid, summary } } },
      })
      const list = (...entries) => fire(listMatchingEntries, { listMatchingEntries: entries })
      const refetch = () => handlers.get(listMatchingEntries).refetch
      const told = () => window.localStorage.getItem('own-matching-entries:a-member')
      const sentAt = (call = 0) => mutate.mock.calls[call][0]
      const graphQLRefusal = (message) =>
        Object.assign(new Error(message), { graphQLErrors: [{ message }] })

      it('makes it at once, before the list has answered, and opens no form', async () => {
        kept.draft = offered()
        mutate.mockResolvedValueOnce(answer(true))
        const page = mountPage('entries', shownModal)
        await page.vm.$nextTick()

        expect(mutate).toHaveBeenCalledTimes(1)
        expect(sentAt()).toEqual({
          eventMatchingEntry: {
            summary: 'Kongress Frequency Healing',
            details: 'Selbstheilung, Biohacking, Longevity',
            remote: true,
          },
        })
        expect(formOpen(page)).toBe(false)
      })

      it('sends "found from afar: no" as the link says it, and no details as none', async () => {
        kept.draft = offered({ remote: false, details: '' })
        mountPage('entries', shownModal)
        await flushPromises()

        expect(sentAt().eventMatchingEntry).toEqual({
          summary: 'Kongress Frequency Healing',
          details: null,
          remote: false,
        })
      })

      it('makes it once, however often the list answers', async () => {
        kept.draft = offered()
        mutate.mockResolvedValue(answer(true))
        mountPage('entries', shownModal)
        list()
        list()
        await flushPromises()
        list()

        expect(mutate).toHaveBeenCalledTimes(1)
      })

      describe('where the server made it', () => {
        it('says so with the sentence, as the list shows it', async () => {
          kept.draft = offered()
          mutate.mockResolvedValueOnce(answer(true))
          mountPage('entries', shownModal)
          await flushPromises()

          expect(toast.success).toHaveBeenCalledTimes(1)
          expect(toast.success).toHaveBeenCalledWith(
            'Dein Eintrag ist da: Ich liebe Kongress Frequency Healing',
          )
          expect(toast.error).not.toHaveBeenCalled()
        })

        // The words as the server stored them: trimmed, where the link brought blanks.
        it('says the sentence the server stored', async () => {
          kept.draft = offered({ summary: '  Kongress Frequency Healing ' })
          mutate.mockResolvedValueOnce(answer(true))
          mountPage('entries', shownModal)
          await flushPromises()

          expect(toast.success.mock.calls[0][0]).toBe(
            'Dein Eintrag ist da: Ich liebe Kongress Frequency Healing',
          )
        })

        // The toast writes its message as text; the sentence goes into it as it came.
        it('keeps markup in the sentence as text', async () => {
          kept.draft = offered({ summary: '<b>Kongress</b>' })
          mutate.mockResolvedValueOnce(answer(true, '<b>Kongress</b>'))
          mountPage('entries', shownModal)
          await flushPromises()

          expect(toast.success.mock.calls[0][0]).toBe(
            'Dein Eintrag ist da: Ich liebe <b>Kongress</b>',
          )
        })

        it('fetches the list again, where the entry stands', async () => {
          kept.draft = offered()
          mutate.mockResolvedValueOnce(answer(true))
          mountPage('entries', shownModal)
          await flushPromises()

          expect(refetch()).toHaveBeenCalledTimes(1)
        })

        it('tells the device one entry more at once, where the list came before', async () => {
          kept.draft = offered()
          let made
          mutate.mockReturnValueOnce(new Promise((resolve) => (made = resolve)))
          mountPage('entries', shownModal)
          list()
          expect(told()).toBe('0')

          made(answer(true))
          await flushPromises()

          expect(told()).toBe('1')
        })

        // A list that came after the entry was made counts it already.
        it('tells no more where the list holds the entry already', async () => {
          kept.draft = offered()
          let made
          mutate.mockReturnValueOnce(new Promise((resolve) => (made = resolve)))
          mountPage('entries', shownModal)
          list({ ...entry('made', 'Kongress Frequency Healing', ''), matchingType: 'interest' })
          expect(told()).toBe('1')

          made(answer(true))
          await flushPromises()

          expect(told()).toBe('1')
        })

        // The answer belongs to who opened the link: the member may have signed out by then.
        it('says nothing to whoever is there once the member has signed out', async () => {
          kept.draft = offered()
          let made
          mutate.mockReturnValueOnce(new Promise((resolve) => (made = resolve)))
          mountPage('entries', shownModal)
          list()
          store.state.gradidoID = null

          made(answer(true))
          await flushPromises()

          expect(toast.success).not.toHaveBeenCalled()
          expect(refetch()).not.toHaveBeenCalled()
        })
      })

      describe('where the member had it already', () => {
        it('says nothing, opens nothing, and fetches nothing', async () => {
          kept.draft = offered()
          mutate.mockResolvedValueOnce(answer(false))
          const page = mountPage('entries', shownModal)
          list({ ...entry('b', 'Kongress Frequency Healing', ''), matchingType: 'interest' })
          await flushPromises()

          expect(toast.success).not.toHaveBeenCalled()
          expect(toast.error).not.toHaveBeenCalled()
          expect(formOpen(page)).toBe(false)
          expect(refetch()).not.toHaveBeenCalled()
          expect(told()).toBe('1')
        })

        // The line "you have this one already" is gone: nothing stands above the list.
        it('puts nothing above the list', async () => {
          kept.draft = offered()
          mutate.mockResolvedValueOnce(answer(false))
          const page = mountPage('entries', shownModal)
          list({ ...entry('b', 'Kongress Frequency Healing', ''), matchingType: 'interest' })
          await flushPromises()

          const count = page.find('[data-test="matching-entries-count"]').element.parentElement
          expect(count.nextElementSibling.classList).toContain('bg-white')
        })
      })

      describe('where the server refuses', () => {
        // An account whose address waits for its confirmation: the reminder says what to do.
        it('says nothing to an account that may not make entries yet (401)', async () => {
          kept.draft = offered()
          mutate.mockRejectedValueOnce(graphQLRefusal('401 Unauthorized'))
          const page = mountPage('entries', shownModal)
          await flushPromises()

          expect(toast.error).not.toHaveBeenCalled()
          expect(toast.success).not.toHaveBeenCalled()
          expect(formOpen(page)).toBe(false)
        })

        it('says nothing where the connection failed', async () => {
          kept.draft = offered()
          mutate.mockRejectedValueOnce(
            Object.assign(new Error('Failed to fetch'), { networkError: new TypeError('x') }),
          )
          const page = mountPage('entries', shownModal)
          await flushPromises()

          expect(toast.error).not.toHaveBeenCalled()
          expect(formOpen(page)).toBe(false)
        })

        it('shows the usual red toast for a refusal nobody expects, and opens no form', async () => {
          kept.draft = offered()
          mutate.mockRejectedValueOnce(graphQLRefusal('Invalid length'))
          const page = mountPage('entries', shownModal)
          await flushPromises()

          expect(toast.error).toHaveBeenCalledWith('Invalid length')
          expect(formOpen(page)).toBe(false)
          expect(refetch()).not.toHaveBeenCalled()
        })

        it('keeps that toast from whoever is there once the member has signed out', async () => {
          kept.draft = offered()
          let refused
          mutate.mockReturnValueOnce(new Promise((resolve, reject) => (refused = reject)))
          mountPage('entries', shownModal)
          store.state.gradidoID = null

          refused(graphQLRefusal('Invalid length'))
          await flushPromises()

          expect(toast.error).not.toHaveBeenCalled()
        })
      })

      // The overview's wish for an empty form and the link's entry: the entry is made, no form
      // opens, and the wish still leaves the address.
      it('comes before the wish for an empty form', async () => {
        kept.draft = offered()
        mutate.mockResolvedValueOnce(answer(true))
        place.query = { new: 'entry' }
        const page = mountPage('entries', shownModal)
        await flushPromises()

        expect(mutate).toHaveBeenCalledTimes(1)
        expect(formOpen(page)).toBe(false)
        expect(replace).toHaveBeenCalledWith({ query: {} })
      })

      // A search kept from the map has no `unlessThere`: it opens the form, and makes nothing.
      it('leaves a search kept from the map to the form', async () => {
        kept.draft = { summary: 'einen Schlosser', details: '', matchingType: 'gesuch' }
        const page = mountPage('entries', shownModal)
        await flushPromises()

        expect(formOpen(page)).toBe(true)
        expect(mutate).not.toHaveBeenCalled()
      })
    })

    // The map says nothing about "found from afar", and its search opens at once.
    it('opens a search kept from the map at once, and not found from afar', async () => {
      kept.draft = { summary: 'einen Schlosser', details: 'für alte Türen', matchingType: 'gesuch' }
      const page = mountPage('entries', shownModal)
      await page.vm.$nextTick()
      expect(formOpen(page)).toBe(true)

      await saveButton(page).trigger('click')

      expect(mutate.mock.calls[0][0].input.remote).toBe(false)
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
    // The button of the window that asks before saving. By its mark, not by its word: it
    // says "save" only where the save leaves the member's place on the map alone.
    const confirmButton = (page) => page.find('[data-test="position-save-confirm"]')

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

    // A member who takes themselves off the map is not "saving position settings", and
    // neither is one who comes onto it. The window used to ask both exactly that, and the
    // message afterwards said "location saved" to somebody who had just left (Bernd,
    // 11.10.2026). Now the window says what the save does and its button names the step;
    // the message says what happened. A save that leaves the member's place on the map
    // alone reads as it always did.
    describe('the window before a save, and the message after it', () => {
      const noHome = {
        userLocation: null,
        communityLocation: { latitude: 48.1, longitude: 11.5 },
      }
      // Open windows only, with their title: this is about what they say.
      const spoken = {
        BModal: {
          props: ['modelValue'],
          template:
            '<div v-if="modelValue" class="modal-stub"><slot name="title" /><slot /><slot name="footer" /></div>',
        },
      }
      // Every window whether open or not, to hear what a closing one still says.
      const closingToo = {
        BModal: {
          template:
            '<div class="modal-stub"><slot name="title" /><slot /><slot name="footer" /></div>',
        },
      }
      const LEAVE = {
        title: de.matching.position.leaveTitle,
        text: de.matching.position.leaveText,
        confirm: de.matching.position.leaveGo,
      }
      const JOIN = {
        title: de.matching.position.joinTitle,
        text: de.matching.position.joinText,
        confirm: de.matching.invitation.go,
      }
      const PLAIN = {
        title: de.matching.position.saveTitle,
        text: de.matching.position.saveText,
        confirm: de.matching.save,
      }
      const SAVED = de.settings.GMS.location.updateSuccess
      const NOW_ON = de.matching.position.findableOn
      const NOW_OFF = de.matching.position.findableOff

      const words = (page) => ({
        title: page.find('[data-test="position-save-title"]').text(),
        text: page.find('[data-test="position-save-text"]').text(),
        confirm: confirmButton(page).text(),
      })
      const open = async ({ findable, home = true, stubs = spoken }) => {
        store.state.gmsAllowed = findable
        if (home) store.state.userLocation = { ...location.userLocation }
        const page = mountPage('position', stubs)
        fire(userLocationQuery, { userLocation: home ? location : noHome })
        await page.vm.$nextTick()
        return page
      }
      const flip = async (page, value) => {
        page.findComponent(UserSettingsSwitch).vm.$emit('value-changed', value)
        await page.vm.$nextTick()
      }
      const moveHome = async (page) => {
        page
          .findComponent(UserLocationMapStub)
          .vm.$emit('update:userPosition', { lat: 49, lng: 12 })
        await page.vm.$nextTick()
      }
      const pickApproximate = async (page) => {
        page
          .findComponent({ name: 'UserGMSLocationFormat' })
          .vm.$emit('gmsPublishLocation', 'GMS_LOCATION_TYPE_APPROXIMATE')
        await page.vm.$nextTick()
      }
      const ask = (page) => saveButton(page).trigger('click')
      const confirm = async (page) => {
        await confirmButton(page).trigger('click')
        await flushPromises()
      }

      // The texts themselves, so that no case below compares a word with itself.
      it('has three sets of words that differ in every part', () => {
        for (const part of ['title', 'text', 'confirm']) {
          expect(new Set([LEAVE[part], JOIN[part], PLAIN[part]]).size).toBe(3)
        }
        expect(new Set([SAVED, NOW_ON, NOW_OFF]).size).toBe(3)
      })

      describe('for a member who takes themselves off the map', () => {
        it('says so, and its button names the step', async () => {
          const page = await open({ findable: true })
          await flip(page, false)

          await ask(page)

          expect(words(page)).toEqual(LEAVE)
          // Still beside a way back.
          expect(page.find('[data-test="position-save-cancel"]').text()).toBe(
            de.matching.position.cancel,
          )
          expect(mutate).not.toHaveBeenCalled()
        })

        it('says afterwards that they are no longer on the map, not that a location was saved', async () => {
          const page = await open({ findable: true })
          await flip(page, false)
          await ask(page)

          await confirm(page)

          expect(mutate).toHaveBeenCalledWith({ gmsAllowed: false })
          expect(toast.success).toHaveBeenCalledTimes(1)
          expect(toast.success).toHaveBeenCalledWith(NOW_OFF)
          expect(store.state.gmsAllowed).toBe(false)
          expect(push).not.toHaveBeenCalled()
        })

        // Leaving is the news, whatever else travels with it.
        it('says the same when the home was moved in the same save', async () => {
          const page = await open({ findable: true })
          await moveHome(page)
          await flip(page, false)

          await ask(page)
          expect(words(page)).toEqual(LEAVE)
          await confirm(page)

          expect(mutate).toHaveBeenCalledWith({
            gmsLocation: { latitude: 49, longitude: 12 },
            gmsAllowed: false,
          })
          expect(toast.success).toHaveBeenCalledWith(NOW_OFF)
        })

        // Findable without a home: saved before the server refused it. They can still leave.
        it('says the same to a member who was findable without a home', async () => {
          const page = await open({ findable: true, home: false })
          await flip(page, false)

          await ask(page)

          expect(words(page)).toEqual(LEAVE)
        })
      })

      describe('for a member who comes onto the map', () => {
        it('says so, with the button of the invitation', async () => {
          const page = await open({ findable: false })
          await flip(page, true)

          await ask(page)

          expect(words(page)).toEqual(JOIN)
        })

        it('says afterwards that they are on the map now', async () => {
          const page = await open({ findable: false })
          await flip(page, true)
          await ask(page)

          await confirm(page)

          expect(mutate).toHaveBeenCalledWith({ gmsAllowed: true })
          expect(toast.success).toHaveBeenCalledTimes(1)
          expect(toast.success).toHaveBeenCalledWith(NOW_ON)
          // No yes in the address: they stay on the tab, as before.
          expect(push).not.toHaveBeenCalled()
        })

        // The way the invitation leads: the yes in the address, a home set on the map.
        it('says the same to a member who arrived with the yes and set a home', async () => {
          place.query = { findable: 'yes' }
          const page = await open({ findable: false, home: false })
          await moveHome(page)

          await ask(page)
          expect(words(page)).toEqual(JOIN)
          await confirm(page)

          expect(mutate).toHaveBeenCalledWith({
            gmsLocation: { latitude: 49, longitude: 12 },
            gmsAllowed: true,
          })
          expect(toast.success).toHaveBeenCalledWith(NOW_ON)
          expect(push).toHaveBeenCalledWith('/matching/karte')
        })

        it('says the same when the accuracy changes in the same save', async () => {
          const page = await open({ findable: false })
          await pickApproximate(page)
          await flip(page, true)

          await ask(page)

          expect(words(page)).toEqual(JOIN)
        })
      })

      describe("for a save that leaves the member's place on the map alone", () => {
        it('asks as it always did when a member on the map moves their home', async () => {
          const page = await open({ findable: true })
          await moveHome(page)

          await ask(page)
          expect(words(page)).toEqual(PLAIN)
          await confirm(page)

          expect(mutate).toHaveBeenCalledWith({ gmsLocation: { latitude: 49, longitude: 12 } })
          expect(toast.success).toHaveBeenCalledTimes(1)
          expect(toast.success).toHaveBeenCalledWith(SAVED)
        })

        // A home alone puts nobody on the map, and the message must not say it did.
        it('asks as it always did when a member who is not on the map sets a home', async () => {
          const page = await open({ findable: false, home: false })
          await moveHome(page)

          await ask(page)
          expect(words(page)).toEqual(PLAIN)
          await confirm(page)

          expect(mutate).toHaveBeenCalledWith({ gmsLocation: { latitude: 49, longitude: 12 } })
          expect(toast.success).toHaveBeenCalledWith(SAVED)
          expect(toast.success).not.toHaveBeenCalledWith(NOW_ON)
        })

        it('asks as it always did for the accuracy alone', async () => {
          const page = await open({ findable: true })
          await pickApproximate(page)

          await ask(page)
          expect(words(page)).toEqual(PLAIN)
          await confirm(page)

          expect(mutate).toHaveBeenCalledWith({
            gmsPublishLocation: 'GMS_LOCATION_TYPE_APPROXIMATE',
          })
          expect(toast.success).toHaveBeenCalledWith(SAVED)
        })

        // Off and on again is no change: the switch is where it was saved.
        it('asks as it always did when the switch was flipped and flipped back', async () => {
          const page = await open({ findable: true })
          await moveHome(page)
          await flip(page, false)
          await flip(page, true)

          await ask(page)
          expect(words(page)).toEqual(PLAIN)
          await confirm(page)

          expect(mutate).toHaveBeenCalledWith({ gmsLocation: { latitude: 49, longitude: 12 } })
          expect(toast.success).toHaveBeenCalledWith(SAVED)
        })
      })

      // The answer to the save clears the drafts, and it arrives while the window is still
      // on its way off the screen. Read live, the window would change its title back to
      // "save position" as it goes.
      it('keeps its words while it closes, and has the right ones the next time', async () => {
        const page = await open({ findable: true, stubs: closingToo })
        await flip(page, false)
        await ask(page)
        expect(words(page)).toEqual(LEAVE)

        await confirm(page)
        expect(store.state.gmsAllowed).toBe(false)
        expect(words(page)).toEqual(LEAVE)

        await moveHome(page)
        await ask(page)
        expect(words(page)).toEqual(PLAIN)
      })

      it('has the right words after a window that was called off', async () => {
        const page = await open({ findable: true })
        await flip(page, false)
        await ask(page)
        expect(words(page)).toEqual(LEAVE)
        await page.find('[data-test="position-save-cancel"]').trigger('click')
        expect(confirmButton(page).exists()).toBe(false)
        expect(mutate).not.toHaveBeenCalled()

        // Thought better of it, and moved the home instead.
        await flip(page, true)
        await moveHome(page)
        await ask(page)

        expect(words(page)).toEqual(PLAIN)
      })

      it('says nothing of the kind when the save fails', async () => {
        mutate.mockRejectedValueOnce(new Error('the server is away'))
        const page = await open({ findable: true })
        await flip(page, false)
        await ask(page)

        await confirm(page)

        expect(toast.success).not.toHaveBeenCalled()
        expect(toast.error).toHaveBeenCalledWith('the server is away')
        // Nothing was saved: still on the map, and the draft still stands.
        expect(store.state.gmsAllowed).toBe(true)
        expect(saveButton(page).attributes('disabled')).toBeUndefined()
      })

      // The browser's back button gets to another tab with the window open. Leaving the tab
      // drops the drafts, and a button that names a step would then do nothing.
      it('goes with the tab it asks about', async () => {
        const page = await open({ findable: true })
        await flip(page, false)
        await ask(page)
        expect(confirmButton(page).exists()).toBe(true)

        place.tab = 'entries'
        await page.vm.$nextTick()

        expect(confirmButton(page).exists()).toBe(false)
        expect(mutate).not.toHaveBeenCalled()
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
        await confirmButton(page).trigger('click')
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

    // A member who pressed "show me on the map" - on the overview's tile or in the window
    // behind the find button - arrives having said yes (Bernd, 11.10.2026). The switch says
    // so, nothing is saved by arriving, and after saving the map is where they go.
    describe('for a member who arrives to be shown on the map', () => {
      const noHome = {
        userLocation: null,
        communityLocation: { latitude: 48.1, longitude: 11.5 },
      }
      const confirmOnly = {
        BModal: {
          props: ['modelValue'],
          template:
            '<div v-if="modelValue" class="modal-stub"><slot /><slot name="footer" /></div>',
        },
      }
      const findableSwitch = (page) => page.findComponent(UserSettingsSwitch)
      const hint = (page) => page.find('.border-top .text-end.small').text()
      const pickHome = async (page) => {
        page
          .findComponent(UserLocationMapStub)
          .vm.$emit('update:userPosition', { lat: 49, lng: 12 })
        await page.vm.$nextTick()
      }
      const saveAndConfirm = async (page) => {
        await saveButton(page).trigger('click')
        await confirmButton(page).trigger('click')
      }
      const arrive = async ({ home, findable = false, yes = true, stubs = {}, options = {} }) => {
        store.state.gmsAllowed = findable
        place.query = yes ? { findable: 'yes' } : {}
        const page = mountPage('position', { ...confirmOnly, ...stubs }, options)
        fire(userLocationQuery, { userLocation: home ? location : noHome })
        await page.vm.$nextTick()
        return page
      }

      it('stands the switch on, and saves nothing by arriving', async () => {
        const page = await arrive({ home: false })

        expect(findableSwitch(page).props('initialValue')).toBe(true)
        // On is never held; what is missing stands beneath it, and save waits for it.
        expect(findableSwitch(page).props('locked')).toBe(false)
        expect(hint(page)).toBe(de.matching.position.needsHome)
        expect(saveButton(page).attributes('disabled')).toBeDefined()
        expect(mutate).not.toHaveBeenCalled()
        expect(push).not.toHaveBeenCalled()
      })

      it('saves the home and the yes together, and then opens the map', async () => {
        const page = await arrive({ home: false })
        await pickHome(page)
        expect(saveButton(page).attributes('disabled')).toBeUndefined()

        await saveAndConfirm(page)
        await flushPromises()

        expect(mutate).toHaveBeenCalledTimes(1)
        expect(mutate).toHaveBeenCalledWith({
          gmsLocation: { latitude: 49, longitude: 12 },
          gmsAllowed: true,
        })
        expect(push).toHaveBeenCalledTimes(1)
        expect(push).toHaveBeenCalledWith('/matching/karte')
      })

      // The yes is the member's to take back: with the switch off again, only a home is
      // saved, and somebody who is not on the map has no business being carried onto it.
      it('stays on the tab for a member who switched it back off before saving', async () => {
        const page = await arrive({ home: false })
        await pickHome(page)
        findableSwitch(page).vm.$emit('value-changed', false)
        await page.vm.$nextTick()

        await saveAndConfirm(page)
        await flushPromises()

        expect(mutate).toHaveBeenCalledWith({ gmsLocation: { latitude: 49, longitude: 12 } })
        expect(toast.success).toHaveBeenCalled()
        expect(push).not.toHaveBeenCalled()
      })

      // Read after the answer: a save can take a while, and whoever has gone to another tab
      // in the meantime is no longer asking for the map.
      it('does not follow a member who moved on while the save was under way', async () => {
        let answerSave
        mutate.mockReturnValueOnce(
          new Promise((resolve) => {
            answerSave = resolve
          }),
        )
        const page = await arrive({ home: false })
        await pickHome(page)
        await saveAndConfirm(page)

        place.tab = 'entries'
        place.query = {}
        await page.vm.$nextTick()
        answerSave({})
        await flushPromises()

        // Saved all the same - only the journey is no longer theirs.
        expect(store.state.gmsAllowed).toBe(true)
        expect(push).not.toHaveBeenCalled()
      })

      // What save sends is what the three controls showed when it was pressed, and its answer
      // replaces the drafts: a pick in between was measured against the old state and thrown
      // away. "Off", tapped in that moment, was saved as on, and the member carried onto the
      // map (coderabbit on #4124). So the map, the accuracy and the switch are held until
      // the answer is in. jsdom does not act on `inert`; what it does to a tap is measured
      // in the built wallet.
      describe('while the save is under way', () => {
        // jsdom has no `inert` property, so Vue writes the attribute with the value as
        // text: "true" or "false". A browser gets the property, and the attribute only
        // while it holds. Read so that both count.
        const held = (page) =>
          page.findAll('[data-test="position-control"]').map((control) => {
            const inert = control.attributes('inert')
            return inert !== undefined && inert !== 'false'
          })
        const holdSave = () => {
          const answers = {}
          mutate.mockReturnValueOnce(
            new Promise((resolve, reject) => {
              answers.arrive = resolve
              answers.fail = reject
            }),
          )
          return answers
        }

        it('holds the three controls, and lets go of them with the answer', async () => {
          const save = holdSave()
          const page = await arrive({ home: false })
          await pickHome(page)
          expect(held(page)).toEqual([false, false, false])

          await saveAndConfirm(page)
          expect(held(page)).toEqual([true, true, true])

          save.arrive({})
          await flushPromises()
          expect(held(page)).toEqual([false, false, false])
          expect(push).toHaveBeenCalledWith('/matching/karte')
        })

        it('lets go of them when the save fails, too', async () => {
          const save = holdSave()
          const page = await arrive({ home: false })
          await pickHome(page)
          await saveAndConfirm(page)
          expect(held(page)).toEqual([true, true, true])

          save.fail(new Error('the server is away'))
          await flushPromises()

          expect(held(page)).toEqual([false, false, false])
          expect(toast.error).toHaveBeenCalledWith('the server is away')
          // Nothing was saved, so the draft still stands and can be sent again.
          expect(findableSwitch(page).props('initialValue')).toBe(true)
          expect(saveButton(page).attributes('disabled')).toBeUndefined()
        })

        // The save button is not held - the confirm window hands the focus back to it.
        it('sends nothing a second time for a second confirm', async () => {
          const save = holdSave()
          const page = await arrive({ home: false })
          await pickHome(page)
          await saveAndConfirm(page)

          await saveAndConfirm(page)
          expect(mutate).toHaveBeenCalledTimes(1)

          save.arrive({})
          await flushPromises()
          expect(mutate).toHaveBeenCalledTimes(1)
          expect(push).toHaveBeenCalledTimes(1)
        })
      })

      it('leaves a member alone who is on the map already', async () => {
        store.state.userLocation = { ...location.userLocation }
        const page = await arrive({ home: true, findable: true })

        expect(findableSwitch(page).props('initialValue')).toBe(true)
        // Nothing armed: the yes says what the server holds anyway.
        expect(saveButton(page).attributes('disabled')).toBeDefined()
        expect(page.text()).not.toContain(de.matching.position.unsaved)
      })

      // The other side of the rule: the map opens for the yes, not for every save. Somebody
      // who came to this tab on their own and switches findable on stays where they are.
      it('does not open the map after a save that came without the yes', async () => {
        const page = await arrive({ home: true, yes: false })
        expect(findableSwitch(page).props('initialValue')).toBe(false)
        findableSwitch(page).vm.$emit('value-changed', true)
        await page.vm.$nextTick()

        await saveAndConfirm(page)
        await flushPromises()

        expect(mutate).toHaveBeenCalledWith({ gmsAllowed: true })
        expect(store.state.gmsAllowed).toBe(true)
        expect(push).not.toHaveBeenCalled()
      })

      // The yes belongs to the home tab's address. Typed onto another tab it is nothing,
      // and it must not wait there as a draft for the moment the member comes over.
      it('ignores the yes on another tab', async () => {
        store.state.gmsAllowed = false
        place.query = { findable: 'yes' }
        const page = mountPage('entries', confirmOnly)
        fire(userLocationQuery, { userLocation: location })
        await page.vm.$nextTick()

        place.tab = 'position'
        place.query = {}
        await page.vm.$nextTick()

        expect(findableSwitch(page).props('initialValue')).toBe(false)
        expect(saveButton(page).attributes('disabled')).toBeDefined()
      })

      // The wire to the real switch, which the cases above cannot see: they stub it and
      // read what it was handed. It shows the draft now, in both directions.
      it('shows the yes on the real switch, and lets the member take it back', async () => {
        const page = await arrive({
          home: true,
          stubs: { UserSettingsSwitch: false },
          options: { attachTo: document.body },
        })
        const input = findableSwitch(page).find('input')
        expect(input.element.checked).toBe(true)
        expect(saveButton(page).attributes('disabled')).toBeUndefined()

        await input.trigger('click')

        expect(input.element.checked).toBe(false)
        expect(saveButton(page).attributes('disabled')).toBeDefined()

        await input.trigger('click')

        expect(input.element.checked).toBe(true)
        expect(saveButton(page).attributes('disabled')).toBeUndefined()
      })
    })
  })
})

/**
 * The colour of text that stands on the page itself, without one of its own: the colour of the
 * mode (`--text`, _design-tokens.scss and gradido-template-dark.scss). It stood here as the
 * light value alone, and every such text was dark on the dark ground until it was patched
 * where it showed (measured in the built wallet, 14.10.2026). A test of the component cannot
 * see a colour, so this holds the rule.
 */
describe('the text colour of the matching page', () => {
  const here = dirname(fileURLToPath(import.meta.url))
  const rule = (() => {
    const source = readFileSync(join(here, 'Matching.vue'), 'utf8')
    const [, style] = source.match(/<style[^>]*>([\s\S]*?)<\/style>/) ?? []
    const [, body] = (style ?? '').match(/\.matching-page \{([^}]*)\}/) ?? []
    // The comment says why, and names the colour it replaced.
    return body?.replace(/\/\*[\s\S]*?\*\//g, '')
  })()

  it('is the colour of the mode, not a colour of its own', () => {
    // The fixture has to prove itself: no rule would compare nothing with nothing.
    expect(rule).toBeDefined()
    expect(rule).toMatch(/color: var\(--text\);/)
    expect(rule).not.toMatch(/#[0-9a-f]{3,8}/i)
  })
})
