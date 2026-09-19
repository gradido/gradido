// AI-GENERATED — not an architecture reference

import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'
import { createStore } from 'vuex'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ShowFriends from './ShowFriends.vue'
import OwnCodeView from '@/components/QrCode/OwnCodeView'
import en from '@/locales/en.json'
import { renderQrCodeCanvas } from '@/utils/qrCode'

/**
 * The real `OwnCodeView` and the real English texts, on purpose. The first door is right
 * when the LINK is right, and only a test that follows it to the generator can say that. The
 * shared sentence is right when the page's placeholder and the text's placeholder are the
 * same word -- a message written for this test would agree with the page by construction.
 */
vi.mock('@/utils/qrCode', () => ({ renderQrCodeCanvas: vi.fn() }))

const config = vi.hoisted(() => ({
  COMMUNITY_URL: 'https://ki-playground.gradido.net',
  MATCHING_ACTIVE: true,
}))
vi.mock('@/config', () => ({ default: config }))

const toast = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }))
vi.mock('@/composables/useToast', () => ({ useAppToast: () => toast }))

const ADDRESS = 'https://ki-playground.gradido.net/u/alice'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const router = createRouter({
  history: createWebHistory(),
  routes: ['/overview', '/send', '/matching/karte'].map((path) => ({
    path,
    component: { template: '<div />' },
  })),
})

const share = vi.fn()
const writeText = vi.fn()

const mountPage = (state = { username: 'alice', gradidoID: 'uuid-1' }) =>
  mount(ShowFriends, {
    global: {
      plugins: [i18n, router, createStore({ state: () => state })],
      stubs: {
        IMdiCoffeeOutline: true,
        IMdiEmailOutline: true,
        IMdiChevronUp: true,
        IMdiChevronDown: true,
        IMdiArrowLeft: true,
        IBiShare: true,
        IBiCopy: true,
      },
    },
  })

const openAway = async (wrapper) => {
  await wrapper.find('[data-test="show-friends-away-head"]').trigger('click')
}

describe('ShowFriends', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    config.MATCHING_ACTIVE = true
    renderQrCodeCanvas.mockImplementation((link) =>
      Promise.resolve({ toDataURL: () => `drawn:${link}` }),
    )
    share.mockResolvedValue(undefined)
    writeText.mockResolvedValue(undefined)
    Object.defineProperty(window.navigator, 'share', { value: share, configurable: true })
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
  })

  afterEach(() => {
    delete window.navigator.share
  })

  it('asks for one person, under the sentence about what joining gives', () => {
    const wrapper = mountPage()

    expect(wrapper.find('[data-test="show-friends-lead"]').text()).toBe(en.showFriends.page.lead)
    expect(wrapper.find('[data-test="show-friends-question"]').text()).toBe(
      en.showFriends.page.question,
    )
  })

  describe('the first door', () => {
    it('is open on arrival, and the second is not', () => {
      const wrapper = mountPage()

      expect(wrapper.find('[data-test="show-friends-here"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="show-friends-away"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="show-friends-here-head"]').attributes('aria-expanded')).toBe(
        'true',
      )
    })

    /**
     * ⛔ The same card as the card page, not a second code: the view is the one the card page
     * uses, and it is handed the member's own address -- followed here all the way to the
     * generator, with the scheme a phone camera needs to offer the link at all.
     */
    it("draws the member's own address, through the view the card page uses", async () => {
      const wrapper = mountPage()
      await flushPromises()

      const view = wrapper.findComponent(OwnCodeView)
      expect(view.props('link')).toBe(ADDRESS)
      expect(renderQrCodeCanvas).toHaveBeenCalledWith(ADDRESS)
      expect(wrapper.find('[data-test="own-code-picture"]').attributes('src')).toBe(
        `drawn:${ADDRESS}`,
      )
    })

    // The page has its own heading; a second one with a back arrow inside the door would
    // lead out of it.
    it('shows the code without the view heading of its own', async () => {
      const wrapper = mountPage()
      await flushPromises()

      expect(wrapper.find('[data-test="own-code-head"]').exists()).toBe(false)
    })

    it('shows the address under the code, without the scheme', () => {
      const wrapper = mountPage()

      expect(wrapper.find('[data-test="show-friends-address"]').text()).toContain(
        'ki-playground.gradido.net/u/alice',
      )
    })

    /**
     * Before the login answer has landed there is neither name nor id. An address built then
     * would read `host/u/` -- a code leading to nobody -- so there is none.
     */
    it('draws nothing while the member is not known yet', async () => {
      const wrapper = mountPage({ username: '', gradidoID: null })
      await flushPromises()

      expect(renderQrCodeCanvas).not.toHaveBeenCalled()
      expect(wrapper.find('[data-test="show-friends-address"]').exists()).toBe(false)
    })

    it('lists three steps, the first one leading to the map', () => {
      const wrapper = mountPage()

      const steps = wrapper.findAll('[data-test="show-friends-steps"] li')
      expect(steps).toHaveLength(3)
      expect(wrapper.find('[data-test="show-friends-map"]').attributes('href')).toBe(
        '/matching/karte',
      )
      expect(steps[0].text()).toBe(
        en.showFriends.here.step1.replace('{map}', en.showFriends.here.map),
      )
    })

    /**
     * A community without matching has no map. A step that sends somebody there would be a
     * sentence nobody can follow, so it is not shown -- and the code, which every community
     * has, stays the first thing to do.
     */
    it('leaves the map step out where there is no map', () => {
      config.MATCHING_ACTIVE = false
      const wrapper = mountPage()

      const steps = wrapper.findAll('[data-test="show-friends-steps"] li')
      expect(steps).toHaveLength(2)
      expect(wrapper.find('[data-test="show-friends-map"]').exists()).toBe(false)
      expect(steps[0].text()).toBe(en.showFriends.here.step2)
    })
  })

  describe('the doors', () => {
    it('opens the second door and closes the first', async () => {
      const wrapper = mountPage()

      await openAway(wrapper)

      expect(wrapper.find('[data-test="show-friends-away"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="show-friends-here"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="show-friends-away-head"]').attributes('aria-expanded')).toBe(
        'true',
      )
      expect(wrapper.find('[data-test="show-friends-here-head"]').attributes('aria-expanded')).toBe(
        'false',
      )
    })

    it('closes an open door when its head is touched again', async () => {
      const wrapper = mountPage()

      await wrapper.find('[data-test="show-friends-here-head"]').trigger('click')

      expect(wrapper.find('[data-test="show-friends-here"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="show-friends-away"]').exists()).toBe(false)
    })
  })

  describe('the second door', () => {
    /**
     * Until the thank-you greeting has a form of its own, the thank-you is a link: the send
     * form, opened on its link tab. The form reads the tab from `?art=`.
     */
    it('leads to the send form, opened on the link tab', async () => {
      const wrapper = mountPage()
      await openAway(wrapper)

      const thanks = wrapper.find('[data-test="show-friends-thanks"]')
      expect(thanks.attributes('href')).toBe('/send?art=link')
      expect(thanks.text()).toBe(en.send_per_link)
    })

    it('shows the sentence exactly as it goes out, with the address in it', async () => {
      const wrapper = mountPage()
      await openAway(wrapper)

      const shown = wrapper.find('[data-test="show-friends-share-text"]').text()
      expect(shown).toBe(en.showFriends.away.shareText.replace('{url}', ADDRESS))
    })

    /**
     * ⛔ The text alone, with the address inside it: Chrome on Android joins text and url with
     * a space, so a `url` as well would put the address into the message twice.
     */
    it("hands the sentence to the device's share sheet, and copies nothing", async () => {
      const wrapper = mountPage()
      await openAway(wrapper)

      await wrapper.find('[data-test="show-friends-share"]').trigger('click')
      await flushPromises()

      expect(share).toHaveBeenCalledTimes(1)
      const [data] = share.mock.calls[0]
      expect(Object.keys(data)).toEqual(['text'])
      expect(data.text).toBe(wrapper.find('[data-test="show-friends-share-text"]').text())
      expect(data.text.split(ADDRESS)).toHaveLength(2)
      expect(writeText).not.toHaveBeenCalled()
    })

    it('copies the same sentence where the device has no share sheet', async () => {
      delete window.navigator.share
      const wrapper = mountPage()
      await openAway(wrapper)

      await wrapper.find('[data-test="show-friends-share"]').trigger('click')
      await flushPromises()

      expect(writeText).toHaveBeenCalledWith(
        en.showFriends.away.shareText.replace('{url}', ADDRESS),
      )
      expect(toast.toastSuccess).toHaveBeenCalledWith(en.showFriends.away.copied)
      expect(toast.toastError).not.toHaveBeenCalled()
    })

    // Closing the sheet is a change of mind: no copy, no message.
    it('stays silent when the member closes the sheet', async () => {
      share.mockRejectedValue(new DOMException('Share canceled', 'AbortError'))
      const wrapper = mountPage()
      await openAway(wrapper)

      await wrapper.find('[data-test="show-friends-share"]').trigger('click')
      await flushPromises()

      expect(writeText).not.toHaveBeenCalled()
      expect(toast.toastSuccess).not.toHaveBeenCalled()
      expect(toast.toastError).not.toHaveBeenCalled()
    })

    /**
     * Some browsers built into other apps have no clipboard at all, and there the call throws
     * before there is a promise. "Copied" is said only once it is copied.
     */
    it('says so when it cannot copy either', async () => {
      delete window.navigator.share
      writeText.mockRejectedValue(new Error('no clipboard'))
      const wrapper = mountPage()
      await openAway(wrapper)

      await wrapper.find('[data-test="show-friends-share"]').trigger('click')
      await flushPromises()

      expect(toast.toastSuccess).not.toHaveBeenCalled()
      expect(toast.toastError).toHaveBeenCalledWith(en['gradidoid-not-copied'])
    })

    it('offers no address to share while the member is not known yet', async () => {
      const wrapper = mountPage({ username: '', gradidoID: null })
      await openAway(wrapper)

      expect(wrapper.find('[data-test="show-friends-share"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="show-friends-thanks"]').exists()).toBe(true)
    })
  })

  // Two sentences, the first in bold -- and a space between them, which the template
  // formatter decides and the source does not show.
  it('ends with the two sentences, set apart by a space', () => {
    const wrapper = mountPage()

    expect(wrapper.find('[data-test="show-friends-footer"]').text()).toBe(
      `${en.showFriends.page.footerLead} ${en.showFriends.page.footer}`,
    )
  })
})
