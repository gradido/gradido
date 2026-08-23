import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter, createWebHistory, RouterLink } from 'vue-router'
import { createStore } from 'vuex'
import Navbar from './Navbar.vue'
import { BImg, BNavbar, BNavbarBrand, BNavbarNav } from 'bootstrap-vue-next'
import AppAvatar from '@/components/AppAvatar.vue'
import { createI18n } from 'vue-i18n'
import CONFIG from '@/config'
import { communityHost } from '@/utils/gradidoAddress'

// The real toast needs a mounted container. Without this the copy test still passed --
// the clipboard is written before the message is shown -- while an error flew past it.
const mockToastSuccess = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: mockToastSuccess }),
}))

// Mock vue-avatar
vi.mock('vue-avatar', () => ({
  default: {
    name: 'Avatar',
    render: () => null,
    props: {
      initials: null,
    },
  },
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      'copied-to-clipboard': 'copied-to-clipboard',
    },
  },
})

const createVuexStore = (state = {}) =>
  createStore({
    state: () => ({
      firstName: 'Testy',
      lastName: 'User',
      gradidoID: 'current-user-id',
      email: 'test@example.com',
      username: 'username',
      ...state,
    }),
  })

const router = createRouter({
  history: createWebHistory(),
  routes: [],
})

describe('Navbar', () => {
  let wrapper
  let store

  const mountComponent = (storeState = {}) => {
    store = createVuexStore(storeState)
    return mount(Navbar, {
      global: {
        plugins: [store, router, i18n],
        stubs: {
          IBiClipboard: true,
          // The avatar button brings its own apollo and toast dependencies. What matters
          // here is what the navbar hands it; the button itself has its own spec.
          AvatarButton: {
            name: 'AvatarButton',
            props: ['name', 'initials', 'color', 'size'],
            template: '<div class="avatar-button-stub"></div>',
          },
        },
        mocks: {
          $t: (msg) => msg,
        },
        components: {
          BNavbar,
          BNavbarNav,
          BNavbarBrand,
          BImg,
          RouterLink,
          AppAvatar,
        },
      },
      props: {
        balance: 1234,
      },
    })
  }

  beforeEach(() => {
    wrapper = mountComponent()
  })

  it('renders the component', () => {
    expect(wrapper.find('div.navbar-component').exists()).toBe(true)
  })

  /**
   * The quick way to the calculator on a phone: a small symbol ABOVE the menu opener,
   * deliberately unmarked -- a tool for those who run a till, found by those who need it.
   */
  it('offers the calculator above the menu opener', () => {
    const quick = wrapper.find('[data-test="navbar-calculator"]')
    expect(quick.exists()).toBe(true)
    expect(quick.attributes('href')).toBe('/calculator')
  })

  /**
   * The other half of the row: reading a code above, showing one below.
   *
   * ⚠️ The two are told apart by the arrow alone -- both carry the same square -- so the
   * pairing of destination and direction is the thing that must not slip. Reaching for the
   * wrong one at a counter shows a code that moves the Gradido the other way.
   */
  it('offers both of the member own codes, each with its own direction', () => {
    const cases = [
      ['navbar-my-thank-you-card', '/my-thank-you-card', 'out'],
      ['navbar-my-gradido-card', '/my-gradido-card', 'in'],
    ]

    for (const [test, href, direction] of cases) {
      const quick = wrapper.find(`[data-test="${test}"]`)
      expect(quick.exists()).toBe(true)
      expect(quick.attributes('href')).toBe(href)
      expect(quick.find(`[data-test="quick-code-arrow-${direction}"]`).exists()).toBe(true)
    }
  })

  /**
   * ⛔ Two by two, not four in a row. Four 44px targets need 176px and the block opposite --
   * avatar, name, and the Gradido address at 27 characters -- takes about 195px of a 375px
   * phone. A single row would push it off the screen, and nothing in a jsdom test can see
   * that; the grid with its two columns is what is checkable here.
   */
  it('stacks the four tools two by two', () => {
    const row = wrapper.find('.navbar-quick-row')

    expect(row.exists()).toBe(true)
    expect(row.findAll('a')).toHaveLength(4)
  })

  it('has a .navbar-brand element', () => {
    expect(wrapper.find('div.navbar-brand').exists()).toBe(true)
  })

  describe('.avatar element', () => {
    it('is rendered', () => {
      expect(wrapper.findComponent({ name: 'AvatarButton' }).exists()).toBe(true)
    })

    it("has the user's initials", () => {
      const avatar = wrapper.findComponent({ name: 'AvatarButton' })
      expect(avatar.props('initials')).toBe('TU')
    })
  })

  describe('user info', () => {
    const addressLine = () => wrapper.find('div[data-test="navbar-item-gradido-address"]')

    it('has the full name', () => {
      expect(wrapper.find('[data-test="navbar-item-username"]').text()).toBe('Testy User')
    })

    it('shows the Gradido address, without a scheme', () => {
      expect(addressLine().text()).toBe(`${communityHost(CONFIG.COMMUNITY_URL)}/u/username`)
    })

    // The line exists for everybody. It used to sit inside the settings link for members
    // without a user name, with no way to copy it -- and the Gradido ID resolves just as
    // well, so there was never a reason to treat them differently.
    it('shows it for a member who has no user name yet', () => {
      wrapper = mountComponent({ username: '' })
      expect(addressLine().text()).toBe(`${communityHost(CONFIG.COMMUNITY_URL)}/u/current-user-id`)
    })

    // Shown without a scheme, copied with one (P-019): what lands in the clipboard has to
    // work when it is pasted into a browser, not only when it is read.
    it('copies the address WITH the scheme', async () => {
      const writeText = vi.fn()
      vi.stubGlobal('navigator', { clipboard: { writeText } })

      await addressLine().find('button').trigger('click')

      expect(writeText).toHaveBeenCalledWith(`${CONFIG.COMMUNITY_URL}/u/username`)
      expect(mockToastSuccess).toHaveBeenCalledWith('gradidoid-copied-to-clipboard')
      vi.unstubAllGlobals()
    })

    // A button, not an anchor. An anchor without a target is in no tab order, so the
    // address could not be copied by anybody working without a mouse.
    it('offers the copy control to the keyboard', () => {
      const control = addressLine().find('button')
      expect(control.exists()).toBe(true)
      expect(control.attributes('type')).toBe('button')
      expect(addressLine().find('a').exists()).toBe(false)
    })

    // Bernd's decision on the mockup: the icon sits behind the address, not in front of it.
    it('puts the copy icon behind the address', () => {
      const html = addressLine().html()
      expect(html.indexOf('username')).toBeLessThan(html.indexOf('ibicopy'))
    })
  })
  /**
   * The height of this navbar is somebody else's problem, and that is the whole point.
   *
   * Below 450px it is `position: fixed` and translucent, so the page needs matching clearance
   * underneath -- `.breadcrumb`'s `padding-top` in layouts/DashboardLayout.vue plus
   * `.page-breadcrumb`'s `margin-top` in Breadcrumb/breadcrumb.vue, 83 + 48 = 131px today.
   *
   * ⛔ On 21.08.2026 the four till tools were added as a second row of 44px. The note written
   * at the time checked the new height against the block OPPOSITE -- avatar, name and address,
   * about 130px -- and concluded the second row "costs no height". True of the navbar, and it
   * left the room BELOW it untouched at 103px. The heading sat under the last 25px for two
   * days, smudged rather than hidden, because the bar is 90% opaque. (Bernd, on the phone.)
   *
   * A rendered height is not measurable here -- jsdom lays nothing out. What is measurable is
   * the assumption the clearance was calculated from: two rows. A fifth tool makes it three,
   * and then 131px is short again by the height of a row.
   */
  describe('height the page has to clear', () => {
    const TOOLS_PER_ROW = 2
    const ROWS_THE_CLEARANCE_ALLOWS = 2

    it('keeps the till tools within the rows the clearance was calculated for', () => {
      const tools = wrapper
        .findAll('.navbar-quick-row a')
        .filter((link) => link.attributes('data-test')?.startsWith('navbar-'))
      const rows = Math.ceil(tools.length / TOOLS_PER_ROW)

      expect(tools.length).toBeGreaterThan(0)
      expect(
        rows,
        `The navbar now needs ${rows} rows of tools. The clearance below it was calculated ` +
          `for ${ROWS_THE_CLEARANCE_ALLOWS}: raise .breadcrumb's padding-top in ` +
          `DashboardLayout.vue by about 44px per extra row, and take the same again out of ` +
          `the space under the heading in breadcrumb.vue, or the page slides down with it.`,
      ).toBe(ROWS_THE_CLEARANCE_ALLOWS)
    })
  })
})
