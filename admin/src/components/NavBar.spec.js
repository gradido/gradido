import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { reactive } from 'vue'
import NavBar from './NavBar'
import { createStore } from 'vuex'
import { createRouter, createWebHistory } from 'vue-router'
import CONFIG from '../config'
import { NAV_AVATAR_SIZE } from '@/constants'
import { redirectTo } from '@/utils/redirect'

// The route the bar believes it is on. Reactive, so a test can move to another page.
const route = vi.hoisted(() => ({ current: null }))

// Mock vue-router
vi.mock('@/utils/redirect')

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRoute: vi.fn(() => route.current),
  }
})

// The routes only have to exist for the links to resolve.
const Page = { render: () => null }

const moderator = (role, more = {}) => ({
  role,
  firstName: 'Bibi',
  lastName: 'Bloxberg',
  alias: 'bibi-b',
  ...more,
})

const createVuexStore = (role = 'ADMIN', more = {}) =>
  createStore({
    state: {
      openCreations: 1,
      token: 'valid-token',
      moderator: moderator(role, more),
    },
    actions: {
      logout: vi.fn(),
    },
  })

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}))

// The keys themselves, as `$t` gives them below: what is asserted is which entry stands
// where, not its wording.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key) => key }),
}))

describe('NavBar', () => {
  let wrapper
  let store
  let router

  // The library's own components, not stubs: what is asserted below are names and markup
  // the library gives out (the menu, its entries, the opener), and a stub answers to any
  // name it is handed.
  const createWrapper = () => {
    return mount(NavBar, {
      global: {
        plugins: [store, router],
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          IBiBoxArrowUpRight: true,
        },
      },
    })
  }

  beforeEach(() => {
    route.current = reactive({ name: 'user' })
    store = createVuexStore()
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', name: 'home', component: Page },
        { path: '/user', name: 'user', component: Page },
        { path: '/creation-confirm', name: 'creation-confirm', component: Page },
        { path: '/contribution-links', name: 'contribution-links', component: Page },
        { path: '/federation', name: 'federation', component: Page },
        { path: '/projectBranding', name: 'projectBranding', component: Page },
        { path: '/creaSettings', name: 'creaSettings', component: Page },
        { path: '/chat', name: 'chat', component: Page },
        { path: '/creation-groups', name: 'creation-groups', component: Page },
        { path: '/statistic', name: 'statistic', component: Page },
      ],
    })
    vi.mocked(redirectTo).mockClear()

    wrapper = createWrapper()
  })

  // What stands in the bar itself, in both shapes of it.
  const barLinks = () =>
    wrapper
      .findAll('.navbar-collapse .navbar-nav > li.nav-item:not(.dropdown):not(.d-lg-none) > a')
      .map((item) => item.attributes('href'))
  // The menu of one group, as the wide bar shows it ...
  const menu = (name) => wrapper.find(`[data-test="navbar-group-${name}"]`)
  const menuLinks = (name) =>
    menu(name)
      .findAll('.dropdown-item')
      .map((item) => item.attributes('href'))
  // ... and everything the opened list of the narrow bar shows below the bar's own entries.
  const listed = () =>
    wrapper
      .findAll('.navbar-collapse .navbar-nav > li.d-lg-none')
      .map((item) =>
        item.classes('navbar-group-heading') ? item.text() : item.find('a').attributes('href'),
      )

  const HELP = 'https://gradido.net/coin/moderators-tutorial/'

  it('renders the component', () => {
    expect(wrapper.find('.component-nabvar').exists()).toBe(true)
  })

  describe('home', () => {
    it('is the coin and the name of the community, one link to the start page', () => {
      const home = wrapper.find('[data-test="navbar-home"]')
      expect(home.element.tagName).toBe('A')
      expect(home.attributes('href')).toBe('/')
      expect(home.find('img').exists()).toBe(true)
      expect(home.text()).toBe(CONFIG.COMMUNITY_NAME)
    })
  })

  describe('Navbar Menu', () => {
    it('keeps the two daily tools in the bar', () => {
      expect(barLinks()).toEqual(['/user', '/creation-confirm'])
    })

    it('gathers what informs under one menu', () => {
      expect(menu('information').find('.dropdown-toggle').text()).toBe('navbar.information')
      expect(menuLinks('information')).toEqual(['/federation', '/statistic', HELP])
    })

    it('gathers the settings under one menu', () => {
      expect(menu('settings').find('.dropdown-toggle').text()).toBe('navbar.settings')
      expect(menuLinks('settings')).toEqual([
        '/contribution-links',
        '/projectBranding',
        '/creation-groups',
        '/creaSettings',
        '/chat',
      ])
    })

    // Below the breakpoint there is no second menu to open: the groups are headings in the
    // list, and the list holds the same pages in the same order.
    it('lists the same pages under headings where the bar is narrow', () => {
      expect(listed()).toEqual([
        'navbar.information',
        ...menuLinks('information'),
        'navbar.settings',
        ...menuLinks('settings'),
      ])
    })

    it('opens the help in a new tab and says so with a sign', () => {
      const help = menu('information').findAll('.dropdown-item').at(-1)
      expect(help.attributes('target')).toBe('_blank')
      expect(help.attributes('rel')).toContain('noopener')
      expect(help.findComponent({ name: 'IBiBoxArrowUpRight' }).exists()).toBe(true)
      // Nothing else leaves the interface.
      expect(wrapper.findAll('[target="_blank"]')).toHaveLength(2)
    })

    describe('on a page of a group', () => {
      beforeEach(async () => {
        route.current.name = 'creaSettings'
        await wrapper.vm.$nextTick()
      })

      it('marks the group in the bar and the page in its menu', () => {
        expect(menu('settings').find('.dropdown-toggle').classes()).toContain('active')
        expect(menu('information').find('.dropdown-toggle').classes()).not.toContain('active')
        const marked = menu('settings')
          .findAll('.dropdown-item.active')
          .map((item) => item.attributes('href'))
        expect(marked).toEqual(['/creaSettings'])
      })

      it('marks the page in the narrow list too', () => {
        const marked = wrapper
          .findAll('.navbar-group-entry a.active')
          .map((item) => item.attributes('href'))
        expect(marked).toEqual(['/creaSettings'])
      })
    })

    // Instances, projects, Crea, the chat's video servers and the group list are
    // administrators' business. Menu visibility is only a convenience — the route guard and the
    // backend rights are the boundary.
    describe('as a moderator', () => {
      beforeEach(() => {
        store = createVuexStore('MODERATOR')
        wrapper = createWrapper()
      })

      it('leaves out the administrator-only entries', () => {
        // Starting balance stays: a moderator may look the links up and pass them on. What
        // they cannot do — create, change, delete — is hidden on the page itself. It is the
        // one settings page they see, so it stands in the bar rather than alone in a menu.
        expect(barLinks()).toEqual(['/user', '/creation-confirm', '/contribution-links'])
        expect(menuLinks('information')).toEqual(['/statistic', HELP])
        expect(menu('settings').exists()).toBe(false)
        expect(listed()).toEqual(['navbar.information', '/statistic', HELP])
      })
    })

    describe('as a KI-Moderator', () => {
      beforeEach(() => {
        store = createVuexStore('MODERATOR_AI')
        wrapper = createWrapper()
      })

      it('leaves them out just the same', () => {
        expect(barLinks()).toEqual(['/user', '/creation-confirm', '/contribution-links'])
        expect(menuLinks('information')).toEqual(['/statistic', HELP])
        expect(menu('settings').exists()).toBe(false)
        expect(listed()).toEqual(['navbar.information', '/statistic', HELP])
      })
    })
  })

  describe('the opener of the narrow bar', () => {
    const opener = () => wrapper.find('[data-test="navbar-menu-opener"]')

    it('is named, and says whether the list is open', async () => {
      expect(opener().attributes('aria-label')).toBe('navbar.menu')
      expect(opener().attributes('aria-controls')).toBe('nav-collapse')
      expect(wrapper.find('#nav-collapse').exists()).toBe(true)
      expect(opener().attributes('aria-expanded')).toBe('false')

      await opener().trigger('click')
      expect(opener().attributes('aria-expanded')).toBe('true')

      await opener().trigger('click')
      expect(opener().attributes('aria-expanded')).toBe('false')
    })

    // What the opener says and what the list does are the same state.
    it('opens the list it speaks of', async () => {
      const list = () => wrapper.findComponent({ name: 'BCollapse' })
      expect(list().props('modelValue')).toBe(false)

      await opener().trigger('click')
      expect(list().props('modelValue')).toBe(true)
    })

    // The list covers the page. The page that is already open changes no route, so the
    // choice itself has to close it.
    it('closes the list when a page is chosen', async () => {
      await opener().trigger('click')
      await wrapper.find('.navbar-group-entry a').trigger('click')
      expect(opener().attributes('aria-expanded')).toBe('false')
    })

    it('leaves it open for a tap that chooses nothing', async () => {
      await opener().trigger('click')
      await wrapper.find('.navbar-group-heading').trigger('click')
      expect(opener().attributes('aria-expanded')).toBe('true')
    })
  })

  describe('the menu of the moderator', () => {
    const account = () => wrapper.find('[data-test="navbar-account"]')
    const face = () => account().find('[data-test="member-avatar"]')

    it('stands outside the list, so it stays in the bar where the bar is narrow', () => {
      expect(account().exists()).toBe(true)
      expect(wrapper.find('.navbar-collapse [data-test="navbar-account"]').exists()).toBe(false)
    })

    it('is opened by the face, which carries the name', () => {
      const toggle = account().find('.dropdown-toggle')
      expect(toggle.attributes('aria-label')).toBe('Bibi Bloxberg')
      expect(toggle.find('[data-test="member-avatar"]').exists()).toBe(true)
      expect(face().attributes('style')).toContain(`width: ${NAV_AVATAR_SIZE}px`)
    })

    // The letters every other circle of this member shows: the first two of the alias.
    it('shows the letters of the alias while there is no picture', () => {
      expect(face().text()).toBe('BI')
      expect(face().find('img').exists()).toBe(false)
    })

    describe('with a picture', () => {
      beforeEach(() => {
        store = createVuexStore('ADMIN', { avatar: 'PICTURE' })
        wrapper = createWrapper()
      })

      it('shows the picture that came with the login', () => {
        expect(face().find('img').attributes('src')).toBe('data:image/jpeg;base64,PICTURE')
      })

      // The face is inside the button of the menu. A button of its own in there would be
      // invalid, and would take the tap that is meant to open the menu.
      it('does not make the face a button of its own', () => {
        expect(face().element.tagName).toBe('DIV')
        expect(account().find('.dropdown-toggle').element.tagName).toBe('BUTTON')
        expect(account().find('.dropdown-toggle').findAll('button')).toHaveLength(0)
      })
    })

    it('names who is signed in and as what', () => {
      expect(account().find('.navbar-account-name').text()).toBe('Bibi Bloxberg')
      expect(account().find('.navbar-account-role').text()).toBe('userRole.selectRoles.admin')
    })

    it.each([
      ['MODERATOR', 'userRole.selectRoles.moderator'],
      ['MODERATOR_AI', 'userRole.selectRoles.moderatorAi'],
    ])('names the role of a %s', (role, label) => {
      store = createVuexStore(role)
      wrapper = createWrapper()
      expect(account().find('.navbar-account-role').text()).toBe(label)
    })

    it('leads to the wallet and to the logout, in that order', () => {
      const entries = account()
        .findAll('.dropdown-item')
        .map((item) => item.text())
      expect(entries).toEqual(['navbar.my-account', 'navbar.logout'])
    })

    it('goes to the wallet from its entry', async () => {
      const dispatchSpy = vi.spyOn(store, 'dispatch')
      await account().find('[data-test="navbar-wallet"]').trigger('click')
      expect(redirectTo).toHaveBeenCalledWith(CONFIG.WALLET_AUTH_URL + 'valid-token')
      expect(dispatchSpy).toHaveBeenCalledWith('logout')
    })

    it('logs out from its entry', async () => {
      const dispatchSpy = vi.spyOn(store, 'dispatch')
      await account().find('[data-test="navbar-logout"]').trigger('click')
      expect(redirectTo).toHaveBeenCalledWith(CONFIG.WALLET_LOGIN_URL)
      expect(dispatchSpy).toHaveBeenCalledWith('logout')
    })
  })

  describe('wallet', () => {
    it('changes window location to wallet and dispatches logout', async () => {
      const dispatchSpy = vi.spyOn(store, 'dispatch')
      await wrapper.vm.handleWallet()
      expect(redirectTo).toHaveBeenCalledWith(CONFIG.WALLET_AUTH_URL + 'valid-token')
      expect(dispatchSpy).toHaveBeenCalledWith('logout')
    })
  })

  describe('logout', () => {
    it('redirects to login page and dispatches logout', async () => {
      const dispatchSpy = vi.spyOn(store, 'dispatch')
      await wrapper.vm.handleLogout()
      expect(redirectTo).toHaveBeenCalledWith(CONFIG.WALLET_LOGIN_URL)
      expect(dispatchSpy).toHaveBeenCalledWith('logout')
    })
  })
})
