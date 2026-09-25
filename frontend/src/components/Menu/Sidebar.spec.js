import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest'
import Sidebar from './Sidebar.vue'
import { startChatUpdates, stopChatUpdates } from '@/composables/useChatUpdates'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import CONFIG from '../../config'
import { BBadge, BImg, BNav, BNavItem } from 'bootstrap-vue-next'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    path: '/',
  })),
}))

// Mock Apollo
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useResult: vi.fn(),
}))

// Mock i18n
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      navigation: {
        overview: 'Overview',
        send: 'Send',
        calculator: 'Calculator',
        transactions: 'Transactions',
        contacts: 'Contacts & Chat',
        matching: 'Matching',
        circles: 'Circles',
        usersearch: 'User Search',
        settings: 'Settings',
        admin_area: 'Admin Area',
        logout: 'Logout',
      },
      info: 'Info',
      creation: 'Creation',
      chatThread: {
        unreadBadge: '{n} conversation with new messages | {n} conversations with new messages',
      },
    },
  },
})

// Mock Vuex store
const createVuexStore = (state = {}) =>
  createStore({
    state: () => ({
      hasElopage: true,
      role: null,
      ...state,
    }),
    getters: {
      isAdmin: (state) => state.role === 'ADMIN',
    },
  })

CONFIG.GMS_ACTIVE = true
CONFIG.HUMHUB_ACTIVE = true
// The suite below counts nav items and addresses matching by index, so it needs
// the flag on. The off state is covered in its own block at the end.
CONFIG.MATCHING_ACTIVE = true

describe('Sidebar', () => {
  let wrapper
  let store

  const mountComponent = (storeState = {}) => {
    store = createVuexStore(storeState)
    return mount(Sidebar, {
      global: {
        plugins: [store, i18n],
        stubs: ['router-link', 'i-bi-cash'],
        components: {
          BNav,
          BBadge,
          BNavItem,
          BImg,
        },
      },
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = mountComponent()
    })

    it('renders the component', () => {
      expect(wrapper.find('div#component-sidebar').exists()).toBe(true)
    })

    describe('the general section', () => {
      it('has six nav-items', () => {
        const generalSection = wrapper.findAll('ul')[0]
        expect(generalSection.findAll('.nav-item')).toHaveLength(6)
      })

      it('has nav-item "navigation.overview" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(0).text()).toContain('Overview')
      })

      /**
       * The order in three pairs (Bernd, E-031): what one has -- the overview, the transactions
       * behind it; what one does -- creating before sending; the people -- matching finds
       * them, "contacts & chat" keeps them.
       */
      it('lists the six in three pairs', () => {
        const labels = wrapper
          .findAll('ul')[0]
          .findAll('.nav-item')
          .map((item) => item.text())
        expect(labels).toEqual([
          'Overview',
          'Transactions',
          'Creation',
          'Send',
          'Matching',
          'Contacts & Chat',
        ])
      })

      it('has nav-item "navigation.transactions" right after the overview', () => {
        expect(wrapper.findAll('.nav-item').at(1).text()).toContain('Transactions')
      })

      /**
       * ⛔ The calculator is deliberately NOT a menu entry any more. It moved to a small
       * symbol above the menu (navbar on the phone, above the sidebar on desktop) -- the
       * menu was getting long, and the calculator is a tool for those who run a till, not a
       * page everybody visits. (Bernd, 20.08.2026)
       */
      it('does not list the calculator as a menu entry', () => {
        expect(wrapper.text()).not.toContain('Calculator')
      })

      it('has nav-item "creation" third', () => {
        expect(wrapper.findAll('.nav-item').at(2).text()).toContain('Creation')
        expect(wrapper.findAll('.nav-item').at(2).attributes('data-test')).toBe('creation-menu')
      })

      it('has nav-item "navigation.send" fourth, after creating', () => {
        expect(wrapper.findAll('.nav-item').at(3).text()).toContain('Send')
        expect(wrapper.findAll('.nav-item').at(3).find('a').attributes('href')).toBe('/send')
      })

      it('has nav-item "matching" fifth', () => {
        expect(wrapper.findAll('.nav-item').at(4).text()).toContain('Matching')
      })

      // Beside matching, last of the six: with the chat the list is people more than bookings
      // (E-031; it stood under the transactions before, KF-008).
      it('has nav-item "navigation.contacts" last, beside matching', () => {
        expect(wrapper.findAll('.nav-item').at(5).text()).toContain('Contacts & Chat')
        expect(wrapper.findAll('.nav-item').at(5).find('a').attributes('href')).toBe('/contacts')
      })

      it('has nav-item "info" in navbar', () => {
        expect(wrapper.findAll('.nav-item').at(6).text()).toContain('Info')
      })
    })

    describe('the specific section', () => {
      describe('for standard users', () => {
        beforeEach(() => {
          wrapper = mountComponent({ role: null })
        })

        it('has two nav-items', () => {
          expect(wrapper.findAll('.nav-item').slice(7)).toHaveLength(2)
        })

        it('has nav-item "navigation.settings" in navbar', () => {
          expect(wrapper.find('[data-test="settings-menu"]').text()).toContain('Settings')
        })

        it('has nav-item "navigation.logout" in navbar', () => {
          expect(wrapper.find('[data-test="logout-menu"]').text()).toContain('Logout')
        })
      })

      describe('for admin users', () => {
        beforeEach(() => {
          wrapper = mountComponent({ role: 'ADMIN' })
        })

        it('has three nav-items', () => {
          expect(wrapper.findAll('.nav-item').slice(7)).toHaveLength(3)
        })

        it('has nav-item "navigation.settings" in navbar', () => {
          expect(wrapper.find('[data-test="settings-menu"]').text()).toContain('Settings')
        })

        it('has nav-item "navigation.admin_area" in navbar', () => {
          const adminItems = wrapper.findAll('.nav-item').slice(7)
          expect(adminItems.length).toBeGreaterThan(1)
          expect(adminItems[1].text()).toContain('Admin Area')
        })

        it('has nav-item "navigation.logout" in navbar', () => {
          expect(wrapper.find('[data-test="logout-menu"]').text()).toContain('Logout')
        })
      })
    })
  })
})

// ES-021: the whole creation area is gone for a project account. Both directions on
// purpose -- an "is absent" test alone stays green when the item goes missing for good.
describe('Sidebar and the project account', () => {
  const mountSidebar = (state) =>
    mount(Sidebar, {
      global: {
        plugins: [createVuexStore(state), i18n],
        stubs: ['router-link', 'i-bi-cash'],
        components: { BNav, BBadge, BNavItem, BImg },
      },
    })

  it('offers "Creation" to a person who may create', () => {
    const wrapper = mountSidebar({ creationAllowed: true })
    expect(wrapper.find('[data-test="creation-menu"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Creation')
  })

  it('offers it as well while the answer is not known yet - the default every account has', () => {
    const wrapper = mountSidebar({ creationAllowed: null })
    expect(wrapper.find('[data-test="creation-menu"]').exists()).toBe(true)
  })

  it('does not offer it to a project account, and keeps everything else', () => {
    const wrapper = mountSidebar({ creationAllowed: false })
    expect(wrapper.find('[data-test="creation-menu"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Creation')
    for (const label of ['Overview', 'Send', 'Transactions', 'Contacts', 'Info', 'Settings']) {
      expect(wrapper.text()).toContain(label)
    }
    // The pairs close up around the gap.
    expect(
      wrapper
        .findAll('ul')[0]
        .findAll('.nav-item')
        .map((item) => item.text()),
    ).toEqual(['Overview', 'Transactions', 'Send', 'Matching', 'Contacts & Chat'])
  })

  it('mounts without the contributions link the active-route watcher looks for', () => {
    expect(() => mountSidebar({ creationAllowed: false })).not.toThrow()
  })
})

describe('Sidebar with MATCHING_ACTIVE off', () => {
  const mountSidebar = () =>
    mount(Sidebar, {
      global: {
        plugins: [createVuexStore(), i18n],
        stubs: ['router-link', 'i-bi-cash'],
        components: { BNav, BBadge, BNavItem, BImg },
      },
    })

  beforeEach(() => {
    CONFIG.MATCHING_ACTIVE = false
  })

  afterEach(() => {
    // Leave the flag as the rest of this file expects it, whatever the order.
    CONFIG.MATCHING_ACTIVE = true
  })

  it('does not offer the matching menu item', () => {
    expect(mountSidebar().text()).not.toContain('Matching')
  })

  it('drops the item from the general section, leaving five', () => {
    const generalSection = mountSidebar().findAll('ul')[0]
    expect(generalSection.findAll('.nav-item')).toHaveLength(5)
    expect(generalSection.findAll('.nav-item').map((item) => item.text())).toEqual([
      'Overview',
      'Transactions',
      'Creation',
      'Send',
      'Contacts & Chat',
    ])
  })

  it('keeps every other menu item', () => {
    // No 'Calculator' in this list any more: it moved out of the menu altogether, to the
    // small symbol above it. See the main describe.
    const text = mountSidebar().text()
    for (const label of [
      'Overview',
      'Send',
      'Transactions',
      'Contacts',
      'Creation',
      'Info',
      'Settings',
    ]) {
      expect(text).toContain(label)
    }
  })

  it('mounts without the matching link the active-route watcher looks for', () => {
    // syncNavActive runs on mount and reaches for matchingLink; with the item
    // gone the ref stays null. This asserts the guard in setLinkActive holds.
    expect(() => mountSidebar()).not.toThrow()
  })
})

/**
 * The gold mark on "contacts & chat": how many CONVERSATIONS hold something unread, from the
 * chat's beat. Measured through the real module (useChatUpdates) with a server that answers --
 * not through a stand-in for the figure, which would say nothing about where the menu reads it.
 */
describe('Sidebar and the chat', () => {
  const answerWith = (unreadConversations) => ({
    query: vi.fn(async () => ({
      data: {
        newChatMessagesSince: { latestId: 1, unreadConversations, messages: [], hasMore: false },
      },
    })),
  })

  const mountWithUnread = async (unread) => {
    startChatUpdates(answerWith(unread))
    await flushPromises()
    return mount(Sidebar, {
      global: {
        plugins: [createVuexStore(), i18n],
        stubs: ['router-link', 'i-bi-cash'],
        components: { BNav, BBadge, BNavItem, BImg },
      },
    })
  }
  const contactsEntry = (wrapper) =>
    wrapper.findAll('.nav-item').find((item) => item.find('a').attributes('href') === '/contacts')
  const badge = (wrapper) => wrapper.find('[data-test="chat-unread-badge"]')
  const sentence = (wrapper) => wrapper.find('[data-test="chat-unread-badge-label"]')

  afterEach(() => {
    stopChatUpdates()
  })

  it('shows no mark while nothing waits', async () => {
    const wrapper = await mountWithUnread(0)
    expect(badge(wrapper).exists()).toBe(false)
    expect(sentence(wrapper).exists()).toBe(false)
    expect(contactsEntry(wrapper).text()).toBe('Contacts & Chat')
  })

  /**
   * ⛔ On the corner of the symbol, not beside the word: at the desk the card is 180 px and a
   * mark beside the word was cut off at its edge in every language (measured in the probe).
   */
  it('shows the number of conversations on the symbol of the entry', async () => {
    const wrapper = await mountWithUnread(3)
    const link = contactsEntry(wrapper).find('a')

    const holder = link.find('.chat-menu-icon')
    // The symbol (an auto-imported icon, unresolved in this test: found by its class).
    expect(holder.find('.svg-icon').exists()).toBe(true)
    expect(holder.find('[data-test="chat-unread-badge"]').exists()).toBe(true)
    // The figure is for the eye only.
    expect(badge(wrapper).text()).toBe('3')
    expect(badge(wrapper).attributes('aria-hidden')).toBe('true')
  })

  // The sentence is part of what the link is called, and it comes AFTER the word: a screen
  // reader says "Contacts & Chat, 3 conversations with new messages".
  it('says the number as a sentence after the word, for the ear', async () => {
    const wrapper = await mountWithUnread(3)
    const link = contactsEntry(wrapper).find('a')
    const word = link.find('.chat-menu-label')

    expect(link.find('[data-test="chat-unread-badge-label"]').exists()).toBe(true)
    expect(sentence(wrapper).classes()).toContain('visually-hidden')
    expect(sentence(wrapper).text()).toBe('3 conversations with new messages')
    expect(
      word.element.compareDocumentPosition(sentence(wrapper).element) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('says one conversation in the singular', async () => {
    const wrapper = await mountWithUnread(1)
    expect(sentence(wrapper).text()).toBe('1 conversation with new messages')
  })

  // The mark is small: past 99 the figure stops, the sentence keeps the number.
  it('stops the figure at 99+', async () => {
    const wrapper = await mountWithUnread(120)
    expect(badge(wrapper).text()).toBe('99+')
    expect(sentence(wrapper).text()).toBe('120 conversations with new messages')
  })

  it('goes when the last conversation is read', async () => {
    const wrapper = await mountWithUnread(2)
    expect(badge(wrapper).exists()).toBe(true)

    stopChatUpdates()
    await flushPromises()

    expect(badge(wrapper).exists()).toBe(false)
  })

  /**
   * Gold B with white figures, the gold of the chat's send buttons (E-032 point 5). jsdom draws
   * nothing, so the stylesheet says it -- read without its comments.
   */
  const wrapperClassOfTheEntry = () => {
    const wrapper = mount(Sidebar, {
      global: {
        plugins: [createVuexStore(), i18n],
        stubs: ['router-link', 'i-bi-cash'],
        components: { BNav, BBadge, BNavItem, BImg },
      },
    })
    return contactsEntry(wrapper).find('.sidebar-menu-item-wrapper').classes()
  }

  it('is gold with white figures, on the symbol, in the stylesheet', () => {
    const style = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'Sidebar.vue'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
    const rule = (selector) => style.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

    expect(rule('\\.chat-unread-badge')).toMatch(/background:\s*#c08935/)
    expect(rule('\\.chat-unread-badge')).toMatch(/color:\s*#fff/)
    // Hung on the symbol's corner: it takes no room in the row.
    expect(rule('\\.chat-unread-badge')).toMatch(/position:\s*absolute/)
    expect(rule('\\.chat-menu-icon')).toMatch(/position:\s*relative/)
    // ⛔ Symbol and word in a row, the word on one line: as a line of text, the longest word
    // ("Contacten en chat") dropped whole under its symbol (measured in the probe).
    expect(rule('\\.chat-menu-item')).toMatch(/display:\s*flex/)
    expect(rule('\\.chat-menu-label')).toMatch(/white-space:\s*nowrap/)
    expect(wrapperClassOfTheEntry()).toContain('chat-menu-item')
  })
})
