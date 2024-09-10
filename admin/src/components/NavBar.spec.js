// // import { mount } from '@vue/test-utils'
// // import NavBar from './NavBar'
// //
// // const localVue = global.localVue
// //
// // const apolloMutateMock = jest.fn()
// // const storeDispatchMock = jest.fn()
// // const routerPushMock = jest.fn()
// //
// // const stubs = {
// //   RouterLink: true,
// // }
// //
// // const mocks = {
// //   $t: jest.fn((t) => t),
// //   $apollo: {
// //     mutate: apolloMutateMock,
// //   },
// //   $store: {
// //     state: {
// //       openCreations: 1,
// //       token: 'valid-token',
// //     },
// //     dispatch: storeDispatchMock,
// //   },
// //   $router: {
// //     push: routerPushMock,
// //   },
// // }
// //
// // describe('NavBar', () => {
// //   let wrapper
// //
// //   const Wrapper = () => {
// //     return mount(NavBar, { mocks, localVue, stubs })
// //   }
// //
// //   describe('mount', () => {
// //     beforeEach(() => {
// //       wrapper = Wrapper()
// //     })
// //
// //     it('has a DIV element with the class.component-nabvar', () => {
// //       expect(wrapper.find('.component-nabvar').exists()).toBeTruthy()
// //     })
// //   })
// //
// //   describe('Navbar Menu', () => {
// //     it('has a link to /user', () => {
// //       expect(wrapper.findAll('.nav-item').at(0).find('a').attributes('href')).toBe('/user')
// //     })
// //
// //     it('has a link to /creation-confirm', () => {
// //       expect(wrapper.findAll('.nav-item').at(1).find('a').attributes('href')).toBe(
// //         '/creation-confirm',
// //       )
// //     })
// //
// //     it('has a link to /contribution-links', () => {
// //       expect(wrapper.findAll('.nav-item').at(2).find('a').attributes('href')).toBe(
// //         '/contribution-links',
// //       )
// //     })
// //
// //     it('has a link to /federation', () => {
// //       expect(wrapper.findAll('.nav-item').at(3).find('a').attributes('href')).toBe('/federation')
// //     })
// //
// //     it('has a link to /statistic', () => {
// //       expect(wrapper.findAll('.nav-item').at(4).find('a').attributes('href')).toBe('/statistic')
// //     })
// //   })
// //
// //   describe('wallet', () => {
// //     const windowLocation = window.location
// //     beforeEach(async () => {
// //       delete window.location
// //       window.location = ''
// //       await wrapper.findAll('.nav-item').at(5).find('a').trigger('click')
// //     })
// //
// //     afterEach(() => {
// //       delete window.location
// //       window.location = windowLocation
// //     })
// //
// //     it('changes window location to wallet', () => {
// //       expect(window.location).toBe('http://localhost/authenticate?token=valid-token')
// //     })
// //
// //     it('dispatches logout to store', () => {
// //       expect(storeDispatchMock).toBeCalledWith('logout')
// //     })
// //   })
// //
// //   describe('logout', () => {
// //     const windowLocationMock = jest.fn()
// //     const windowLocation = window.location
// //     beforeEach(async () => {
// //       delete window.location
// //       window.location = {
// //         assign: windowLocationMock,
// //       }
// //       await wrapper.findAll('.nav-item').at(6).find('a').trigger('click')
// //     })
// //
// //     afterEach(() => {
// //       delete window.location
// //       window.location = windowLocation
// //     })
// //
// //     it('redirects to /logout', () => {
// //       expect(windowLocationMock).toBeCalledWith('http://localhost/login')
// //     })
// //
// //     it('dispatches logout to store', () => {
// //       expect(storeDispatchMock).toBeCalledWith('logout')
// //     })
// //
// //     it('has called logout mutation', () => {
// //       expect(apolloMutateMock).toBeCalled()
// //     })
// //   })
// // })
//
// import { mount } from '@vue/test-utils'
// import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
// import NavBar from './NavBar.vue'
// import { createStore } from 'vuex'
// import { useI18n } from 'vue-i18n'
//
// vi.mock('vue-i18n')
//
// const apolloMutateMock = vi.fn()
// const storeDispatchMock = vi.fn()
// const routerPushMock = vi.fn()
//
// const createVuexStore = () => {
//   return createStore({
//     state: {
//       openCreations: 1,
//       token: 'valid-token',
//     },
//     dispatch: storeDispatchMock,
//   })
// }
//
// describe('NavBar', () => {
//   let wrapper
//   let store
//
//   beforeEach(() => {
//     store = createVuexStore()
//
//     const mockT = vi.fn((key) => key)
//     useI18n.mockReturnValue({ t: mockT })
//
//     wrapper = mount(NavBar, {
//       global: {
//         plugins: [store],
//         mocks: {
//           $apollo: {
//             mutate: apolloMutateMock,
//           },
//           $router: {
//             push: routerPushMock,
//           },
//         },
//         stubs: {
//           RouterLink: true,
//         },
//       },
//     })
//   })
//
//   it('renders a DIV element with the class component-nabvar', () => {
//     expect(wrapper.find('.component-nabvar').exists()).toBe(true)
//   })
//
//   describe('Navbar Menu', () => {
//     it('has correct links in the menu', () => {
//       const links = wrapper.findAll('.nav-item a')
//       expect(links[0].attributes('href')).toBe('/user')
//       expect(links[1].attributes('href')).toBe('/creation-confirm')
//       expect(links[2].attributes('href')).toBe('/contribution-links')
//       expect(links[3].attributes('href')).toBe('/federation')
//       expect(links[4].attributes('href')).toBe('/statistic')
//     })
//   })
//
//   describe('wallet', () => {
//     const originalWindow = { ...window }
//     let windowSpy
//
//     beforeEach(() => {
//       windowSpy = vi.spyOn(global, 'window', 'get')
//       windowSpy.mockImplementation(() => ({
//         location: {
//           href: '',
//         },
//       }))
//     })
//
//     afterEach(() => {
//       windowSpy.mockRestore()
//       window = originalWindow
//     })
//
//     it('changes window location to wallet and dispatches logout', async () => {
//       await wrapper.findAll('.nav-item a').at(5).trigger('click')
//       expect(window.location.href).toBe('http://localhost/authenticate?token=valid-token')
//       expect(storeDispatchMock).toHaveBeenCalledWith('logout')
//     })
//   })
//
//   describe('logout', () => {
//     const originalWindow = { ...window }
//     let windowSpy
//
//     beforeEach(() => {
//       windowSpy = vi.spyOn(global, 'window', 'get')
//       windowSpy.mockImplementation(() => ({
//         location: {
//           assign: vi.fn(),
//         },
//       }))
//     })
//
//     afterEach(() => {
//       windowSpy.mockRestore()
//       window = originalWindow
//     })
//
//     it('redirects to /logout, dispatches logout, and calls logout mutation', async () => {
//       await wrapper.findAll('.nav-item a').at(6).trigger('click')
//       expect(window.location.assign).toHaveBeenCalledWith('http://localhost/login')
//       expect(storeDispatchMock).toHaveBeenCalledWith('logout')
//       expect(apolloMutateMock).toHaveBeenCalled()
//     })
//   })
// })

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import NavBar from './NavBar.vue'
import { createStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useMutation } from '@vue/apollo-composable'
import CONFIG from '../config'
import { ref } from 'vue'
import {
  BBadge,
  BCollapse,
  BNavbar,
  BNavbarBrand,
  BNavbarNav,
  BNavbarToggle,
  BNavItem,
} from 'bootstrap-vue-next'

vi.mock('vue-i18n')
vi.mock('vue-router')
vi.mock('@vue/apollo-composable')
vi.mock('../config', () => ({
  default: {
    WALLET_LOGIN_URL: 'http://wallet-login.com',
    WALLET_AUTH_URL: 'http://wallet-auth.com/{token}',
  },
}))

const createVuexStore = (openCreations = 0, token = 'test-token') => {
  return createStore({
    state: {
      openCreations,
      token,
    },
    dispatch: vi.fn(),
  })
}

describe('NavBar', () => {
  let wrapper
  let store
  const mockT = vi.fn((key) => key)
  const mockRouteName = ref('user')
  const mockRoute = ref({ name: mockRouteName.value })
  const mockExecuteLogout = vi.fn()

  beforeEach(() => {
    store = createVuexStore()
    useI18n.mockReturnValue({ t: mockT })
    useRoute.mockReturnValue(mockRoute.value)
    useMutation.mockReturnValue({ mutate: mockExecuteLogout })

    wrapper = mount(NavBar, {
      global: {
        plugins: [store],
        stubs: {
          BNavbar,
          BCollapse,
          BNavbarNav,
          BNavItem,
          BNavbarBrand,
          BBadge,
          BNavbarToggle,
        },
        directives: {
          'b-toggle': {},
          'b-color-mode': {},
        },
        mocks: {
          $route: mockRoute,
        },
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component', () => {
    expect(wrapper.find('.component-nabvar').exists()).toBe(true)
  })

  it('renders the correct number of nav items', () => {
    expect(wrapper.findAll('.nav-item')).toHaveLength(7)
  })

  it('has correct links in the menu', () => {
    const links = wrapper.findAll('.nav-item a')
    expect(links[0].attributes('href')).toBe('/user')
    expect(links[1].attributes('href')).toBe('/creation-confirm')
    expect(links[2].attributes('href')).toBe('/contribution-links')
    expect(links[3].attributes('href')).toBe('/federation')
    expect(links[4].attributes('href')).toBe('/statistic')
  })

  it('sets the correct active state for nav items and updates on route change', async () => {
    const navItems = wrapper.findAll('.nav-link')
    expect(navItems[0].classes()).toContain('active')

    mockRouteName.value = 'creation-confirm'
    await wrapper.vm.$nextTick()
    expect(navItems[1].classes()).toContain('active')

    mockRouteName.value = 'contribution-links'
    await wrapper.vm.$nextTick()
    expect(navItems[2].classes()).toContain('active')
  })

  it('displays the openCreations badge when there are open creations', async () => {
    store.state.openCreations = 5
    await wrapper.vm.$nextTick()
    const badge = wrapper.find('.badge')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('5')
  })

  it('does not display the openCreations badge when there are no open creations', () => {
    const badge = wrapper.find('bbadge-stub')
    expect(badge.exists()).toBe(false)
  })

  it('calls handleWallet when "My Account" is clicked', async () => {
    const originalWindow = { ...window }
    const windowSpy = vi.spyOn(global, 'window', 'get')
    windowSpy.mockImplementation(() => ({
      location: '',
    }))

    const myAccountItem = wrapper.findAll('.nav-item').at(5)
    await myAccountItem.trigger('click')

    expect(window.location).toBe('http://wallet-auth.com/test-token')
    expect(store.dispatch).toHaveBeenCalledWith('logout')

    windowSpy.mockRestore()
    window = originalWindow
  })

  it('calls handleLogout when "Logout" is clicked', async () => {
    const originalWindow = { ...window }
    const windowSpy = vi.spyOn(global, 'window', 'get')
    const assignMock = vi.fn()
    windowSpy.mockImplementation(() => ({
      location: {
        assign: assignMock,
      },
    }))

    const logoutItem = wrapper.findAll('.nav-item').at(6)
    await logoutItem.trigger('click')

    expect(assignMock).toHaveBeenCalledWith('http://wallet-login.com')
    expect(store.dispatch).toHaveBeenCalledWith('logout')
    expect(mockExecuteLogout).toHaveBeenCalled()

    windowSpy.mockRestore()
    window = originalWindow
  })
})
