// import { mount } from '@vue/test-utils'
// import SessionLogoutTimeout from './SessionLogoutTimeout'
//
// const localVue = global.localVue
//
// const apolloQueryMock = jest.fn()
//
// const setTokenTime = (seconds) => {
//   const now = new Date()
//   return Math.floor(new Date(now.setSeconds(now.getSeconds() + seconds)).getTime() / 1000)
// }
//
// const mocks = {
//   $store: {
//     state: {
//       token: '1234',
//       tokenTime: setTokenTime(120),
//     },
//   },
//   $i18n: {
//     locale: 'en',
//   },
//   $t: jest.fn((t) => t),
//   $apollo: {
//     query: apolloQueryMock,
//   },
//   $route: {
//     meta: {
//       requiresAuth: true,
//     },
//   },
// }
//
// describe('SessionLogoutTimeout', () => {
//   let wrapper, spy
//
//   const Wrapper = () => {
//     return mount(SessionLogoutTimeout, { localVue, mocks })
//   }
//
//   describe('mount', () => {
//     beforeEach(() => {
//       jest.clearAllMocks()
//       wrapper = Wrapper()
//     })
//
//     it('renders the component div.session-logout-timeout', () => {
//       expect(wrapper.find('div.session-logout-timeout').exists()).toBe(true)
//     })
//
//     describe('timers', () => {
//       it('has a token expires timer', () => {
//         expect(wrapper.vm.$options.timers).toEqual({
//           tokenExpires: expect.objectContaining({
//             name: 'tokenExpires',
//             time: 15000,
//             repeat: true,
//             immediate: true,
//             autostart: true,
//             isSwitchTab: false,
//           }),
//         })
//       })
//
//       describe('token is expired for several seconds', () => {
//         beforeEach(() => {
//           mocks.$store.state.tokenTime = setTokenTime(-60)
//           wrapper = Wrapper()
//         })
//
//         it('has value for remaining seconds equal 0', () => {
//           expect(wrapper.tokenExpiresInSeconds === 0)
//         })
//
//         it('emits logout', () => {
//           expect(wrapper.emitted('logout')).toBeTruthy()
//         })
//       })
//
//       describe('token time less than 75 seconds', () => {
//         beforeEach(() => {
//           mocks.$store.state.tokenTime = setTokenTime(60)
//           jest.useFakeTimers()
//           wrapper = Wrapper()
//           spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
//           spy.mockImplementation(() => Promise.resolve(true))
//         })
//
//         it('sets the timer to 1000', () => {
//           expect(wrapper.vm.timers.tokenExpires.time).toBe(1000)
//         })
//
//         it.skip('opens the modal', () => {
//           jest.advanceTimersByTime(1000)
//           jest.advanceTimersByTime(1000)
//           jest.advanceTimersByTime(1000)
//           jest.advanceTimersByTime(1000)
//           expect(spy).toBeCalled()
//         })
//       })
//     })
//   })
// })

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import SessionLogoutTimeout from './SessionLogoutTimeout'
import { createStore } from 'vuex'
import { BButton, BCard, BCardText, BCol, BModal, BRow, useModal } from 'bootstrap-vue-next'

// Mock Vue 3 Composition API functions
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    defineEmits: vi.fn(() => vi.fn()),
  }
})

// vi.mock('bootstrap-vue-next', () => ({
//   useModal: vi.fn(),
//   BButton,
//   BCard,
//   BCardText,
//   BCol,
//   BRow,
//   BModal,
// }))

vi.mock('@vue/apollo-composable', () => ({
  useLazyQuery: () => ({
    load: vi.fn(),
    loading: false,
    error: { value: null },
  }),
}))

const setTokenTime = (seconds) => {
  const now = new Date()
  return Math.floor(new Date(now.setSeconds(now.getSeconds() + seconds)).getTime() / 1000)
}

const createVuexStore = (tokenTime) =>
  createStore({
    state: {
      token: '1234',
      tokenTime: tokenTime,
    },
  })

describe('SessionLogoutTimeout', () => {
  let wrapper
  let store
  let mockShowModal
  let mockHideModal

  const createWrapper = (store) => {
    return mount(SessionLogoutTimeout, {
      global: {
        plugins: [store],
        mocks: {
          $t: vi.fn((t) => t),
        },
        stubs: {
          BModal,
          BCard,
          BRow,
          BCol,
          BButton,
          BCardText,
        },
      },
    })
  }

  beforeEach(() => {
    vi.useFakeTimers()
    mockShowModal = vi.fn()
    mockHideModal = vi.fn()
    useModal.mockReturnValue({
      show: mockShowModal,
      hide: mockHideModal,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('mount', () => {
    beforeEach(() => {
      store = createVuexStore(setTokenTime(120))
      wrapper = createWrapper(store)
    })

    it('renders the component div.session-logout-timeout', () => {
      expect(wrapper.find('div.session-logout-timeout').exists()).toBe(true)
    })

    describe('token is expired for several seconds', () => {
      beforeEach(async () => {
        store = createVuexStore(setTokenTime(-60))
        wrapper = createWrapper(store)
        await vi.runAllTimersAsync()
      })

      it('has value for remaining seconds equal 0', () => {
        expect(wrapper.vm.tokenExpiresInSeconds).toBe(0)
      })

      it('calls logout function', async () => {
        const logoutSpy = vi.spyOn(wrapper.vm, 'logout')
        await vi.runAllTimersAsync()
        expect(logoutSpy).toHaveBeenCalled()
      })
    })

    describe('token time less than 75 seconds', () => {
      beforeEach(async () => {
        store = createVuexStore(setTokenTime(60))
        wrapper = createWrapper(store)
        await vi.runAllTimersAsync()
      })

      it('opens the modal', () => {
        expect(mockShowModal).toHaveBeenCalled()
      })
    })
  })
})
