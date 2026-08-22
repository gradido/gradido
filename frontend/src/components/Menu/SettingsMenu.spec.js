// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { createStore } from 'vuex'

const mockConfig = { GMS_ACTIVE: false, HUMHUB_ACTIVE: false }
vi.mock('@/config', () => ({
  default: new Proxy({}, { get: (_target, key) => mockConfig[key] }),
}))

let cardSettings = { value: { thankYouCardSettings: null } }
let cards = { value: { thankYouCards: [] } }
let loading = { value: false }
let failed = { value: null }
// ⚠️ Told apart by the query's OWN name, not by stringifying it: a parsed GraphQL document
// stringifies to "[object Object]", so both queries would have got the same answer -- and the
// two states that matter would have looked fine while reading the wrong one.
vi.mock('@vue/apollo-composable', () => ({
  useQuery: (query) => ({
    result: query?.definitions?.[0]?.name?.value === 'thankYouCardSettings' ? cardSettings : cards,
    loading,
    error: failed,
  }),
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key) => key }) }))

const RouterLinkStub = { props: ['to'], template: '<a :to="to"><slot /></a>' }

const mountMenu = async ({ avatar = true, newsletter = false, path = '/settings' } = {}) => {
  vi.resetModules()
  const { default: SettingsMenu } = await import('./SettingsMenu.vue')
  return mount(SettingsMenu, {
    global: {
      plugins: [
        createStore({
          state: () => ({ avatarVisibleToMembers: avatar, newsletterState: newsletter }),
        }),
      ],
      stubs: { RouterLink: RouterLinkStub, 'settings-menu-icon': true },
      mocks: { $t: (key) => key, $route: { path } },
    },
  })
}

const entries = (wrapper) =>
  wrapper.findAll('[data-test^="settings-menu-"]').map((e) => e.attributes('data-test'))

describe('the settings menu', () => {
  it('is one list for both screens, in this order', async () => {
    const wrapper = await mountMenu()

    expect(entries(wrapper)).toEqual([
      'settings-menu-account',
      'settings-menu-appearance',
      'settings-menu-gradido-card',
      'settings-menu-thank-you-card',
      'settings-menu-visibility',
      'settings-menu-notifications',
    ])
  })

  /**
   * ⛔ Not merely hidden: without GMS or HumHub the route is not registered either, so the
   * page cannot be reached by typing the address. Entry and route have to agree.
   */
  it('leaves out the circles while neither service is switched on', async () => {
    const wrapper = await mountMenu()
    expect(wrapper.find('[data-test="settings-menu-communities"]').exists()).toBe(false)
  })

  it('shows the circles where one of them is', async () => {
    mockConfig.GMS_ACTIVE = true
    const wrapper = await mountMenu()
    mockConfig.GMS_ACTIVE = false

    expect(wrapper.find('[data-test="settings-menu-communities"]').exists()).toBe(true)
  })

  // /settings shows the account section on a wide screen, so its entry is the one to mark.
  it('marks the account entry on the bare /settings', async () => {
    const wrapper = await mountMenu({ path: '/settings' })

    expect(wrapper.find('[data-test="settings-menu-account"]').classes()).toContain('is-current')
  })

  it('marks the section one is actually in', async () => {
    const wrapper = await mountMenu({ path: '/settings/visibility' })

    expect(wrapper.find('[data-test="settings-menu-account"]').classes()).not.toContain(
      'is-current',
    )
    expect(wrapper.find('[data-test="settings-menu-visibility"]').classes()).toContain('is-current')
  })

  /**
   * The state beside the entry is what the list is for: one look, and one knows where the
   * thank you card stands without opening it. ⚠️ Blocked is its own word -- the function is
   * on, but the card in the wallet does not pay any more, and that is exactly what one comes
   * here to check.
   */
  describe('the state beside an entry', () => {
    const stateOf = (wrapper, name) => wrapper.find(`[data-test="settings-state-${name}"]`).text()

    it('says off while the thank you card was never set up', async () => {
      loading = { value: false }
      failed = { value: null }
      cardSettings = { value: { thankYouCardSettings: null } }
      const wrapper = await mountMenu()

      expect(stateOf(wrapper, 'thank-you-card')).toBe('settings.menu.state.off')
    })

    it('says on once it is set up', async () => {
      cardSettings = { value: { thankYouCardSettings: { maxPerDay: '100' } } }
      cards = { value: { thankYouCards: [{ id: 1, blockedAt: null }] } }
      const wrapper = await mountMenu()

      expect(stateOf(wrapper, 'thank-you-card')).toBe('settings.menu.state.on')
    })

    it('says blocked while every card is blocked', async () => {
      cardSettings = { value: { thankYouCardSettings: { maxPerDay: '100' } } }
      cards = { value: { thankYouCards: [{ id: 1, blockedAt: '2026-08-22' }] } }
      const wrapper = await mountMenu()

      expect(stateOf(wrapper, 'thank-you-card')).toBe('settings.menu.state.blocked')
    })

    // These two come from the store, so they cost no request at all.
    it('reads the picture and the newsletter off the store', async () => {
      const wrapper = await mountMenu({ avatar: true, newsletter: false })

      expect(stateOf(wrapper, 'visibility')).toBe('settings.menu.state.on')
      expect(stateOf(wrapper, 'notifications')).toBe('settings.menu.state.off')
    })

    /**
     * ⛔ Nothing at all while the answers are on their way. The first form said "off" in the
     * meantime -- and "off" beside a card that is switched ON is worse than an empty space:
     * a state that is briefly wrong is still read as a state, and the whole point of the line
     * is that one look is enough. (coderabbit, PR #3786.)
     */
    it('says nothing while it is still asking', async () => {
      loading = { value: true }
      cardSettings = { value: { thankYouCardSettings: { maxPerDay: '100' } } }
      const wrapper = await mountMenu()
      loading = { value: false }

      expect(wrapper.find('[data-test="settings-state-thank-you-card"]').exists()).toBe(false)
    })

    it('says nothing if the answer never arrives', async () => {
      failed = { value: new Error('no') }
      cardSettings = { value: { thankYouCardSettings: { maxPerDay: '100' } } }
      const wrapper = await mountMenu()
      failed = { value: null }

      expect(wrapper.find('[data-test="settings-state-thank-you-card"]').exists()).toBe(false)
    })

    /**
     * ⚠️ No state on the circles: TWO switches sit behind that entry (GMS and HumHub), and
     * one word cannot say what two switches stand at.
     */
    it('says nothing beside the entries that have no single state', async () => {
      const wrapper = await mountMenu()

      for (const name of ['account', 'appearance', 'gradido-card']) {
        expect(wrapper.find(`[data-test="settings-state-${name}"]`).exists()).toBe(false)
      }
    })
  })
})
