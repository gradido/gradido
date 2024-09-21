import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { nextTick } from 'vue'
import Circles from './Circles'
import { authenticateHumhubAutoLogin } from '@/graphql/queries'
import { createStore } from 'vuex'
import { useQuery } from '@vue/apollo-composable'

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}))

const TEST_URL_WITH_JWT_TOKEN =
  'https://community.gradido.net/user/auth/external?authclient=jwt&jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTY4NTI0NjQxMn0.V2h4Rf3LfdOYDsx2clVCx-jbhKoY5F4Ks5-YJGVtHRk'

describe('Circles', () => {
  let wrapper
  let store
  let mockOnResult
  let mockRefetch
  let mockOnError

  beforeEach(() => {
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

    mockOnResult = vi.fn()
    mockRefetch = vi.fn()
    mockOnError = vi.fn()

    vi.mocked(useQuery).mockReturnValue({
      refetch: mockRefetch,
      onResult: mockOnResult,
      onError: mockOnError,
    })

    wrapper = mount(Circles, {
      global: {
        plugins: [store],
        mocks: {
          $t: (key) => key,
          $i18n: {
            locale: 'en',
          },
        },
        stubs: {
          BContainer: true,
          BRow: true,
          BCol: true,
          BButton: true,
          RouterLink: true,
        },
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the circles page', () => {
    expect(wrapper.find('div.circles').exists()).toBe(true)
  })

  it('calls authenticateHumhubAutoLogin on mount', () => {
    expect(useQuery).toHaveBeenCalledWith(
      authenticateHumhubAutoLogin,
      null,
      expect.objectContaining({
        fetchPolicy: 'network-only',
        enabled: false,
      }),
    )
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('sets humhubUri and enables button on success', async () => {
    const successCallback = mockOnResult.mock.calls[0][0]
    successCallback({ data: { authenticateHumhubAutoLogin: TEST_URL_WITH_JWT_TOKEN } })

    await nextTick()
    expect(wrapper.vm.humhubUri).toBe(TEST_URL_WITH_JWT_TOKEN)
    expect(wrapper.vm.enableButton).toBe(true)
  })

  it('handles error in authenticateHumhubAutoLogin', async () => {
    const errorCallback = mockOnError.mock.calls[0][0]
    errorCallback(new Error('Test error'))

    await nextTick()
    expect(wrapper.vm.enableButton).toBe(true)
    expect(wrapper.vm.humhubUri).toBe('')
    expect(store.state.humhubAllowed).toBe(false)
  })
})
