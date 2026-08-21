// AI-GENERATED — not an architecture reference

import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'
import { createStore } from 'vuex'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MyThankYouCard from './MyThankYouCard.vue'
import { renderQrCodeCanvas } from '@/utils/qrCode'

/**
 * The real `OwnCodeView` is mounted underneath, on purpose: what has to be right is the
 * LINK, and only a test that follows it to the generator can say the page shows the card
 * it means.
 */
vi.mock('@/utils/qrCode', () => ({ renderQrCodeCanvas: vi.fn() }))

vi.mock('@/config', () => ({ default: { COMMUNITY_NAME: 'KI Playground' } }))

// The two queries hand their answers over through onResult, so the test keeps the callbacks
// and plays the account's state back through them -- the same way the server would.
let onSettingsResult
let onCardsResult

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn((document) => {
    const name = document?.definitions?.[0]?.name?.value ?? ''
    if (name === 'thankYouCardSettings') {
      return {
        onResult: (callback) => {
          onSettingsResult = callback
        },
      }
    }
    if (name === 'thankYouCards') {
      return {
        onResult: (callback) => {
          onCardsResult = callback
        },
      }
    }
    // Loud rather than forgiving: a renamed query that fell through to a shared mock would
    // leave every test here green while the page asked for something else entirely.
    throw new Error(`this spec has no query mock for "${name}"`)
  }),
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      pageTitle: { 'my-thank-you-card': 'My thank-you card' },
      'my-codes': {
        back: 'Back',
        'thank-you-card': {
          hint: 'Show it like the printed card.',
          'no-card': 'You have not made a card yet.',
          'not-set-up': 'The card function is not set up yet.',
          'to-settings': 'To the settings',
        },
      },
    },
  },
})

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/overview', component: { template: '<div />' } },
    { path: '/settings/:tabAlias?', component: { template: '<div />' } },
  ],
})

const SETTINGS = { maxPerPayment: 50, maxPerDay: 100 }
const ACTIVE_CARD = { id: 7, label: 'Portemonnaie', code: 'DK-abc123', blockedAt: null }
const BLOCKED_CARD = {
  id: 3,
  label: 'Alte Karte',
  code: 'DK-old',
  blockedAt: '2026-08-01T10:00:00Z',
}

const mountPage = () =>
  mount(MyThankYouCard, {
    global: {
      plugins: [i18n, router, createStore({ state: () => ({ community: { name: 'Fallback' } }) })],
    },
  })

const answer = async ({ settings, cards }) => {
  onSettingsResult({ data: { thankYouCardSettings: settings } })
  onCardsResult({ data: { thankYouCards: cards } })
  await flushPromises()
}

describe('MyThankYouCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    onSettingsResult = undefined
    onCardsResult = undefined
    renderQrCodeCanvas.mockImplementation((link) =>
      Promise.resolve({ toDataURL: () => `drawn:${link}` }),
    )
  })

  describe('with an active card', () => {
    it('draws the code the printed card carries', async () => {
      mountPage()
      await answer({ settings: SETTINGS, cards: [ACTIVE_CARD] })

      expect(renderQrCodeCanvas).toHaveBeenCalledWith(`${window.location.origin}/dk/DK-abc123`)
    })

    // Label above, code, community below -- the same three things in the same order as on
    // the paper, so somebody who has held the card recognises this without being told.
    it('shows the label and the community, as the paper does', async () => {
      const wrapper = mountPage()
      await answer({ settings: SETTINGS, cards: [ACTIVE_CARD] })

      expect(wrapper.find('[data-test="my-thank-you-card-label"]').text()).toBe('Portemonnaie')
      expect(wrapper.find('[data-test="my-thank-you-card-community"]').text()).toBe('KI Playground')
      expect(wrapper.find('[data-test="my-thank-you-card-none"]').exists()).toBe(false)
    })

    /**
     * ⛔ The paper carries no name, no picture and no address, so that a found card is a code
     * whose owner is not written on it. The screen must not undo that by being chattier.
     */
    it('says nothing about who the owner is', async () => {
      const wrapper = mountPage()
      await answer({ settings: SETTINGS, cards: [ACTIVE_CARD] })

      expect(wrapper.text()).not.toContain('/u/')
    })
  })

  describe('with nothing to show', () => {
    it('explains the missing PIN when the card function is off', async () => {
      const wrapper = mountPage()
      await answer({ settings: null, cards: [] })

      expect(wrapper.text()).toContain('The card function is not set up yet.')
      expect(renderQrCodeCanvas).not.toHaveBeenCalled()
    })

    // Switched on, but no card made yet. A different sentence, because a member who has just
    // set a PIN is not missing a PIN.
    it('explains the missing card when the function is on', async () => {
      const wrapper = mountPage()
      await answer({ settings: SETTINGS, cards: [] })

      expect(wrapper.text()).toContain('You have not made a card yet.')
    })

    // A blocked card is not a card that can pay -- the server refuses it, and so does this.
    it('treats a blocked card as no card', async () => {
      const wrapper = mountPage()
      await answer({ settings: SETTINGS, cards: [BLOCKED_CARD] })

      expect(wrapper.find('[data-test="my-thank-you-card-none"]').exists()).toBe(true)
      expect(renderQrCodeCanvas).not.toHaveBeenCalled()
    })

    // The way in stays open, so the way ON has to be there too.
    it('offers the way to the settings', async () => {
      const wrapper = mountPage()
      await answer({ settings: null, cards: [] })

      expect(wrapper.find('[data-test="my-thank-you-card-settings"]').attributes('href')).toBe(
        '/settings',
      )
    })
  })

  /**
   * ⚠️ The state before the server has said anything. Without the two flags the page would
   * answer "not set up yet" for that instant -- a wrong answer, briefly, to somebody standing
   * at a counter with the phone already held out.
   */
  describe('before the answers are in', () => {
    it('says nothing while both queries are still out', () => {
      const wrapper = mountPage()

      expect(wrapper.find('[data-test="my-thank-you-card-none"]').exists()).toBe(false)
    })

    it('still says nothing when only one of the two has answered', async () => {
      const wrapper = mountPage()
      onSettingsResult({ data: { thankYouCardSettings: null } })
      await flushPromises()

      expect(wrapper.find('[data-test="my-thank-you-card-none"]').exists()).toBe(false)
    })
  })
})
