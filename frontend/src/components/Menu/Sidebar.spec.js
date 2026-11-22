import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest'
import { Sidebar } from './Sidebar'
import { pollChatNow, startChatUpdates, stopChatUpdates } from '@/composables/useChatUpdates'
import { walletStore } from '@test/walletStore'
import { createI18n } from 'vue-i18n'
import CONFIG from '../../config'
import { BBadge, BImg, BNav, BNavItem } from 'bootstrap-vue-next'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Mock vue-router: the route as the menu reads it -- its address, and the records it matched
// (the support's entry is lit by the record, K5). Changed by a test, put back after it.
const mockRoute = { path: '/', matched: [] }
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => mockRoute),
  // The logo's link is imported from the same module; the mounts stub it by its name.
  RouterLink: { name: 'RouterLink', template: '<a><slot /></a>' },
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
        adminCreations:
          '{n} creation is waiting for moderation | {n} creations are waiting for moderation',
        adminSupportTickets:
          '{n} support request is waiting for moderation | {n} support requests are waiting for moderation',
        overview: 'Overview',
        send: 'Send',
        calculator: 'Calculator',
        transactions: 'Transactions',
        contacts: 'Chat',
        matching: 'Matching',
        circles: 'Circles',
        settings: 'Settings',
        admin_area: 'Admin',
        logout: 'Logout',
        support: 'Support',
      },
      info: 'Info',
      support: {
        badge: '{n} request with a question back | {n} requests with a question back',
      },
      creation: 'Creation',
      contribution: {
        badge: '{n} contribution with a question back | {n} contributions with a question back',
      },
      chatThread: {
        unreadBadge: '{n} conversation with new messages | {n} conversations with new messages',
      },
    },
  },
})

const createWalletStore = (state = {}) =>
  walletStore({
    role: null,
    ...state,
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
    store = createWalletStore(storeState)
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
        expect(labels).toEqual(['Overview', 'Transactions', 'Creation', 'Send', 'Matching', 'Chat'])
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
        expect(wrapper.findAll('.nav-item').at(5).text()).toContain('Chat')
        expect(wrapper.findAll('.nav-item').at(5).find('a').attributes('href')).toBe('/contacts')
      })

      // "Support" in the place of "Information" (K5): a switch not known yet reads as on
      it('has nav-item "Support" where "Information" stood', () => {
        expect(wrapper.findAll('.nav-item').at(6).text()).toContain('Support')
        expect(wrapper.findAll('.nav-item').at(6).attributes('data-test')).toBe('support-menu')
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

        /**
         * The shield is a symbol of this menu like the others: `svg-icon` is what gives it
         * their muted tone and size (navbar.scss). Without the class it took the colour of
         * the entry's text and was the one lit symbol in the list (Bernd, 08.10.2026).
         */
        it("gives the admin entry a symbol in the menu's own tone", () => {
          expect(wrapper.find('[data-test="admin-menu-icon"]').classes()).toContain('svg-icon')
        })

        it('has nav-item "navigation.admin_area" in navbar', () => {
          const adminItems = wrapper.findAll('.nav-item').slice(7)
          expect(adminItems.length).toBeGreaterThan(1)
          expect(adminItems[1].text()).toContain('Admin')
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
        plugins: [createWalletStore(state), i18n],
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
    for (const label of ['Overview', 'Send', 'Transactions', 'Chat', 'Support', 'Settings']) {
      expect(wrapper.text()).toContain(label)
    }
    // The pairs close up around the gap.
    expect(
      wrapper
        .findAll('ul')[0]
        .findAll('.nav-item')
        .map((item) => item.text()),
    ).toEqual(['Overview', 'Transactions', 'Send', 'Matching', 'Chat'])
  })

  it('mounts without the contributions link the active-route watcher looks for', () => {
    expect(() => mountSidebar({ creationAllowed: false })).not.toThrow()
  })
})

describe('Sidebar with MATCHING_ACTIVE off', () => {
  const mountSidebar = () =>
    mount(Sidebar, {
      global: {
        plugins: [createWalletStore(), i18n],
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
      'Chat',
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
      'Chat',
      'Creation',
      'Support',
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
        plugins: [createWalletStore(), i18n],
        // The entry's icon is imported (`~icons/…`) and carries the icon's own name: stubbed,
        // it shows which one it is.
        stubs: ['router-link', 'i-bi-cash', 'MdiChatOutline'],
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
    expect(contactsEntry(wrapper).text()).toBe('Chat')
  })

  // The entry is called "Chat" (Bernd, 04.10.2026), so its symbol is the speech bubble the
  // empty thread shows, and no longer the contact card.
  it('carries the speech bubble and not the contact card', async () => {
    const wrapper = await mountWithUnread(0)
    const html = contactsEntry(wrapper).html()
    expect(html).toContain('mdi-chat-outline-stub')
    expect(html).not.toContain('account-box')
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
  // reader says "Chat, 3 conversations with new messages".
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
        plugins: [createWalletStore(), i18n],
        stubs: ['router-link', 'i-bi-cash'],
        components: { BNav, BBadge, BNavItem, BImg },
      },
    })
    return contactsEntry(wrapper).find('.sidebar-menu-item-wrapper').classes()
  }

  it('is gold with white figures, on the symbol, in the stylesheet', () => {
    // The style module: every rule stands under the root's class (`:global(.chat-unread-badge)`).
    const style = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'Sidebar.module.scss'),
      'utf8',
    ).replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = (selector) =>
      style.match(new RegExp(`:global\\(${selector}\\)\\s*\\{([^}]*)\\}`))?.[1] ?? ''

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

/**
 * "Support" in the place of "Information" (K5, SUA-009, SUA-024 1 b): while the community lets
 * its members file new requests -- not known yet reads as on --, and while the member has a
 * request not closed, also with the switch off. The switch comes from the store, the member's
 * numbers through the real beat (useChatUpdates), as the chat's do.
 */
describe('Sidebar and the support (K5)', () => {
  const answerWith = (supportTicketsMenu) => ({
    query: vi.fn(async () => ({
      data: {
        newChatMessagesSince: { latestId: 1, unreadConversations: 0, messages: [], hasMore: false },
        supportTicketsMenu,
      },
    })),
  })
  const beatBrings = async (supportTicketsMenu) => {
    startChatUpdates(answerWith(supportTicketsMenu))
    await flushPromises()
  }
  const mountSidebar = (state = {}) =>
    mount(Sidebar, {
      global: {
        plugins: [createWalletStore(state), i18n],
        // The two icons are imported (`~icons/…`) and carry the icon's own name: stubbed, they
        // show which one stands in the entry.
        stubs: ['router-link', 'i-bi-cash', 'MdiHelpCircle', 'MdiInformation'],
        components: { BNav, BBadge, BNavItem, BImg },
      },
    })
  const supportEntry = (wrapper) => wrapper.find('[data-test="support-menu"]')
  const informationEntry = (wrapper) =>
    wrapper
      .findAll('.nav-item')
      .find((item) => item.find('a').attributes('href') === '/information')
  const badge = (wrapper) => wrapper.find('[data-test="support-badge"]')
  const sentence = (wrapper) => wrapper.find('[data-test="support-badge-label"]')
  const lit = (wrapper) => supportEntry(wrapper).find('a').classes().includes('active-route')

  afterEach(() => {
    stopChatUpdates()
    mockRoute.path = '/'
    mockRoute.matched = []
  })

  it.each([
    [null, 'not known yet'],
    [true, 'on'],
  ])('stands in the place of "Information" while the switch is %s (%s)', (active) => {
    const wrapper = mountSidebar({ supportTicketsActive: active })
    expect(supportEntry(wrapper).find('a').attributes('href')).toBe('/support')
    expect(supportEntry(wrapper).text()).toBe('Support')
    expect(informationEntry(wrapper)).toBeUndefined()
    expect(wrapper.text()).not.toContain('Info')
    // in the very place: the first of the second section
    expect(wrapper.findAll('.nav-item').at(6).attributes('data-test')).toBe('support-menu')
  })

  it('carries the question mark in a circle, in the tone of the others', () => {
    const wrapper = mountSidebar()
    expect(supportEntry(wrapper).html()).toContain('mdi-help-circle-stub')
    expect(supportEntry(wrapper).html()).not.toContain('mdi-information-stub')
    expect(wrapper.find('[data-test="support-menu-icon"]').classes()).toContain('svg-icon')
  })

  it('gives "Information" back while new requests are off and nothing of the member\'s is open', async () => {
    await beatBrings({ active: false, inProgress: 0, unfinished: 0 })
    const wrapper = mountSidebar({ supportTicketsActive: false })
    expect(supportEntry(wrapper).exists()).toBe(false)
    expect(informationEntry(wrapper).text()).toBe('Info')
    expect(wrapper.findAll('.nav-item').at(6).find('a').attributes('href')).toBe('/information')
    expect(wrapper.findAll('.nav-item')).toHaveLength(mountSidebar().findAll('.nav-item').length)
  })

  it('stays while the member has a request not closed, also with the switch off', async () => {
    await beatBrings({ active: false, inProgress: 0, unfinished: 1 })
    const wrapper = mountSidebar({ supportTicketsActive: false })
    expect(supportEntry(wrapper).exists()).toBe(true)
    expect(informationEntry(wrapper)).toBeUndefined()
  })

  it('shows no mark while no question back waits', async () => {
    await beatBrings({ active: true, inProgress: 0, unfinished: 2 })
    const wrapper = mountSidebar()
    expect(badge(wrapper).exists()).toBe(false)
    expect(sentence(wrapper).exists()).toBe(false)
    expect(supportEntry(wrapper).text()).toBe('Support')
  })

  // in the form of the chat's mark, on the corner of the symbol, for the same reason
  it('shows the number of requests with a question back on the symbol', async () => {
    await beatBrings({ active: true, inProgress: 2, unfinished: 3 })
    const wrapper = mountSidebar()
    const holder = supportEntry(wrapper).find('.chat-menu-icon')
    expect(holder.find('[data-test="support-badge"]').exists()).toBe(true)
    expect(badge(wrapper).text()).toBe('2')
    expect(badge(wrapper).attributes('aria-hidden')).toBe('true')
    expect(badge(wrapper).classes()).toContain('chat-unread-badge')
  })

  it('says the number as a sentence after the word, for the ear', async () => {
    await beatBrings({ active: true, inProgress: 2, unfinished: 2 })
    const wrapper = mountSidebar()
    const word = supportEntry(wrapper).find('.chat-menu-label')
    expect(sentence(wrapper).classes()).toContain('visually-hidden')
    expect(sentence(wrapper).text()).toBe('2 requests with a question back')
    expect(
      word.element.compareDocumentPosition(sentence(wrapper).element) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('says one request in the singular', async () => {
    await beatBrings({ active: true, inProgress: 1, unfinished: 1 })
    expect(sentence(mountSidebar()).text()).toBe('1 request with a question back')
  })

  it('stops the figure at 99+', async () => {
    await beatBrings({ active: true, inProgress: 120, unfinished: 120 })
    const wrapper = mountSidebar()
    expect(badge(wrapper).text()).toBe('99+')
    expect(sentence(wrapper).text()).toBe('120 requests with a question back')
  })

  it("goes when the beat stops: the numbers were the member's", async () => {
    await beatBrings({ active: true, inProgress: 2, unfinished: 2 })
    const wrapper = mountSidebar()
    expect(badge(wrapper).exists()).toBe(true)
    stopChatUpdates()
    await flushPromises()
    expect(badge(wrapper).exists()).toBe(false)
  })

  /**
   * /support leads to a tab, and BNavItem lights only an exact match: the entry is lit by hand on
   * every address under it -- by the route's record, so an address typed in another case counts.
   */
  it.each([
    ['/support/write', '/support/:tab/:page?', true],
    ['/support/my-requests/2', '/support/:tab/:page?', true],
    ['/Support/Information', '/support/:tab/:page?', true],
    ['/overview', '/overview', false],
    ['/information', '/information', false],
  ])('on %s (record %s) is lit: %s', (path, record, on) => {
    mockRoute.path = path
    mockRoute.matched = [{ path: record }]
    expect(lit(mountSidebar())).toBe(on)
  })

  it('lights the entry that comes in the place of "Information", without a route change', async () => {
    mockRoute.path = '/support/my-requests'
    mockRoute.matched = [{ path: '/support/:tab/:page?' }]
    const wrapper = mountSidebar({ supportTicketsActive: false })
    expect(supportEntry(wrapper).exists()).toBe(false)

    await beatBrings({ active: false, inProgress: 1, unfinished: 1 })
    await wrapper.vm.$nextTick()

    expect(supportEntry(wrapper).exists()).toBe(true)
    expect(lit(wrapper)).toBe(true)
  })
})

/**
 * The mark at "Schöpfen" (Bernd, 16.11.2026): the member's contributions with a question back
 * from the moderation, as the support's mark counts its requests -- in the form of the chat's
 * mark, on the corner of the symbol. The number comes through the real beat (useChatUpdates).
 */
describe('Sidebar and the contributions with a question back', () => {
  const answer = (countContributionsInProgress) => ({
    data: {
      newChatMessagesSince: { latestId: 1, unreadConversations: 0, messages: [], hasMore: false },
      countContributionsInProgress,
    },
  })
  const beatBrings = async (count) => {
    startChatUpdates({ query: vi.fn(async () => answer(count)) })
    await flushPromises()
  }
  const mountSidebar = (state = {}) =>
    mount(Sidebar, {
      global: {
        plugins: [createWalletStore(state), i18n],
        stubs: ['router-link', 'i-bi-cash'],
        components: { BNav, BBadge, BNavItem, BImg },
      },
    })
  const creationEntry = (wrapper) => wrapper.find('[data-test="creation-menu"]')
  const badge = (wrapper) => wrapper.find('[data-test="creation-badge"]')
  const sentence = (wrapper) => wrapper.find('[data-test="creation-badge-label"]')

  afterEach(() => {
    stopChatUpdates()
  })

  it('shows no mark while no contribution waits for an answer', async () => {
    await beatBrings(0)
    const wrapper = mountSidebar()
    expect(badge(wrapper).exists()).toBe(false)
    expect(sentence(wrapper).exists()).toBe(false)
    expect(creationEntry(wrapper).text()).toBe('Creation')
  })

  it('shows the number on the symbol of the entry', async () => {
    await beatBrings(2)
    const wrapper = mountSidebar()
    const holder = creationEntry(wrapper).find('.chat-menu-icon')
    expect(holder.find('[data-test="creation-menu-icon"]').classes()).toContain('svg-icon')
    expect(holder.find('[data-test="creation-badge"]').exists()).toBe(true)
    expect(badge(wrapper).text()).toBe('2')
    expect(badge(wrapper).attributes('aria-hidden')).toBe('true')
    expect(badge(wrapper).classes()).toContain('chat-unread-badge')
    // symbol and word in a row, the word on one line, as the chat's and the support's entries
    expect(creationEntry(wrapper).find('.sidebar-menu-item-wrapper').classes()).toContain(
      'chat-menu-item',
    )
  })

  it('says the number as a sentence after the word, for the ear', async () => {
    await beatBrings(2)
    const wrapper = mountSidebar()
    const word = creationEntry(wrapper).find('.chat-menu-label')
    expect(word.text()).toBe('Creation')
    expect(sentence(wrapper).classes()).toContain('visually-hidden')
    expect(sentence(wrapper).text()).toBe('2 contributions with a question back')
    expect(
      word.element.compareDocumentPosition(sentence(wrapper).element) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('says one contribution in the singular', async () => {
    await beatBrings(1)
    expect(sentence(mountSidebar()).text()).toBe('1 contribution with a question back')
  })

  it('stops the figure at 99+', async () => {
    await beatBrings(120)
    const wrapper = mountSidebar()
    expect(badge(wrapper).text()).toBe('99+')
    expect(sentence(wrapper).text()).toBe('120 contributions with a question back')
  })

  it('keeps what it showed where the server could not count', async () => {
    const query = vi.fn().mockResolvedValueOnce(answer(2)).mockResolvedValueOnce(answer(null))
    startChatUpdates({ query })
    await flushPromises()
    const wrapper = mountSidebar()
    expect(badge(wrapper).text()).toBe('2')

    await pollChatNow()
    await flushPromises()

    expect(query).toHaveBeenCalledTimes(2)
    expect(badge(wrapper).text()).toBe('2')
  })

  it("goes when the beat stops: the number was the member's", async () => {
    await beatBrings(2)
    const wrapper = mountSidebar()
    expect(badge(wrapper).exists()).toBe(true)
    stopChatUpdates()
    await flushPromises()
    expect(badge(wrapper).exists()).toBe(false)
  })

  it('is not there for a project account, whose menu has no "Schöpfen"', async () => {
    await beatBrings(1)
    const wrapper = mountSidebar({ creationAllowed: false })
    expect(creationEntry(wrapper).exists()).toBe(false)
    expect(badge(wrapper).exists()).toBe(false)
  })
})

/**
 * "Meine Gruppen" (MG3): behind "Admin", what waits for the moderation in the member's own groups,
 * in Bernd's form -- the creations raised in a square box, the support requests lowered and round.
 * The numbers come through the real beat (useChatUpdates), as the chat's do; where they stand on
 * the screen, and that they move nothing, is measured in the built wallet.
 */
describe('Sidebar and what waits for the moderation (MG3)', () => {
  const answer = (moderationWaiting) => ({
    data: {
      newChatMessagesSince: { latestId: 1, unreadConversations: 0, messages: [], hasMore: false },
      moderationWaiting,
    },
  })
  const beatBrings = async (waiting) => {
    startChatUpdates({ query: vi.fn(async () => answer(waiting)) })
    await flushPromises()
  }
  const mountSidebar = (state = { role: 'ADMIN' }) =>
    mount(Sidebar, {
      global: {
        plugins: [createWalletStore(state), i18n],
        stubs: ['router-link', 'i-bi-cash'],
        components: { BNav, BBadge, BNavItem, BImg },
      },
    })
  const adminEntry = (wrapper) =>
    wrapper.findAll('.nav-item').find((item) => item.find('[data-test="admin-menu-icon"]').exists())
  const square = (wrapper) => wrapper.find('[data-test="admin-creations-badge"]')
  const round = (wrapper) => wrapper.find('[data-test="admin-support-badge"]')
  const sentences = (wrapper) =>
    ['admin-creations-badge-label', 'admin-support-badge-label']
      .map((name) => wrapper.find(`[data-test="${name}"]`))
      .filter((found) => found.exists())
      .map((found) => found.text())
  const rows = (wrapper) => adminEntry(wrapper).findAll('.admin-mark-row')

  afterEach(() => {
    stopChatUpdates()
  })

  it('shows no mark while nothing waits, and the entry as before', async () => {
    await beatBrings({ creations: 0, supportTickets: 0 })
    const wrapper = mountSidebar()
    expect(adminEntry(wrapper).find('.admin-marks').exists()).toBe(false)
    expect(sentences(wrapper)).toEqual([])
    expect(adminEntry(wrapper).text()).toBe('Admin')
  })

  it('shows both behind the word: the creations above in a square box, the requests below and round', async () => {
    await beatBrings({ creations: 3, supportTickets: 2 })
    const wrapper = mountSidebar()
    const label = adminEntry(wrapper).find('.admin-menu-label')
    expect(label.element.firstChild.textContent).toBe('Admin')
    const marks = label.find('.admin-marks')
    expect(marks.attributes('aria-hidden')).toBe('true')
    expect(rows(wrapper)).toHaveLength(2)
    expect(rows(wrapper)[0].find('[data-test="admin-creations-badge"]').exists()).toBe(true)
    expect(rows(wrapper)[1].find('[data-test="admin-support-badge"]').exists()).toBe(true)
    expect(square(wrapper).text()).toBe('3')
    expect(round(wrapper).text()).toBe('2')
    // the chat's marks, the upper one square
    expect(square(wrapper).classes()).toEqual(
      expect.arrayContaining(['chat-unread-badge', 'admin-mark', 'admin-mark-square']),
    )
    expect(round(wrapper).classes()).toEqual(
      expect.arrayContaining(['chat-unread-badge', 'admin-mark']),
    )
    expect(round(wrapper).classes()).not.toContain('admin-mark-square')
  })

  // Where a number is not there, its place stays empty: the place says what is counted.
  it.each([
    [{ creations: 3, supportTickets: 0 }, [true, false]],
    [{ creations: 0, supportTickets: 2 }, [false, true]],
  ])('keeps each number in its own place: %o', async (waiting, shown) => {
    await beatBrings(waiting)
    const wrapper = mountSidebar()
    expect(rows(wrapper)).toHaveLength(2)
    expect(rows(wrapper).map((row) => row.find('.admin-mark').exists())).toEqual(shown)
  })

  it('says each number as a sentence after the word, for the ear, and the same to the mouse', async () => {
    await beatBrings({ creations: 3, supportTickets: 2 })
    const wrapper = mountSidebar()
    // a full stop after each, for the ear: two sentences, not one
    expect(sentences(wrapper)).toEqual([
      '3 creations are waiting for moderation.',
      '2 support requests are waiting for moderation.',
    ])
    expect(square(wrapper).attributes('title')).toBe('3 creations are waiting for moderation')
    expect(round(wrapper).attributes('title')).toBe('2 support requests are waiting for moderation')
    const word = adminEntry(wrapper).find('.admin-menu-label')
    for (const name of ['admin-creations-badge-label', 'admin-support-badge-label']) {
      const said = wrapper.find(`[data-test="${name}"]`)
      expect(said.classes()).toContain('visually-hidden')
      // after the word, outside the marks a screen reader does not hear
      expect(
        word.element.compareDocumentPosition(said.element) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
      expect(said.element.closest('[aria-hidden="true"]')).toBeNull()
    }
  })

  it('says one of each in the singular', async () => {
    await beatBrings({ creations: 1, supportTickets: 1 })
    expect(sentences(mountSidebar())).toEqual([
      '1 creation is waiting for moderation.',
      '1 support request is waiting for moderation.',
    ])
  })

  it('stops the figures at 99+, and the sentences say the number', async () => {
    await beatBrings({ creations: 120, supportTickets: 150 })
    const wrapper = mountSidebar()
    expect([square(wrapper).text(), round(wrapper).text()]).toEqual(['99+', '99+'])
    expect(sentences(wrapper)).toEqual([
      '120 creations are waiting for moderation.',
      '150 support requests are waiting for moderation.',
    ])
  })

  it('shows no support number for a moderator who does not handle the support', async () => {
    await beatBrings({ creations: 3, supportTickets: null })
    const wrapper = mountSidebar({ role: 'MODERATOR' })
    expect(square(wrapper).text()).toBe('3')
    expect(round(wrapper).exists()).toBe(false)
    expect(sentences(wrapper)).toEqual(['3 creations are waiting for moderation.'])
  })

  it('has neither the entry nor a mark for a member without a role, whatever the beat holds', async () => {
    await beatBrings({ creations: 3, supportTickets: 2 })
    const wrapper = mountSidebar({ role: null })
    expect(wrapper.find('[data-test="admin-menu-icon"]').exists()).toBe(false)
    expect(square(wrapper).exists()).toBe(false)
    expect(round(wrapper).exists()).toBe(false)
    expect(sentences(wrapper)).toEqual([])
  })

  it("goes when the beat stops: the numbers were the member's", async () => {
    await beatBrings({ creations: 3, supportTickets: 2 })
    const wrapper = mountSidebar()
    expect(square(wrapper).exists()).toBe(true)
    stopChatUpdates()
    await flushPromises()
    expect(adminEntry(wrapper).find('.admin-marks').exists()).toBe(false)
  })

  it('stands at the end of the word, taking no room in the row, in the stylesheet', () => {
    const style = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'Sidebar.module.scss'),
      'utf8',
    ).replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = (selector) =>
      style.match(new RegExp(`:global\\(${selector}\\)\\s*\\{([^}]*)\\}`))?.[1] ?? ''

    expect(rule('\\.admin-menu-label')).toMatch(/position:\s*relative/)
    expect(rule('\\.admin-marks')).toMatch(/position:\s*absolute/)
    expect(rule('\\.admin-marks')).toMatch(/left:\s*100%/)
    expect(rule('\\.admin-mark-row \\+ \\.admin-mark-row')).toMatch(/margin:\s*2px 0 0 10px/)
    // the chat's mark standing in its row, not hanging on a corner; the upper one square
    expect(rule('\\.chat-unread-badge\\.admin-mark')).toMatch(/position:\s*static/)
    expect(rule('\\.chat-unread-badge\\.admin-mark-square')).toMatch(/border-radius:\s*3px/)
  })
})
