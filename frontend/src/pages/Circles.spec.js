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

// import { mount } from '@vue/test-utils'
// import { describe, it, expect, beforeEach, vi } from 'vitest'
// import { nextTick } from 'vue'
// import Circles from './Circles'
// import { authenticateHumhubAutoLogin } from '@/graphql/queries'
// import { BButton, BCol, BContainer, BRow } from 'bootstrap-vue-next'
//
// const TEST_URL_WITH_JWT_TOKEN =
//   'https://community.gradido.net/user/auth/external?authclient=jwt&jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTY4NTI0NjQxMn0.V2h4Rf3LfdOYDsx2clVCx-jbhKoY5F4Ks5-YJGVtHRk'
//
// const mockToastError = vi.fn()
// vi.mock('@/composables/useToast', () => ({
//   useAppToast: vi.fn(() => ({
//     toastError: mockToastError,
//   })),
// }))
//
// const mockStore = {
//   state: {
//     humhubAllowed: true,
//   },
//   commit: vi.fn(),
// }
//
// vi.mock('vuex', () => ({
//   useStore: () => mockStore,
// }))
//
// describe('Circles', () => {
//   let wrapper
//   let mockRefetch
//   let mockOnResult
//   let mockOnError
//
//   const mocks = {
//     $t: vi.fn((t) => t),
//     $n: vi.fn(),
//     $i18n: {
//       locale: 'en',
//     },
//   }
//
//   beforeEach(() => {
//     mockRefetch = vi.fn()
//     mockOnResult = vi.fn()
//     mockOnError = vi.fn()
//
//     vi.mock(
//       '@vue/apollo-composable',
//       () => ({
//         useQuery: vi.fn(() => ({
//           refetch: mockRefetch,
//           onResult: mockOnResult,
//           onError: mockOnError,
//         })),
//       }),
//       { virtual: true },
//     )
//
//     wrapper = mount(Circles, {
//       global: {
//         mocks,
//         stubs: {
//           BRow,
//           BContainer,
//           BButton,
//           BCol,
//         },
//       },
//     })
//   })
//
//   it('renders the circles page', () => {
//     expect(wrapper.find('div.circles').exists()).toBe(true)
//   })
//
//   it('calls authenticateHumhubAutoLogin on mount', () => {
//     expect(mockRefetch).toHaveBeenCalled()
//   })
//
//   it('sets humhubUri and enables button on success', async () => {
//     const resultHandler = mockOnResult.mock.calls[0][0]
//     resultHandler({ data: { authenticateHumhubAutoLogin: TEST_URL_WITH_JWT_TOKEN } })
//
//     await nextTick()
//     expect(wrapper.vm.humhubUri).toBe(TEST_URL_WITH_JWT_TOKEN)
//     expect(wrapper.vm.enableButton).toBe(true)
//   })
//
//   it('handles error correctly', async () => {
//     const errorHandler = mockOnError.mock.calls[0][0]
//     errorHandler(new Error('Test error'))
//
//     await nextTick()
//     expect(wrapper.vm.enableButton).toBe(true)
//     expect(wrapper.vm.humhubUri).toBe('')
//     expect(mockStore.commit).toHaveBeenCalledWith('humhubAllowed', false)
//   })
// })

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import Circles from './Circles'
import { authenticateHumhubAutoLogin } from '@/graphql/queries'
import { BButton, BCol, BContainer, BRow } from 'bootstrap-vue-next'

const TEST_URL_WITH_JWT_TOKEN =
  'https://community.gradido.net/user/auth/external?authclient=jwt&jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTY4NTI0NjQxMn0.V2h4Rf3LfdOYDsx2clVCx-jbhKoY5F4Ks5-YJGVtHRk'

const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
  })),
}))

const apolloQueryMock = vi.fn().mockResolvedValue({
  data: {
    authenticateHumhubAutoLogin: TEST_URL_WITH_JWT_TOKEN,
  },
})

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    refetch: apolloQueryMock,
    onResult: vi.fn(),
    onError: vi.fn(),
  })),
}))

const mockStore = {
  state: {
    humhubAllowed: true,
  },
  commit: vi.fn(),
}

vi.mock('vuex', () => ({
  useStore: () => mockStore,
}))

describe('Circles', () => {
  let wrapper

  const mocks = {
    $t: vi.fn((t) => t),
    $n: vi.fn(),
    $i18n: {
      locale: 'en',
    },
  }

  const createWrapper = () => {
    return mount(Circles, {
      global: {
        mocks,
        stubs: {
          BRow,
          BContainer,
          BButton,
          BCol,
        },
      },
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('renders the circles page', () => {
      expect(wrapper.find('div.circles').exists()).toBe(true)
    })

    it('calls authenticateHumhubAutoLogin', () => {
      expect(apolloQueryMock).toHaveBeenCalledWith()
    })

    it('sets humhubUri and enables button on success', async () => {
      await nextTick()
      expect(wrapper.vm.humhubUri).toBe(TEST_URL_WITH_JWT_TOKEN)
      expect(wrapper.vm.enableButton).toBe(true)
    })

    describe('error apolloQueryMock', () => {
      beforeEach(async () => {
        vi.clearAllMocks()
        apolloQueryMock.mockRejectedValue({
          message: 'oops',
        })
        wrapper = createWrapper()
        await nextTick()
      })

      it('enables button, clears humhubUri, and disables humhub on error', () => {
        expect(wrapper.vm.enableButton).toBe(true)
        expect(wrapper.vm.humhubUri).toBe('')
        expect(mockStore.commit).toHaveBeenCalledWith('humhubAllowed', false)
      })
    })
  })
})
