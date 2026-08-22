// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

const RouterLinkStub = { props: ['to'], template: '<a :to="to"><slot /></a>' }

const mountIndex = async () => {
  vi.resetModules()
  const { default: Index } = await import('./Index.vue')
  return mount(Index, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
        'settings-menu': true,
        'settings-account': true,
      },
      mocks: { $t: (key) => key },
    },
  })
}

describe('the settings index', () => {
  /**
   * ⭐ Two breakpoints, no router trick. A redirect cannot know the screen width, and a width
   * check at navigation time is wrong again as soon as the device is turned. Below 992px the
   * layout's menu column is gone, so the LIST is the page; above it the menu stands to the
   * left and this shows the first section.
   */
  it('is the list on a narrow screen and the account section on a wide one', async () => {
    const wrapper = await mountIndex()

    expect(wrapper.find('.d-lg-none').find('settings-menu-stub').exists()).toBe(true)
    expect(wrapper.find('.d-none.d-lg-block').find('settings-account-stub').exists()).toBe(true)
  })

  // The very same component the desk menu carries -- one list, not two that can drift apart.
  it('carries the shared menu list', async () => {
    expect((await mountIndex()).findAll('settings-menu-stub')).toHaveLength(1)
  })

  /**
   * ⛔ By PATH: the route at /overview carries no name and the named form throws. On a phone
   * this is the way out of the settings -- the drawer behind the hamburger is the other.
   */
  it('leads back to the account by path', async () => {
    const wrapper = await mountIndex()

    expect(wrapper.find('[data-test="settings-back-to-account"]').attributes('to')).toBe(
      '/overview',
    )
  })

  /**
   * ⚠️ No heading of its own any more: the breadcrumb writes "Settings" above every settings
   * route now, and two of them under each other read like a mistake.
   */
  it('leaves the heading to the breadcrumb', async () => {
    expect((await mountIndex()).find('.h2').exists()).toBe(false)
  })
})
