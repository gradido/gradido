// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import SettingsSidebar from './SettingsSidebar.vue'

const RouterLinkStub = { props: ['to'], template: '<a :to="to"><slot /></a>' }

// The list itself is stubbed here: it is a component of its own now, shared with the phone,
// and it is measured in SettingsMenu.spec.js. What is left in this shell are the two ways
// OUT -- and they are what this file is about.
const mountSidebar = () =>
  mount(SettingsSidebar, {
    global: {
      stubs: { RouterLink: RouterLinkStub, 'settings-menu': true },
      mocks: { $t: (key) => key },
    },
  })

describe('SettingsSidebar', () => {
  it('carries the shared menu list, rather than a second copy of it', () => {
    expect(mountSidebar().find('settings-menu-stub').exists()).toBe(true)
  })

  /**
   * ⛔ By PATH, not by name. The route at /overview carries no name -- `name: 'Overview'` in
   * Overview.vue is the component's name and has nothing to do with routing -- so the named
   * form resolves to nothing and vue-router throws.
   */
  it('leads back to the account by path', () => {
    const back = mountSidebar().find('[data-test="settings-back-to-account"]')

    expect(back.exists()).toBe(true)
    expect(back.attributes('to')).toBe('/overview')
  })

  /**
   * ⛔ The one item of the main menu that has to come along. This menu stands in the main
   * one's place, so everything it offered is out of reach until one goes back -- fine for
   * "overview", not fine for signing out. Found by the end-to-end test.
   */
  it('brings signing out along', () => {
    expect(mountSidebar().find('[data-test="logout-menu"]').exists()).toBe(true)
  })

  it('asks the layout to sign out, rather than doing it itself', async () => {
    const wrapper = mountSidebar()
    await wrapper.find('[data-test="logout-menu"]').trigger('click')

    expect(wrapper.emitted('logout')).toHaveLength(1)
  })

  /**
   * ⚠️ `var(--text)`, not the literal the main menu uses. Copying `rgb(56 56 56) !important`
   * from Sidebar.vue took its dark-mode fix along only in appearance: that fix keys off
   * `#component-sidebar .nav-item > a`, and this link is not a nav item -- so in dark mode it
   * stood nearly black on nearly black. Bernd found it at the device.
   */
  it('takes its colour from the theme token, so dark mode reaches it', () => {
    const source = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), 'SettingsSidebar.vue'),
      'utf8',
    )
    const rule = source.match(/\.settings-back,\n\.settings-logout \{([^}]*)\}/)[1]

    expect(rule).toContain('color: var(--text)')
    expect(rule).not.toContain('rgb(56 56 56)')
  })
})
