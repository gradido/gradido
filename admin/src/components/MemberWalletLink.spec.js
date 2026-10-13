// AI-GENERATED — not an architecture reference

import { config, flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { createStore } from 'vuex'
import { DefaultApolloClient } from '@vue/apollo-composable'
import MemberWalletLink from './MemberWalletLink.vue'
import CONFIG from '@/config'
import { verifyLogin } from '@/graphql/verifyLogin'
import de from '@/locales/de.json'
import en from '@/locales/en.json'

const mockToastWarning = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastWarning: mockToastWarning }),
}))

// A token as the server issues it, and one made of everything an address would trip over: the
// second is no token the server would issue, it is here to show that the address carries
// whatever the store holds, unharmed.
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJncmFkaWRvSUQiOiJ4In0.b-_c'
const AWKWARD_TOKEN = 'a+b/c=d&e?f#g h'

const BIBI = {
  gradidoID: '1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d',
  communityUuid: '9f8e7d6c-5b4a-4c3d-9e2f-1a0b9c8d7e6f',
  findableOnMap: true,
}
const BOB = {
  gradidoID: '7a6b5c4d-3e2f-4a1b-8c0d-9e8f7a6b5c4d',
  communityUuid: BIBI.communityUuid,
  findableOnMap: true,
}
// A member who does not stand on the map, as a row of the member search carries them.
const RAEUBER = {
  userId: 3,
  gradidoID: '3c2b1a09-8f7e-4d6c-b5a4-938271605f4e',
  communityUuid: BIBI.communityUuid,
  findableOnMap: false,
  deletedAt: null,
}

describe('MemberWalletLink', () => {
  let store
  let client
  let warnings
  let opened

  // The setup of the specs installs an i18n that knows two words. This spec reads the sentences
  // of the admin interface itself, so each mount brings its own -- and the other one is taken
  // out for this file: two of them side by side register every component twice.
  beforeAll(() => {
    config.global.plugins = []
  })

  const sentences = (locale) => createI18n({ legacy: false, locale, messages: { de, en } })

  const createWrapper = ({ member = BIBI, name = 'bibi', locale = 'en', plugins, provide } = {}) =>
    mount(MemberWalletLink, {
      props: { member, name },
      global: {
        plugins: plugins ?? [sentences(locale), store],
        provide: provide ?? { [DefaultApolloClient]: client },
        // The specs resolve no icons (vitest.config.js).
        stubs: { IBiGeoAltFill: true, IBiSend: true },
        config: { warnHandler: (warning) => warnings.push(warning) },
      },
    })

  const pinOf = (wrapper) => wrapper.find('[data-test="member-map-pin"]')
  const arrowOf = (wrapper) => wrapper.find('[data-test="member-send-arrow"]')

  // The address the window was opened on, taken apart the way the wallet's router reads it.
  const openedAddress = (call = 0) => new URL(window.open.mock.calls[call][0])

  beforeEach(() => {
    vi.clearAllMocks()
    warnings = []
    store = createStore({
      state: { token: TOKEN },
      mutations: { token: (state, token) => (state.token = token) },
      actions: { logout: vi.fn() },
    })
    vi.spyOn(store, 'dispatch')
    client = { query: vi.fn().mockResolvedValue({ data: { verifyLogin: {} } }) }
    opened = { focus: vi.fn() }
    vi.spyOn(window, 'open').mockReturnValue(opened)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.name = ''
  })

  describe('a member who does not stand on the map', () => {
    it.each([
      ['whose row says no', { ...BIBI, findableOnMap: false }],
      ['whose row says nothing', { ...BIBI, findableOnMap: null }],
      [
        'whose row was never asked',
        { gradidoID: BIBI.gradidoID, communityUuid: BIBI.communityUuid },
      ],
      // Only the server's yes is a yes.
      ['whose row holds something else', { ...BIBI, findableOnMap: 'true' }],
      ['who is not there at all', null],
    ])('gets no pin: one %s', (_name, member) => {
      expect(pinOf(createWrapper({ member })).exists()).toBe(false)
    })

    // ⛔ The arrow says "not on the map", and only the server can say that. A document that does
    // not ask for the field delivers nothing -- and an arrow behind every name would then say it
    // of members who stand there.
    it.each([
      ['whose row says nothing', { ...RAEUBER, findableOnMap: null }],
      ['whose row was never asked', { ...RAEUBER, findableOnMap: undefined }],
      ['whose row holds something else', { ...RAEUBER, findableOnMap: 'false' }],
      ['whose row holds a zero', { ...RAEUBER, findableOnMap: 0 }],
      ['who is not there at all', null],
    ])('gets nothing at all where the server did not say no: one %s', (_name, member) => {
      const wrapper = createWrapper({ member })
      expect(wrapper.find('button').exists()).toBe(false)
    })

    it('gets the arrow of the send form where the server says no, and no pin beside it', () => {
      const wrapper = createWrapper({ member: RAEUBER, name: 'raeuber' })
      const arrow = arrowOf(wrapper)

      expect(arrow.exists()).toBe(true)
      expect(arrow.element.tagName).toBe('BUTTON')
      expect(arrow.attributes('type')).toBe('button')
      expect(wrapper.findAll('button')).toHaveLength(1)
    })

    it('names the member in its label and its tooltip', () => {
      const arrow = arrowOf(createWrapper({ member: RAEUBER, name: 'raeuber' }))
      expect(arrow.attributes('aria-label')).toBe('Send to raeuber')
      expect(arrow.attributes('title')).toBe('Send to raeuber')
    })

    it('names them in the language of the moderator', () => {
      const arrow = arrowOf(createWrapper({ member: RAEUBER, name: 'raeuber', locale: 'de' }))
      expect(arrow.attributes('aria-label')).toBe('An raeuber senden')
    })

    it('keeps the icon out of what a screen reader reads', () => {
      const arrow = arrowOf(createWrapper({ member: RAEUBER }))
      expect(arrow.find('i-bi-send-stub').attributes('aria-hidden')).toBe('true')
    })

    // The member under a contribution carries their number as `id`, a row of the search as
    // `userId`, and neither carries a word about a deletion where there was none.
    it('gets it as the member under a contribution, too', () => {
      const { userId, deletedAt, ...rest } = RAEUBER
      const wrapper = createWrapper({ member: { ...rest, id: userId } })
      expect(arrowOf(wrapper).exists()).toBe(true)
    })

    describe('but to whom nothing can be sent', () => {
      it('gets no arrow where the account was deleted', () => {
        const wrapper = createWrapper({
          member: { ...RAEUBER, deletedAt: '2026-10-12T16:08:33.000Z' },
        })
        expect(wrapper.find('button').exists()).toBe(false)
      })

      it.each([
        ['no member id', { gradidoID: null }],
        ['an empty member id', { gradidoID: '' }],
        ['no community', { communityUuid: null }],
        ['an empty community', { communityUuid: '' }],
      ])('gets no arrow where the row names them by %s', (_name, missing) => {
        const wrapper = createWrapper({ member: { ...RAEUBER, ...missing } })
        expect(wrapper.find('button').exists()).toBe(false)
      })

      // Nobody sends to themselves: the wallet's form would take the moderator for the
      // recipient, and the server would refuse the transfer.
      describe('or who is the moderator', () => {
        const signedInAs = (id) =>
          createStore({ state: { token: TOKEN, moderator: { id, role: 'ADMIN' } } })

        it.each([
          ['on their row of the member search', { ...RAEUBER, userId: 3 }],
          ['under a contribution of their own', { ...RAEUBER, userId: undefined, id: 3 }],
        ])('gets no arrow %s', (_name, member) => {
          const wrapper = createWrapper({ member, plugins: [sentences('en'), signedInAs(3)] })
          expect(wrapper.find('button').exists()).toBe(false)
        })

        it.each([
          ['on the row of somebody else', { ...RAEUBER, userId: 4 }],
          ['under the contribution of somebody else', { ...RAEUBER, userId: undefined, id: 4 }],
        ])('gets it %s', (_name, member) => {
          const wrapper = createWrapper({ member, plugins: [sentences('en'), signedInAs(3)] })
          expect(arrowOf(wrapper).exists()).toBe(true)
        })

        // A moderator whose number is not known yet is nobody's row: 0 is no member, and a
        // member without a number is not the moderator without one.
        it.each([
          ['a store that does not know the moderator', createStore({ state: { token: TOKEN } })],
          ['a moderator without a number', signedInAs(undefined)],
        ])('gets it with %s', (_name, aStore) => {
          const { userId, ...withoutNumber } = RAEUBER
          const wrapper = createWrapper({
            member: withoutNumber,
            plugins: [sentences('en'), aStore],
          })
          expect(arrowOf(wrapper).exists()).toBe(true)
        })
      })
    })

    // A member who stands on the map is reached over the map, and gets the pin alone.
    it('is never drawn beside a pin', () => {
      const wrapper = createWrapper({ member: { ...RAEUBER, findableOnMap: true } })
      expect(pinOf(wrapper).exists()).toBe(true)
      expect(arrowOf(wrapper).exists()).toBe(false)
      expect(wrapper.findAll('button')).toHaveLength(1)
    })
  })

  describe('the arrow, pressed', () => {
    const press = (overrides = {}) =>
      arrowOf(createWrapper({ member: RAEUBER, name: 'raeuber', ...overrides })).trigger('click')

    it('opens the wallet in the window the pin opens, at the same size', async () => {
      await press()

      expect(window.open).toHaveBeenCalledTimes(1)
      const [, name, features] = window.open.mock.calls[0]
      expect(name).toBe('gradido-wallet-map')
      expect(features).toBe('popup,width=1000,height=760')
      expect(opened.focus).toHaveBeenCalledTimes(1)
    })

    it('hands the sign-in over and names the send form to this member as the page to go on to', async () => {
      await press()

      const address = openedAddress()
      expect(address.origin + address.pathname + '?token=').toBe(CONFIG.WALLET_AUTH_URL)
      expect([...address.searchParams.keys()]).toEqual(['token', 'redirect'])
      expect(address.searchParams.get('token')).toBe(TOKEN)
      // The route of the wallet's send form: the community first, then the member.
      expect(address.searchParams.get('redirect')).toBe(
        `/send/${RAEUBER.communityUuid}/${RAEUBER.gradidoID}#send-form`,
      )
    })

    // In a window of 760 px the send page begins with the moderator's own accounts: the form,
    // with the member in it, stood below the fold. The wallet scrolls to the hash of an
    // address, and its form carries this id (TransactionForm.vue).
    it('asks the wallet to show the form itself', async () => {
      await press()
      const page = new URL(openedAddress().searchParams.get('redirect'), 'https://wallet.example')
      expect(page.hash).toBe('#send-form')
    })

    // The pair is two uuids. The address carries whatever the row holds all the same: a
    // character that means something in an address must not add a part to the path, cut it
    // short or slip a parameter in.
    it('names the member by the pair as it is, whatever it is made of', async () => {
      const awkward = { ...RAEUBER, gradidoID: 'a&b=c d#e', communityUuid: 'x/y?z+1&with=bob' }
      await press({ member: awkward })

      const address = openedAddress()
      expect([...address.searchParams.keys()]).toEqual(['token', 'redirect'])
      const page = new URL(address.searchParams.get('redirect'), address.origin)
      expect(page.search).toBe('')
      expect(page.hash).toBe('#send-form')
      const parts = page.pathname.split('/')
      expect(parts).toHaveLength(4)
      expect(parts[1]).toBe('send')
      expect(decodeURIComponent(parts[2])).toBe(awkward.communityUuid)
      expect(decodeURIComponent(parts[3])).toBe(awkward.gradidoID)
    })

    it('takes the token the store holds when it is pressed', async () => {
      const wrapper = createWrapper({ member: RAEUBER })
      store.commit('token', 'a-newer-token')
      await arrowOf(wrapper).trigger('click')
      expect(openedAddress().searchParams.get('token')).toBe('a-newer-token')
    })

    it('takes the name of that window off its own before it opens it', async () => {
      window.name = 'gradido-wallet-map'
      let ownNameAtTheOpening
      window.open.mockImplementation(() => {
        ownNameAtTheOpening = window.name
        return opened
      })

      await press()

      expect(ownNameAtTheOpening).toBe('')
    })

    it('asks about the sign-in of the admin interface, after the window is open', async () => {
      const order = []
      window.open.mockImplementation(() => {
        order.push('window')
        return opened
      })
      client.query.mockImplementation(() => {
        order.push('question')
        return Promise.resolve({ data: { verifyLogin: {} } })
      })
      await press()

      expect(order).toEqual(['window', 'question'])
      expect(client.query).toHaveBeenCalledWith({ query: verifyLogin, fetchPolicy: 'no-cache' })
    })

    it('does not sign the moderator out of the admin interface', async () => {
      await press()

      expect(store.dispatch).not.toHaveBeenCalled()
      expect(store.state.token).toBe(TOKEN)
      expect(mockToastWarning).not.toHaveBeenCalled()
    })

    it('says so where the browser keeps the window from opening', async () => {
      window.open.mockReturnValue(null)
      await press()

      expect(mockToastWarning).toHaveBeenCalledTimes(1)
      expect(mockToastWarning).toHaveBeenCalledWith(
        'The browser blocked the window. Please allow pop-ups for this site.',
      )
      expect(client.query).toHaveBeenCalledTimes(1)
    })

    // One window for the map and the send form: the pin of the next member shows the map in
    // the window the arrow opened.
    it('shares its window with the pin', async () => {
      await press()
      await pinOf(createWrapper({ member: BIBI })).trigger('click')

      expect(window.open).toHaveBeenCalledTimes(2)
      expect(window.open.mock.calls[1][1]).toBe(window.open.mock.calls[0][1])
      expect(openedAddress(1).searchParams.get('redirect')).toBe(
        `/matching/karte?with=${BIBI.gradidoID}&community=${BIBI.communityUuid}`,
      )
    })
  })

  describe('a member who stands on the map', () => {
    it('gets a pin that is a button and no submit of a form around it', () => {
      const pin = pinOf(createWrapper())
      expect(pin.exists()).toBe(true)
      expect(pin.element.tagName).toBe('BUTTON')
      expect(pin.attributes('type')).toBe('button')
    })

    it('names the member in its label and its tooltip', () => {
      const pin = pinOf(createWrapper({ name: 'bibi' }))
      expect(pin.attributes('aria-label')).toBe('Show bibi on the map')
      expect(pin.attributes('title')).toBe('Show bibi on the map')
    })

    it('names them in the language of the moderator', () => {
      const pin = pinOf(createWrapper({ name: 'bibi', locale: 'de' }))
      expect(pin.attributes('aria-label')).toBe('bibi auf der Karte zeigen')
    })

    it('keeps the icon out of what a screen reader reads', () => {
      const pin = pinOf(createWrapper())
      expect(pin.find('i-bi-geo-alt-fill-stub').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('pressed', () => {
    it('opens the wallet in one named window of its own, sized for the map', async () => {
      await pinOf(createWrapper()).trigger('click')

      expect(window.open).toHaveBeenCalledTimes(1)
      const [, name, features] = window.open.mock.calls[0]
      expect(name).toBe('gradido-wallet-map')
      expect(features).toBe('popup,width=1000,height=760')
    })

    it('hands the sign-in over the way the wallet takes it, and names the map as the page to go on to', async () => {
      await pinOf(createWrapper()).trigger('click')

      const address = openedAddress()
      // The hand-over of "Mein Konto": WALLET_AUTH_URL ends on `?token=`.
      expect(CONFIG.WALLET_AUTH_URL.endsWith('?token=')).toBe(true)
      expect(address.origin + address.pathname + '?token=').toBe(CONFIG.WALLET_AUTH_URL)
      expect([...address.searchParams.keys()]).toEqual(['token', 'redirect'])
      expect(address.searchParams.get('token')).toBe(TOKEN)
      // What the wallet's guard reads as `redirect`: the map, on this member by their pair.
      expect(address.searchParams.get('redirect')).toBe(
        `/matching/karte?with=${BIBI.gradidoID}&community=${BIBI.communityUuid}`,
      )
    })

    it('carries the token as it is, whatever it is made of', async () => {
      store.commit('token', AWKWARD_TOKEN)
      await pinOf(createWrapper()).trigger('click')

      const address = openedAddress()
      expect([...address.searchParams.keys()]).toEqual(['token', 'redirect'])
      expect(address.searchParams.get('token')).toBe(AWKWARD_TOKEN)
    })

    // The pair is two uuids. The address carries whatever the row holds all the same: a
    // character that means something in an address must not cut the member's name short or
    // slip a parameter of its own in.
    it('names the member by the pair as it is, whatever it is made of', async () => {
      const awkward = { ...BIBI, gradidoID: 'a&b=c d#e', communityUuid: 'x/y?z+1&with=bob' }
      await pinOf(createWrapper({ member: awkward })).trigger('click')

      const address = openedAddress()
      expect([...address.searchParams.keys()]).toEqual(['token', 'redirect'])
      // The page to go on to, read the way the wallet's router reads an address of its own.
      const page = new URL(address.searchParams.get('redirect'), address.origin)
      expect(page.pathname).toBe('/matching/karte')
      expect([...page.searchParams.keys()]).toEqual(['with', 'community'])
      expect(page.searchParams.get('with')).toBe(awkward.gradidoID)
      expect(page.searchParams.get('community')).toBe(awkward.communityUuid)
    })

    // The token is renewed with every answer of the server: the one in the store at the
    // press is the one that counts, not the one the pin was drawn with.
    it('takes the token the store holds when it is pressed', async () => {
      const wrapper = createWrapper()
      store.commit('token', 'a-newer-token')
      await pinOf(wrapper).trigger('click')
      expect(openedAddress().searchParams.get('token')).toBe('a-newer-token')
    })

    it('brings the window to the front', async () => {
      await pinOf(createWrapper()).trigger('click')
      expect(opened.focus).toHaveBeenCalledTimes(1)
    })

    // ⛔ Bernd, 13.10.2026: "the click switches to the wallet, and the admin interface is gone."
    // He had come back from the map through the wallet's menu entry "Admin", which takes the
    // window it is clicked in to the admin interface -- so the admin interface ran in the window
    // that carries the map's name, and the pin named its own window as the one to open.
    describe('in an admin interface that runs in the window named for the map', () => {
      it('takes that name off its own window before it opens the map', async () => {
        window.name = 'gradido-wallet-map'
        let ownNameAtTheOpening
        window.open.mockImplementation(() => {
          ownNameAtTheOpening = window.name
          return opened
        })

        await pinOf(createWrapper()).trigger('click')

        expect(ownNameAtTheOpening).toBe('')
        // The window it asks for is still the one named for the map: a window of its own now.
        expect(window.open.mock.calls[0][1]).toBe('gradido-wallet-map')
      })

      it('leaves a window alone that carries another name', async () => {
        window.name = 'my-admin'
        await pinOf(createWrapper()).trigger('click')
        expect(window.name).toBe('my-admin')
      })
    })

    it('opens the next member in the same window', async () => {
      await pinOf(createWrapper({ member: BIBI })).trigger('click')
      await pinOf(createWrapper({ member: BOB, name: 'bob' })).trigger('click')

      expect(window.open).toHaveBeenCalledTimes(2)
      expect(window.open.mock.calls[1][1]).toBe(window.open.mock.calls[0][1])
      expect(openedAddress(1).searchParams.get('redirect')).toBe(
        `/matching/karte?with=${BOB.gradidoID}&community=${BOB.communityUuid}`,
      )
    })

    // ⛔ Unlike "Mein Konto" in the top bar, which leaves for the wallet and signs the admin
    // interface out: the moderator goes on working here, the window is a look at the map.
    it('does not sign the moderator out of the admin interface', async () => {
      await pinOf(createWrapper()).trigger('click')

      expect(store.dispatch).not.toHaveBeenCalled()
      expect(store.state.token).toBe(TOKEN)
    })

    it('says nothing where the window opened', async () => {
      await pinOf(createWrapper()).trigger('click')
      expect(mockToastWarning).not.toHaveBeenCalled()
    })

    // ⛔ A sign-in lasts ten minutes from the server's last answer, and a press asks the server
    // nothing by itself. A moderator going through a list pin by pin would hold a token that
    // grows old, and after ten minutes every press would sign the wallet in the window out.
    describe('and the sign-in of the admin interface', () => {
      it('is asked about once, so that the server renews it: nothing kept, nobody named', async () => {
        await pinOf(createWrapper()).trigger('click')

        expect(client.query).toHaveBeenCalledTimes(1)
        expect(client.query).toHaveBeenCalledWith({ query: verifyLogin, fetchPolicy: 'no-cache' })
      })

      // The window is handed the token held at the press, and has to be opened while the press
      // is still the browser's reason to allow it.
      it('is asked about after the window is open', async () => {
        const order = []
        window.open.mockImplementation(() => {
          order.push('window')
          return opened
        })
        client.query.mockImplementation(() => {
          order.push('question')
          return Promise.resolve({ data: { verifyLogin: {} } })
        })
        await pinOf(createWrapper()).trigger('click')

        expect(order).toEqual(['window', 'question'])
      })

      it('is asked about at every press', async () => {
        const pin = pinOf(createWrapper())
        await pin.trigger('click')
        await pin.trigger('click')
        expect(client.query).toHaveBeenCalledTimes(2)
      })

      // Where the sign-in ran out, the answer says so and the admin interface signs out by
      // itself (plugins/apolloProvider.js). The pin leaves that, and every other failure,
      // alone: no word, no sign-out of its own, and no rejection left without a handler.
      //
      // ⛔ The rejection comes from a plain function and a promise of its own. Vitest follows
      // every promise a mock returns to note how it settled, and that counts as handling it:
      // with `mockRejectedValue` a pin without its `catch` went through here unnoticed.
      it.each([
        ['a sign-in that ran out', new Error('403.13 - Client certificate revoked')],
        ['a server that does not answer', new TypeError('Failed to fetch')],
      ])('leaves %s to the admin interface', async (_name, failure) => {
        const unhandled = vi.fn()
        process.on('unhandledRejection', unhandled)
        try {
          let asked = 0
          client.query = () => {
            asked++
            return Promise.reject(failure)
          }
          await pinOf(createWrapper()).trigger('click')
          await flushPromises()
          // An unhandled rejection is reported after the microtasks of its turn.
          await new Promise((resolve) => setTimeout(resolve, 10))

          expect(asked).toBe(1)
          expect(unhandled).not.toHaveBeenCalled()
        } finally {
          process.off('unhandledRejection', unhandled)
        }
        expect(opened.focus).toHaveBeenCalledTimes(1)
        expect(mockToastWarning).not.toHaveBeenCalled()
        expect(store.dispatch).not.toHaveBeenCalled()
      })
    })
  })

  describe('where the browser keeps the window from opening', () => {
    beforeEach(() => {
      window.open.mockReturnValue(null)
    })

    it('says so, and what to do about it', async () => {
      await pinOf(createWrapper()).trigger('click')

      expect(mockToastWarning).toHaveBeenCalledTimes(1)
      expect(mockToastWarning).toHaveBeenCalledWith(
        'The browser blocked the window. Please allow pop-ups for this site.',
      )
    })

    it('says it in the language of the moderator', async () => {
      await pinOf(createWrapper({ locale: 'de' })).trigger('click')
      expect(mockToastWarning).toHaveBeenCalledWith(
        'Der Browser hat das Fenster blockiert. Bitte Pop-ups für diese Seite erlauben.',
      )
    })

    it('still signs nobody out', async () => {
      await pinOf(createWrapper()).trigger('click')
      expect(store.dispatch).not.toHaveBeenCalled()
    })

    // A press is a press: a sign-in that ran out shows at once, not after the pop-ups are
    // allowed.
    it('asks about the sign-in all the same', async () => {
      await pinOf(createWrapper()).trigger('click')
      expect(client.query).toHaveBeenCalledTimes(1)
    })
  })

  // It stands in components whose specs mount them without a store and without a client for
  // the server. It asks for neither until it is pressed: no warning, and the pin or the arrow
  // is there.
  it.each([
    ['the pin', BIBI, pinOf],
    ['the arrow', RAEUBER, arrowOf],
  ])(
    'is set up without a store and without a client, and without a word about it: %s',
    (_name, member, face) => {
      const wrapper = createWrapper({ member, plugins: [sentences('en')], provide: {} })
      expect(face(wrapper).exists()).toBe(true)
      expect(warnings).toEqual([])
    },
  )
})
