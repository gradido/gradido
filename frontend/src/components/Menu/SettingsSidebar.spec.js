// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { BNav, BNavItem } from 'bootstrap-vue-next'

const mockConfig = { GMS_ACTIVE: false, HUMHUB_ACTIVE: false }
vi.mock('@/config', () => ({
  default: new Proxy({}, { get: (_target, key) => mockConfig[key] }),
}))

// The real router-link, not a bare stub: a bare stub drops its slot, and the slot IS the
// menu entry. This one keeps the slot and passes `to` through as an attribute.
const RouterLinkStub = { props: ['to'], template: '<a :to="to"><slot /></a>' }

// resetModules, because the component reads the two flags once at module scope -- the same
// way it reads them in the browser, where a build cannot change them while it runs.
const mountMenu = async (path = '/settings/account') => {
  vi.resetModules()
  const { default: SettingsSidebar } = await import('./SettingsSidebar.vue')
  return mount(SettingsSidebar, {
    global: {
      stubs: { BNav, BNavItem, RouterLink: RouterLinkStub },
      mocks: { $t: (key) => key, $route: { path } },
    },
  })
}

describe('SettingsSidebar', () => {
  /**
   * ⛔ Not merely hidden: without GMS or HumHub the route is not registered either, so the
   * page cannot be reached by typing the address. Entry and route have to agree -- an entry
   * without a route is a dead link, a route without an entry is a hidden page.
   */
  it('leaves out the circles while neither service is switched on', async () => {
    mockConfig.GMS_ACTIVE = false
    mockConfig.HUMHUB_ACTIVE = false
    const wrapper = await mountMenu()

    expect(wrapper.find('[data-test="settings-menu-communities"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-test^="settings-menu-"]')).toHaveLength(6)
  })

  it('shows the circles where one of them is', async () => {
    mockConfig.GMS_ACTIVE = true
    const wrapper = await mountMenu()
    mockConfig.GMS_ACTIVE = false

    expect(wrapper.find('[data-test="settings-menu-communities"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-test^="settings-menu-"]')).toHaveLength(7)
  })

  /**
   * ⛔ By PATH, not by name. The route at /overview carries no name -- `name: 'Overview'` in
   * Overview.vue is the component's name and has nothing to do with routing -- so the named
   * form resolves to nothing and vue-router throws. On a wide screen this is the only way
   * out of the settings.
   */
  it('leads back to the account by path', async () => {
    const wrapper = await mountMenu()
    const back = wrapper.find('[data-test="settings-back-to-account"]')

    expect(back.exists()).toBe(true)
    expect(back.attributes('to')).toBe('/overview')
  })

  /**
   * ⛔ The one item of the main menu that has to come along. This menu stands in the main
   * one's place, so everything it offered is out of reach until one goes back -- fine for
   * "overview", not fine for signing out. Found by the end-to-end test, which logs out from
   * the settings page after changing a password, and looked for a menu that was not there.
   */
  it('brings signing out along', async () => {
    const wrapper = await mountMenu()

    expect(wrapper.find('[data-test="logout-menu"]').exists()).toBe(true)
  })

  it('asks the layout to sign out, rather than doing it itself', async () => {
    const wrapper = await mountMenu()
    await wrapper.find('[data-test="logout-menu"] a').trigger('click')

    expect(wrapper.emitted('logout')).toHaveLength(1)
  })

  // /settings shows the account section on a wide screen, so its entry is the one to light.
  it('lights the account entry on the bare /settings', async () => {
    const wrapper = await mountMenu('/settings')

    expect(wrapper.find('[data-test="settings-menu-account"] .active').exists()).toBe(true)
  })

  it('leaves it unlit on another section', async () => {
    const wrapper = await mountMenu('/settings/visibility')

    expect(wrapper.find('[data-test="settings-menu-account"] .active').exists()).toBe(false)
  })
})
