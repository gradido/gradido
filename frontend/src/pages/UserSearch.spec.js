import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { nextTick, ref } from 'vue'
import UserSearch from './UserSearch.vue'
import { authenticateGmsUserSearch } from '@/graphql/queries'
import { BButton, BCol, BContainer, BRow } from 'bootstrap-vue-next'
import * as apolloComposable from '@vue/apollo-composable'

const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
  })),
}))

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    onResult: vi.fn(),
    onError: vi.fn(),
    result: { value: null },
    loading: { value: false },
  })),
}))

describe('UserSearch', () => {
  let wrapper
  let mockOnResult
  let mockOnError

  const createWrapper = () => {
    return mount(UserSearch, {
      global: {
        mocks: {
          $t: (key) => key,
          $n: vi.fn(),
          $i18n: {
            locale: 'en',
          },
        },
        stubs: {
          BButton,
          BCol,
          BRow,
          BContainer,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnResult = vi.fn()
    mockOnError = vi.fn()
    vi.spyOn(apolloComposable, 'useQuery').mockReturnValue({
      onResult: mockOnResult,
      onError: mockOnError,
      result: ref(null),
      loading: ref(false),
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('renders the usersearch page', async () => {
    wrapper = createWrapper()
    await nextTick()
    expect(wrapper.find('div.usersearch').exists()).toBe(true)
  })

  it('calls authenticateGmsUserSearch', async () => {
    wrapper = createWrapper()
    await nextTick()
    expect(apolloComposable.useQuery).toHaveBeenCalledWith(authenticateGmsUserSearch)
  })

  it('updates gmsUri when onResult is called', async () => {
    wrapper = createWrapper()
    await nextTick()

    const onResultCallback = mockOnResult.mock.calls[0][0]
    onResultCallback({
      data: {
        authenticateGmsUserSearch: {
          url: 'http://example.com',
          token: '1234',
        },
      },
    })

    await nextTick()
    expect(wrapper.vm.gmsUri).toBe('http://example.com?accesstoken=1234')
  })

  it('calls toastError when onError is called', async () => {
    wrapper = createWrapper()
    await nextTick()

    const onErrorCallback = mockOnError.mock.calls[0][0]
    onErrorCallback(new Error('Test error'))

    await nextTick()
    expect(mockToastError).toHaveBeenCalledWith('authenticateGmsUserSearch failed!')
  })
})
