// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { BListGroup, BListGroupItem } from 'bootstrap-vue-next'

const mockConfig = { GMS_ACTIVE: false, HUMHUB_ACTIVE: false }
vi.mock('@/config', () => ({
  default: new Proxy({}, { get: (_target, key) => mockConfig[key] }),
}))

const RouterLinkStub = { props: ['to'], template: '<a :to="to"><slot /></a>' }

const mountIndex = async () => {
  vi.resetModules()
  const { default: Index } = await import('./Index.vue')
  return mount(Index, {
    global: {
      stubs: {
        BListGroup,
        BListGroupItem,
        RouterLink: RouterLinkStub,
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

    const list = wrapper.find('.d-lg-none')
    expect(list.exists()).toBe(true)
    expect(list.find('[data-test="settings-list-account"]').exists()).toBe(true)

    const wide = wrapper.find('.d-none.d-lg-block')
    expect(wide.exists()).toBe(true)
    expect(wide.find('settings-account-stub').exists()).toBe(true)
  })

  it('lists every area', async () => {
    const wrapper = await mountIndex()

    // Deduped: a list item that carries a `to` renders a link inside a link, and the
    // data-test attribute rides along on both.
    const entries = [
      ...new Set(
        wrapper.findAll('[data-test^="settings-list-"]').map((i) => i.attributes('data-test')),
      ),
    ]

    expect(entries).toEqual([
      'settings-list-account',
      'settings-list-appearance',
      'settings-list-gradido-card',
      'settings-list-thank-you-card',
      'settings-list-visibility',
      'settings-list-notifications',
    ])
  })

  // ⛔ Same agreement as in the menu and the routes: no service, no area, nowhere.
  it('leaves out the circles while neither service is switched on', async () => {
    const wrapper = await mountIndex()

    expect(wrapper.find('[data-test="settings-list-communities"]').exists()).toBe(false)
  })

  it('shows the circles where one of them is', async () => {
    mockConfig.HUMHUB_ACTIVE = true
    const wrapper = await mountIndex()
    mockConfig.HUMHUB_ACTIVE = false

    expect(wrapper.find('[data-test="settings-list-communities"]').exists()).toBe(true)
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
})
