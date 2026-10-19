// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { walletStore } from '@test/walletStore'
import { useWalletStore } from '@/store/useWalletStore'
import { createMemoryHistory, createRouter } from 'vue-router'
import de from '@/locales/de.json'
import { eventMatchingArrival } from '@/graphql/queries'
import { eventLinkUnderway, forgetEventLinkArrival } from '@/composables/useEventMatchingArrival'
import {
  firstLoginWindow,
  forgetFirstLoginWindows,
  setFirstLoginWindowUndecided,
  setFirstLoginWindowWanted,
} from '@/composables/useFirstLoginWindow'
import { SHOW_ME_ON_THE_MAP } from '@/utils/showMeOnTheMap'
import EventMatchingHomeInvitation from './EventMatchingHomeInvitation.vue'
import ownSource from './EventMatchingHomeInvitation.vue?raw'
import matchingPageSource from '@/pages/Matching.vue?raw'

// Mutable, so a case can switch matching off. `invitedOntoTheMap` reads the same module.
const config = vi.hoisted(() => ({ MATCHING_ACTIVE: true }))
vi.mock('@/config', () => ({ default: config }))

const apollo = vi.hoisted(() => ({ query: vi.fn(), settle: vi.fn() }))
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { query: apollo.query } }),
  useMutation: () => ({ mutate: apollo.settle }),
}))

// The window as the library would show it: its slots while open, nothing while closed, and the
// cross in the header, which writes `false` back like the real one.
vi.mock('bootstrap-vue-next', () => ({
  BButton: { template: '<button @click="$emit(`click`)"><slot></slot></button>' },
  BModal: {
    name: 'BModal',
    props: ['modelValue', 'centered'],
    emits: ['update:modelValue'],
    template: `<div v-if="modelValue" data-test="modal">
      <slot name="title"></slot><slot></slot><slot name="footer"></slot>
      <button data-test="modal-cross" @click="$emit('update:modelValue', false)">×</button>
    </div>`,
  },
}))

const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } })
const SENTENCE = 'Kongress Frequency Healing'
const HOME = { latitude: 49.28, longitude: 9.69 }

const routes = [
  { path: '/overview', component: { template: '<div />' } },
  { path: '/matching/:tab', component: { template: '<div />' } },
  { path: '/settings/account', component: { template: '<div />' } },
]

const storeWith = (state) =>
  walletStore({
    gradidoID: 'marens-gradido-id',
    gmsAllowed: false,
    userLocation: null,
    ...state,
  })

/** The account's answer, or one that waits until the test lets it go. */
const accountSays = (sentence) =>
  apollo.query.mockResolvedValue({ data: { eventMatchingArrival: sentence } })
const accountHoldsItsAnswer = () => {
  let release
  apollo.query.mockReturnValue(
    new Promise((resolve) => {
      release = (sentence) => resolve({ data: { eventMatchingArrival: sentence } })
    }),
  )
  return (sentence) => release(sentence)
}

let wrapper
let router
let store

const mountWindow = async ({ state = {}, at = '/overview' } = {}) => {
  router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(at)
  await router.isReady()
  const pinia = storeWith(state)
  store = useWalletStore(pinia)
  wrapper = mount(EventMatchingHomeInvitation, { global: { plugins: [i18n, router, pinia] } })
  await flushPromises()
  return wrapper
}

const windowOnScreen = () => wrapper.find('[data-test="event-matching-home-invitation"]').exists()
const text = () => wrapper.find('[data-test="event-matching-home-text"]').text()

describe('EventMatchingHomeInvitation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    config.MATCHING_ACTIVE = true
    forgetFirstLoginWindows()
    forgetEventLinkArrival()
    accountSays(null)
    apollo.settle.mockResolvedValue({ data: { settleEventMatchingArrival: true } })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('asks the account once after the sign-in, past the cache', async () => {
    await mountWindow()

    expect(apollo.query).toHaveBeenCalledTimes(1)
    expect(apollo.query).toHaveBeenCalledWith({
      query: eventMatchingArrival,
      fetchPolicy: 'network-only',
    })
  })

  it('invites nobody where the account says no invitation is due', async () => {
    await mountWindow()

    expect(windowOnScreen()).toBe(false)
    expect(apollo.settle).not.toHaveBeenCalled()
  })

  describe('a newcomer whose registration came through the link', () => {
    beforeEach(() => {
      accountSays(SENTENCE)
    })

    it('is asked for their home, with the sentence of the link in the frame', async () => {
      await mountWindow()

      expect(windowOnScreen()).toBe(true)
      expect(wrapper.text()).toContain('Wo wohnst Du?')
      expect(text()).toContain('„Ich liebe Kongress Frequency Healing“ eingetragen haben')
      expect(text()).toContain('„Ungefähr“ zeigt Dich im Umkreis')
      expect(wrapper.find('[data-test="event-matching-home-later"]').text()).toBe('Später')
      expect(wrapper.find('[data-test="event-matching-home-show-me"]').text()).toBe(
        'Mich auf der Karte zeigen',
      )
    })

    // ⛔ The host's words: text, never markup.
    it('shows the words of the link as text', async () => {
      accountSays('<img src=x onerror=alert(1)>')
      await mountWindow()

      expect(wrapper.find('img').exists()).toBe(false)
      expect(text()).toContain('<img src=x onerror=alert(1)>')
    })

    it('comes after the question of the name, not over it', async () => {
      setFirstLoginWindowWanted('alias', true)
      await mountWindow()
      expect(windowOnScreen()).toBe(false)

      setFirstLoginWindowWanted('alias', false)
      await flushPromises()

      expect(windowOnScreen()).toBe(true)
    })

    // The name's answer is often the slower one: until it is in, the invitation does not take
    // the screen -- and is not ended at the account for a moment it was never seen in.
    it('waits while the question of the name cannot say yet whether it comes', async () => {
      setFirstLoginWindowUndecided('alias', true)
      await mountWindow()
      expect(windowOnScreen()).toBe(false)
      expect(apollo.settle).not.toHaveBeenCalled()

      setFirstLoginWindowUndecided('alias', false)
      await flushPromises()

      expect(windowOnScreen()).toBe(true)
      expect(apollo.settle).toHaveBeenCalledTimes(1)
    })

    it('ends the invitation at the account once it has had the screen -- not before', async () => {
      setFirstLoginWindowWanted('alias', true)
      await mountWindow()
      expect(apollo.settle).not.toHaveBeenCalled()

      setFirstLoginWindowWanted('alias', false)
      await flushPromises()

      expect(apollo.settle).toHaveBeenCalledTimes(1)
    })

    it('leads to the home tab with "findable" switched on, and is over', async () => {
      await mountWindow()
      const push = vi.spyOn(router, 'push')

      await wrapper.find('[data-test="event-matching-home-show-me"]').trigger('click')
      await flushPromises()

      expect(push).toHaveBeenCalledWith(SHOW_ME_ON_THE_MAP)
      expect(windowOnScreen()).toBe(false)
      expect(apollo.settle).toHaveBeenCalledTimes(1)
    })

    it('closes on "later", and stays closed for the session', async () => {
      await mountWindow()

      await wrapper.find('[data-test="event-matching-home-later"]').trigger('click')
      await router.push('/matching/entries')
      await router.push('/overview')
      await flushPromises()

      expect(windowOnScreen()).toBe(false)
    })

    // The window is mounted anew with its layout; "Später" holds until the next start all the
    // same -- also where the account, its ending lost on the way, still names the sentence.
    it('stays closed where the window is mounted anew', async () => {
      await mountWindow()
      await wrapper.find('[data-test="event-matching-home-later"]').trigger('click')
      wrapper.unmount()

      await mountWindow()

      expect(windowOnScreen()).toBe(false)
    })

    // BModal writes the closing back when its `modelValue` goes false on its own -- a window before
    // this one took the screen. Read as an answer, the invitation would be over unseen.
    it('is not answered by a window before it taking the screen', async () => {
      await mountWindow()
      setFirstLoginWindowWanted('email', true)
      await flushPromises()
      await wrapper.findComponent({ name: 'BModal' }).vm.$emit('update:modelValue', false)

      setFirstLoginWindowWanted('email', false)
      await flushPromises()

      expect(windowOnScreen()).toBe(true)
    })

    it('counts the cross as an answer as well', async () => {
      await mountWindow()

      await wrapper.find('[data-test="modal-cross"]').trigger('click')
      await flushPromises()

      expect(windowOnScreen()).toBe(false)
    })

    // KA-015: the first creation comes at the next start.
    it('keeps the first creation off the screen for the rest of the session', async () => {
      setFirstLoginWindowWanted('firstCreation', true)
      await mountWindow()
      expect(firstLoginWindow.value).toBe('home')

      await wrapper.find('[data-test="event-matching-home-later"]').trigger('click')
      await flushPromises()

      expect(firstLoginWindow.value).toBeNull()
    })

    it('does not open over the settings, and comes back on leaving them', async () => {
      await mountWindow({ at: '/settings/account' })
      expect(windowOnScreen()).toBe(false)

      await router.push('/overview')
      await flushPromises()

      expect(windowOnScreen()).toBe(true)
    })

    it('does not open on the home tab, where it would lead', async () => {
      await mountWindow({ at: '/matching/position' })

      expect(windowOnScreen()).toBe(false)
    })

    // Due is due, wherever the member stands: the first creation waits for the next start also
    // where the invitation never opened because the member was on its way already.
    it('keeps the first creation off the screen on the home tab as well', async () => {
      setFirstLoginWindowWanted('firstCreation', true)
      await mountWindow({ at: '/matching/position' })

      expect(firstLoginWindow.value).toBeNull()

      store.setUserLocation(HOME)
      store.setGmsAllowed(true)
      await flushPromises()

      expect(firstLoginWindow.value).toBeNull()
    })

    it('opens on the other tabs of the entries page', async () => {
      await mountWindow({ at: '/matching/entries' })

      expect(windowOnScreen()).toBe(true)
    })
  })

  describe('a member who stands on the map already', () => {
    // Nobody to be invited for, and every round trip costs.
    it('is not invited, and the account is not even asked', async () => {
      accountSays(SENTENCE)
      await mountWindow({ state: { gmsAllowed: true, userLocation: HOME } })

      expect(windowOnScreen()).toBe(false)
      expect(apollo.query).not.toHaveBeenCalled()
      expect(apollo.settle).not.toHaveBeenCalled()
    })

    it('is not invited where they came onto the map while the account was asked', async () => {
      const release = accountHoldsItsAnswer()
      await mountWindow()

      store.setUserLocation(HOME)
      store.setGmsAllowed(true)
      release(SENTENCE)
      await flushPromises()

      expect(windowOnScreen()).toBe(false)
      expect(apollo.settle).toHaveBeenCalledTimes(1)
    })

    // Another way onto the map in the same session -- the overview's tile, the home tab -- ends
    // the invitation that was due, without it ever having had the screen.
    it('ends the invitation at the account once they come onto the map another way', async () => {
      accountSays(SENTENCE)
      setFirstLoginWindowWanted('alias', true)
      await mountWindow()
      expect(apollo.settle).not.toHaveBeenCalled()

      store.setUserLocation(HOME)
      store.setGmsAllowed(true)
      await flushPromises()

      expect(apollo.settle).toHaveBeenCalledTimes(1)
      setFirstLoginWindowWanted('alias', false)
      await flushPromises()
      expect(windowOnScreen()).toBe(false)
    })

    // Leaving the map again later in the session is a choice, not a reason to be asked again.
    it('is not invited where they leave the map again in the session', async () => {
      accountSays(SENTENCE)
      setFirstLoginWindowWanted('alias', true)
      await mountWindow()
      store.setUserLocation(HOME)
      store.setGmsAllowed(true)
      await flushPromises()

      store.setGmsAllowed(false)
      setFirstLoginWindowWanted('alias', false)
      await flushPromises()

      expect(windowOnScreen()).toBe(false)
    })

    it('lets the first creation come', async () => {
      accountSays(SENTENCE)
      setFirstLoginWindowWanted('firstCreation', true)
      await mountWindow({ state: { gmsAllowed: true, userLocation: HOME } })

      expect(firstLoginWindow.value).toBe('firstCreation')
    })

    // A home without the permission to be found is not on the map: the map opens for neither.
    it('is invited where the home is set but "findable" is off', async () => {
      accountSays(SENTENCE)
      await mountWindow({ state: { gmsAllowed: false, userLocation: HOME } })

      expect(windowOnScreen()).toBe(true)
    })
  })

  describe('a member who opens the link in this session', () => {
    it('is invited once the entries page says the link made the entry', async () => {
      await mountWindow({ at: '/matching/entries' })
      expect(windowOnScreen()).toBe(false)

      eventLinkUnderway('marens-gradido-id')(SENTENCE)
      await flushPromises()

      expect(windowOnScreen()).toBe(true)
      expect(text()).toContain('„Ich liebe Kongress Frequency Healing“')
      // Nothing is due at the account for it: nothing to end there.
      expect(apollo.settle).not.toHaveBeenCalled()
    })

    it('is not invited where they stand on the map, nor after they leave it', async () => {
      await mountWindow({ state: { gmsAllowed: true, userLocation: HOME } })
      eventLinkUnderway('marens-gradido-id')(SENTENCE)
      await flushPromises()
      expect(windowOnScreen()).toBe(false)

      store.setGmsAllowed(false)
      await flushPromises()

      expect(windowOnScreen()).toBe(false)
    })

    it('stays closed after "later" where the window is mounted anew', async () => {
      await mountWindow({ at: '/matching/entries' })
      eventLinkUnderway('marens-gradido-id')(SENTENCE)
      await flushPromises()
      await wrapper.find('[data-test="event-matching-home-later"]').trigger('click')
      wrapper.unmount()

      await mountWindow({ at: '/matching/entries' })

      expect(windowOnScreen()).toBe(false)
    })

    // Over is over: a second link of the same session holds nothing back while it is answered.
    it('holds nothing back once it is over, also while another link is answered', async () => {
      await mountWindow({ state: { gmsAllowed: true, userLocation: HOME } })
      eventLinkUnderway('marens-gradido-id')(SENTENCE)
      await flushPromises()
      setFirstLoginWindowWanted('firstCreation', true)

      eventLinkUnderway('marens-gradido-id')
      await flushPromises()

      expect(firstLoginWindow.value).toBe('firstCreation')
    })

    it('keeps the windows after it waiting while that answer is on its way', async () => {
      setFirstLoginWindowWanted('firstCreation', true)
      const answered = eventLinkUnderway('marens-gradido-id')
      await mountWindow({ at: '/matching/entries' })

      expect(firstLoginWindow.value).toBeNull()

      answered(null)
      await flushPromises()

      expect(firstLoginWindow.value).toBe('firstCreation')
    })
  })

  describe('while the account is asked', () => {
    it('keeps the first creation waiting, and lets it come where nobody is invited', async () => {
      const release = accountHoldsItsAnswer()
      setFirstLoginWindowWanted('firstCreation', true)
      await mountWindow()

      expect(firstLoginWindow.value).toBeNull()

      release(null)
      await flushPromises()

      expect(firstLoginWindow.value).toBe('firstCreation')
    })

    it('gives the screen to the invitation where the answer brings a sentence', async () => {
      const release = accountHoldsItsAnswer()
      setFirstLoginWindowWanted('firstCreation', true)
      await mountWindow()

      release(SENTENCE)
      await flushPromises()

      expect(firstLoginWindow.value).toBe('home')
      expect(windowOnScreen()).toBe(true)
    })

    /**
     * The first creation waits with the account's answer, so that answer has a limit: 8 s. One
     * that comes later is let go -- the invitation stays due at the account, for the next start
     * -- rather than pushing a window off the screen that has been on it for seconds.
     */
    describe('for at most 8 seconds', () => {
      beforeEach(() => {
        // Only the clock of the limit: flushPromises and the router keep their own.
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      })
      afterEach(() => {
        vi.useRealTimers()
      })

      it('lets the first creation come once they are over, and lets a later answer go', async () => {
        const release = accountHoldsItsAnswer()
        setFirstLoginWindowWanted('firstCreation', true)
        await mountWindow()

        await vi.advanceTimersByTimeAsync(7999)
        expect(firstLoginWindow.value).toBeNull()
        await vi.advanceTimersByTimeAsync(1)
        expect(firstLoginWindow.value).toBe('firstCreation')

        release(SENTENCE)
        await flushPromises()

        expect(firstLoginWindow.value).toBe('firstCreation')
        expect(windowOnScreen()).toBe(false)
        expect(apollo.settle).not.toHaveBeenCalled()
      })

      it('takes an answer that comes within them, and leaves no clock running', async () => {
        const release = accountHoldsItsAnswer()
        setFirstLoginWindowWanted('firstCreation', true)
        await mountWindow()

        await vi.advanceTimersByTimeAsync(7900)
        release(SENTENCE)
        await flushPromises()

        expect(firstLoginWindow.value).toBe('home')
        expect(vi.getTimerCount()).toBe(0)
      })

      it('lets a failure that comes after them go unheard', async () => {
        let fail
        apollo.query.mockReturnValue(
          new Promise((_resolve, reject) => {
            fail = reject
          }),
        )
        await mountWindow()
        await vi.advanceTimersByTimeAsync(8000)

        fail(new Error('Network error'))
        await flushPromises()

        expect(windowOnScreen()).toBe(false)
      })
    })

    // ⛔ A sign-out empties the store while the answer is on its way: it is nobody's.
    it('drops an answer that comes after the member signed out', async () => {
      const release = accountHoldsItsAnswer()
      await mountWindow()

      store.setGradidoID(null)
      release(SENTENCE)
      await flushPromises()

      expect(windowOnScreen()).toBe(false)
    })

    // The same member out and in again: only the question asked last is answered.
    it('drops the answer to a question asked before the one asked last', async () => {
      const first = accountHoldsItsAnswer()
      await mountWindow()
      store.setGradidoID(null)
      await flushPromises()
      const second = accountHoldsItsAnswer()
      store.setGradidoID('marens-gradido-id')
      await flushPromises()

      first(SENTENCE)
      await flushPromises()
      expect(windowOnScreen()).toBe(false)

      second(null)
      await flushPromises()
      expect(windowOnScreen()).toBe(false)
    })

    it('asks again for the next member who signs in on the same page', async () => {
      await mountWindow()
      store.setGradidoID(null)
      await flushPromises()
      accountSays(SENTENCE)

      store.setGradidoID('jonas-gradido-id')
      await flushPromises()

      expect(apollo.query).toHaveBeenCalledTimes(2)
      expect(windowOnScreen()).toBe(true)
    })
  })

  it('invites nobody where the account cannot be asked, and holds nothing back', async () => {
    apollo.query.mockRejectedValue(new Error('Network error'))
    setFirstLoginWindowWanted('firstCreation', true)
    await mountWindow()

    expect(windowOnScreen()).toBe(false)
    expect(firstLoginWindow.value).toBe('firstCreation')
  })

  it('asks nothing and holds nothing back on a wallet without a map', async () => {
    config.MATCHING_ACTIVE = false
    setFirstLoginWindowWanted('firstCreation', true)
    await mountWindow()

    expect(apollo.query).not.toHaveBeenCalled()
    expect(firstLoginWindow.value).toBe('firstCreation')
  })

  it('asks nothing while nobody is signed in', async () => {
    await mountWindow({ state: { gradidoID: null } })

    expect(apollo.query).not.toHaveBeenCalled()
  })

  // The footer of the window behind "find on the map", rule for rule: the same two buttons.
  it('lays out its two buttons as the window behind "find on the map" does', () => {
    // Every `.window-buttons` rule of a file's style block, the ones inside an @media with their
    // query -- comments out first, so an explanation that names a value cannot stand in for it.
    const rules = (source) => {
      const css = source
        .slice(source.indexOf('<style scoped>') + '<style scoped>'.length)
        .replace(/\/\*[\s\S]*?\*\//g, '')
      const squash = (s) => s.replace(/\s+/g, ' ').trim()
      const inMedia = [
        ...css.matchAll(/@media([^{]*)\{\s*([^{}]*\.window-buttons[^{]*)\{([^}]*)\}\s*\}/g),
      ].map(
        ([, query, selector, body]) =>
          `@media ${squash(query)} ${squash(selector)} { ${squash(body)} }`,
      )
      const outside = css.replace(/@media[^{]*\{(?:[^{}]*\{[^}]*\})*[^{}]*\}/g, '')
      const plain = [...outside.matchAll(/([^{}]*\.window-buttons[^{]*)\{([^}]*)\}/g)].map(
        ([, selector, body]) => `${squash(selector)} { ${squash(body)} }`,
      )
      return [...plain, ...inMedia]
    }
    const own = rules(ownSource)

    // The fixture proves itself: two rules outside, one inside the phone's @media.
    expect(own).toHaveLength(3)
    expect(own[2]).toMatch(/^@media \(width < 400px\)/)
    expect(own).toEqual(rules(matchingPageSource))
  })
})
