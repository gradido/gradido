import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { startChatUpdates, stopChatUpdates } from '@/composables/useChatUpdates'
import { nextTick } from 'vue'
import { createRouter, createWebHistory, RouterLink } from 'vue-router'
import { createStore } from 'vuex'
import Navbar from './Navbar.vue'
import { BImg, BNavbar, BNavbarBrand, BNavbarNav } from 'bootstrap-vue-next'
import AppAvatar from '@/components/AppAvatar.vue'
import AvatarButton from '@/components/Avatar/AvatarButton.vue'
import { createI18n } from 'vue-i18n'
import CONFIG from '@/config'
import { communityHost } from '@/utils/gradidoAddress'

// The real toast needs a mounted container. Without this the copy test still passed --
// the clipboard is written before the message is shown -- while an error flew past it.
const mockToastSuccess = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: mockToastSuccess }),
}))

// The avatar button sets up its two picture mutations when it mounts. Only the tests that
// mount the real button reach this; none of them saves a picture.
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({ mutate: vi.fn() }),
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
          // here is what the navbar hands it; the circle's letters are measured through the
          // real button further down.
          AvatarButton: {
            name: 'AvatarButton',
            props: ['name', 'initials', 'colorSeed', 'color', 'size'],
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
  })

  /**
   * The letters are the user name's, as on the printed card, on the cheque and in every other
   * member's lists; the colour keeps hashing the real initials (Bernd, 17.09.2026).
   *
   * ⛔ Measured through the REAL AvatarButton down to AppAvatar, not at the stub above. A stub
   * declares whatever props it is given, so it would accept a name the button does not have,
   * and the seed would stop one component short of the circle with every test still green.
   * The button is registered by hand: the app resolves it through the components plugin,
   * which the test configuration does not load.
   */
  describe('the letters in the circle', () => {
    const mountWithRealButton = () => {
      store = createVuexStore({ firstName: 'Bernd', lastName: 'Hückstädt', username: 'bernd' })
      return mount(Navbar, {
        global: {
          plugins: [store, router, i18n],
          stubs: { IBiClipboard: true, IBiCameraFill: true, AvatarCropper: true },
          mocks: { $t: (msg) => msg },
          components: { BNavbar, BNavbarNav, BNavbarBrand, BImg, RouterLink, AvatarButton },
        },
        props: { balance: 1234 },
      })
    }

    it('takes the letters from the user name and the colour from the real initials', () => {
      const circle = mountWithRealButton().findComponent(AppAvatar)

      expect(circle.text()).toBe('BE')
      expect(circle.props('colorSeed')).toBe('BH')
    })

    it('changes the letters with a new user name and keeps the colour', async () => {
      const navbar = mountWithRealButton()

      store.state.username = 'sonnenblume'
      await nextTick()

      const circle = navbar.findComponent(AppAvatar)
      expect(circle.text()).toBe('SO')
      expect(circle.props('colorSeed')).toBe('BH')
      // The member's own name beside the circle is not part of this.
      expect(navbar.find('[data-test="navbar-item-username"]').text()).toBe('Bernd Hückstädt')
    })
  })

  describe('user info', () => {
    const addressLine = () => wrapper.find('div[data-test="navbar-item-gradido-address"]')

    it('has the full name', () => {
      expect(wrapper.find('[data-test="navbar-item-username"]').text()).toBe('Testy User')
    })

    /**
     * ⭐ The name has led to the settings for a while and nobody could tell (Bernd, 06.09.).
     * ⛔ Measured as ONE link carrying both: two anchors on the same target would be two
     * stations for a keyboard and two announcements for a screen reader, for one
     * destination — so the wheel has to be inside the name's link, not beside it.
     */
    it('puts a settings wheel inside the name link, not beside it', () => {
      const link = wrapper.find('[data-test="navbar-item-username"]')
      // A real router is installed here, so the link renders as an anchor with an href.
      expect(link.attributes('href')).toBe('/settings')
      expect(link.find('[data-test="navbar-item-settings-cog"]').exists()).toBe(true)
      // Decoration: the name is the whole label, the wheel only says where it goes.
      expect(link.find('[data-test="navbar-item-settings-cog"]').attributes('aria-hidden')).toBe(
        'true',
      )
      // And still exactly one link on this target, not two.
      expect(wrapper.findAll('[data-test="navbar-item-settings-cog"]')).toHaveLength(1)
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
   * On a phone the whole menu lies behind this opener, and it was a div: it took a click, but
   * no Tab, no Enter and no name -- the menu was out of a keyboard's reach. A button now, named
   * by a hidden word, and looking like the block it replaced.
   */
  describe('the menu opener', () => {
    const opener = () => wrapper.find('[data-test="navbar-menu-opener"]')

    it('is a button, so a keyboard reaches it and Enter and Space press it', () => {
      wrapper = mountComponent()
      expect(opener().element.tagName).toBe('BUTTON')
      expect(opener().attributes('type')).toBe('button')
    })

    // It names the drawer and asks the layout to open or shut it; it does not keep the state.
    it('names the drawer it opens, and asks the layout to open or shut it', async () => {
      wrapper = mountComponent()
      expect(opener().attributes('aria-controls')).toBe('sidebar-mobile')
      await opener().trigger('click')
      expect(wrapper.emitted('toggle-menu')).toHaveLength(1)
    })

    /**
     * ⛔ Says what the layout says -- open or shut however the menu got there. v-b-toggle set
     * aria-expanded only on the element that was clicked, so a menu shut by the dark area beside
     * it or by one of its entries left this button saying "expanded".
     */
    it('says whether the menu is open, as the layout keeps it', async () => {
      wrapper = mountComponent()
      expect(opener().attributes('aria-expanded')).toBe('false')
      await wrapper.setProps({ menuOpen: true })
      expect(opener().attributes('aria-expanded')).toBe('true')
      await wrapper.setProps({ menuOpen: false })
      expect(opener().attributes('aria-expanded')).toBe('false')
    })

    // Its name is its content: the hidden word first, then the dot's line where there is one.
    it('is named "Menu" by a hidden word before the symbol', () => {
      wrapper = mountComponent()
      const word = opener().element.firstElementChild
      expect(word.classList.contains('visually-hidden')).toBe(true)
      expect(word.textContent.trim()).toBe('navigation.menu')
      expect(opener().text()).toBe('navigation.menu')
    })

    // jsdom lays nothing out, so the stylesheet says it -- read without its comments.
    it('looks like the block it replaced: no chrome, the full width', () => {
      const style = readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), 'Navbar.vue'),
        'utf8',
      ).replace(/\/\*[\s\S]*?\*\//g, '')
      const rule = style.match(/\n\.navbar-menu-opener\s*\{([^}]*)\}/)?.[1] ?? ''

      expect(rule).toMatch(/display:\s*block/)
      expect(rule).toMatch(/width:\s*100%/)
      expect(rule).toMatch(/border:\s*0/)
      expect(rule).toMatch(/background:\s*transparent/)
      expect(rule).toMatch(/padding:\s*0/)
      expect(rule).not.toMatch(/outline/)
    })
  })

  /**
   * On the phone the menu is behind this button, so a gold dot on it says that conversations
   * hold something unread -- a dot, not a figure: the button is a symbol. Measured through the
   * real chat beat (useChatUpdates) with a server that answers.
   */
  describe('the dot on the menu opener', () => {
    const serverSays = async (unreadConversations) => {
      startChatUpdates({
        query: vi.fn(async () => ({
          data: {
            newChatMessagesSince: {
              latestId: 1,
              unreadConversations,
              messages: [],
              hasMore: false,
            },
          },
        })),
      })
      await flushPromises()
    }
    const opener = () => wrapper.find('.navbar-menu-opener')

    afterEach(() => {
      stopChatUpdates()
    })

    it('is not there while nothing waits', async () => {
      await serverSays(0)
      wrapper = mountComponent()

      expect(opener().find('[data-test="chat-unread-dot"]').exists()).toBe(false)
      expect(opener().find('[data-test="chat-unread-dot-label"]').exists()).toBe(false)
    })

    it('sits on the opener while conversations hold something unread, with a line for the ear', async () => {
      await serverSays(3)
      wrapper = mountComponent()

      // On the symbol itself, and no figure in it.
      const dot = opener().find('.navbar-toggler-icon [data-test="chat-unread-dot"]')
      expect(dot.exists()).toBe(true)
      expect(dot.text()).toBe('')
      expect(dot.attributes('aria-hidden')).toBe('true')
      const label = opener().find('[data-test="chat-unread-dot-label"]')
      expect(label.classes()).toContain('visually-hidden')
      expect(label.text()).toBe('chatThread.unreadDot')
    })

    it('goes when nothing waits any more', async () => {
      await serverSays(1)
      wrapper = mountComponent()
      expect(opener().find('[data-test="chat-unread-dot"]').exists()).toBe(true)

      stopChatUpdates()
      await flushPromises()

      expect(opener().find('[data-test="chat-unread-dot"]').exists()).toBe(false)
    })

    /**
     * ⛔ Laid over the symbol's corner: the bar must not move when the dot comes and goes. jsdom
     * lays nothing out, so the stylesheet says it -- read without its comments.
     */
    it('lies over the corner and moves nothing, in the stylesheet', () => {
      const style = readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), 'Navbar.vue'),
        'utf8',
      ).replace(/\/\*[\s\S]*?\*\//g, '')
      const rule = (selector) =>
        style.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

      expect(rule('\\.chat-unread-dot')).toMatch(/position:\s*absolute/)
      expect(rule('\\.chat-unread-dot')).toMatch(/background:\s*#c08935/)
      expect(rule('\\.navbar-menu-opener \\.navbar-toggler-icon')).toMatch(/position:\s*relative/)
    })
  })

  /**
   * The height of this navbar is somebody else's problem, and that is the whole point.
   *
   * Below 450px it is `position: fixed` and translucent, so the page needs matching clearance
   * underneath -- `.breadcrumb`'s `padding-top` in layouts/DashboardLayout.vue plus
   * `.page-breadcrumb`'s `margin-top` in Breadcrumb/breadcrumb.vue, 69 + 48 = 117px today
   -- measured on the phone, after 131 turned out to be about twice the room needed.
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
