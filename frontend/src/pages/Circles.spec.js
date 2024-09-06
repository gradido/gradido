// import { mount } from '@vue/test-utils'
// import Circles from './Circles'
// import { authenticateHumhubAutoLogin } from '@/graphql/queries'
//
// const localVue = global.localVue
//
// const TEST_URL_WITH_JWT_TOKEN =
//   'https://community.gradido.net/user/auth/external?authclient=jwt&jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTY4NTI0NjQxMn0.V2h4Rf3LfdOYDsx2clVCx-jbhKoY5F4Ks5-YJGVtHRk'
//
// const apolloQueryMock = jest.fn().mockResolvedValue({
//   data: {
//     authenticateHumhubAutoLogin: TEST_URL_WITH_JWT_TOKEN,
//   },
// })
//
// describe('Circles', () => {
//   let wrapper
//
//   const mocks = {
//     $t: jest.fn((t) => t),
//     $n: jest.fn(),
//     $i18n: {
//       locale: 'en',
//     },
//     $apollo: {
//       query: apolloQueryMock,
//     },
//     $store: {
//       state: {
//         humhubAllowed: true,
//       },
//       commit: jest.fn(),
//     },
//   }
//
//   const Wrapper = () => {
//     return mount(Circles, {
//       localVue,
//       mocks,
//     })
//   }
//
//   describe('mount', () => {
//     beforeEach(() => {
//       wrapper = Wrapper()
//     })
//
//     it('renders the circles page', () => {
//       expect(wrapper.find('div.circles').exists()).toBeTruthy()
//     })
//
//     it('calls authenticateHumhubAutoLogin', () => {
//       expect(apolloQueryMock).toBeCalledWith(
//         expect.objectContaining({
//           query: authenticateHumhubAutoLogin,
//           fetchPolicy: 'network-only',
//         }),
//       )
//     })
//
//     it('sets humhubUri and enables button on success', async () => {
//       await wrapper.vm.$nextTick()
//       expect(wrapper.vm.humhubUri).toBe(TEST_URL_WITH_JWT_TOKEN)
//       expect(wrapper.vm.enableButton).toBe(true)
//     })
//
//     describe('error apolloQueryMock', () => {
//       beforeEach(async () => {
//         jest.clearAllMocks()
//         apolloQueryMock.mockRejectedValue({
//           message: 'uups',
//         })
//         wrapper = Wrapper()
//         await wrapper.vm.$nextTick()
//       })
//
//       it('toasts an error message and disables humhub', () => {
//         expect(wrapper.vm.enableButton).toBe(true)
//         expect(wrapper.vm.humhubUri).toBe('')
//         expect(mocks.$store.commit).toBeCalledWith('humhubAllowed', false)
//       })
//     })
//   })
// })

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { createRouter, createWebHistory } from 'vue-router'
import Circles from './Circles.vue'

// Mock the Apollo composable
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    refetch: vi.fn(),
    onResult: vi.fn(),
    onError: vi.fn(),
  })),
}))

// Mock the authenticateHumhubAutoLogin query
vi.mock('@/graphql/queries', () => ({
  authenticateHumhubAutoLogin: 'mocked-query',
}))

describe('Circles', () => {
  let wrapper
  let store
  let router

  beforeEach(() => {
    // Create a mock store
    store = createStore({
      state: {
        humhubAllowed: true,
      },
      mutations: {
        humhubAllowed(state, value) {
          state.humhubAllowed = value
        },
      },
    })

    // Create a mock router
    router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/settings/extern', component: { template: '<div></div>' } }],
    })

    // Mount the component
    wrapper = mount(Circles, {
      global: {
        plugins: [store, router],
        mocks: {
          $t: (key) => key, // Mock the translation function
        },
        stubs: {
          BContainer: true,
          BRow: true,
          BCol: true,
          BButton: true,
        },
      },
    })
  })

  it('renders the component', () => {
    expect(wrapper.find('.circles').exists()).toBe(true)
    expect(wrapper.find('.h3').text()).toBe('circles.headline')
  })

  it('renders the text content', () => {
    expect(wrapper.find('.text-small').exists()).toBe(true)
    expect(wrapper.find('.text-small').text()).toContain('circles.text')
  })

  it('renders the button when humhubAllowed is true', async () => {
    await wrapper.vm.$nextTick()
    expect(wrapper.find('BButton-stub[variant="gradido"]').exists()).toBe(true)
    expect(wrapper.find('BButton-stub').text()).toBe('circles.button')
  })

  it('renders RouterLink when humhubAllowed is false', async () => {
    store.state.humhubAllowed = false
    await wrapper.vm.$nextTick()
    expect(wrapper.find('RouterLink-stub').exists()).toBe(true)
    expect(wrapper.find('RouterLink-stub').attributes('to')).toBe('/settings/extern')
  })

  it('disables the button when enableButton is false', async () => {
    wrapper.vm.enableButton = false
    await wrapper.vm.$nextTick()
    expect(wrapper.find('BButton-stub').attributes('disabled')).toBe('true')
  })

  it('calls handleAuthenticateHumhubAutoLogin on mount', () => {
    const handleAuthenticateHumhubAutoLogin = vi.spyOn(
      wrapper.vm,
      'handleAuthenticateHumhubAutoLogin',
    )
    wrapper.vm.$options.mounted[0].call(wrapper.vm)
    expect(handleAuthenticateHumhubAutoLogin).toHaveBeenCalled()
  })

  it('updates humhubUri and enableButton on successful query result', async () => {
    const onResult = wrapper.vm.onResult
    onResult({ data: { authenticateHumhubAutoLogin: 'https://example.com' } })
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.humhubUri).toBe('https://example.com')
    expect(wrapper.vm.enableButton).toBe(true)
  })

  it('handles query error', async () => {
    const onError = wrapper.vm.onError
    onError()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.enableButton).toBe(true)
    expect(wrapper.vm.humhubUri).toBe('')
    expect(store.state.humhubAllowed).toBe(false)
  })
})
