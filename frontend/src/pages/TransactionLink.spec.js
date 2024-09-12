import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import TransactionLink from './TransactionLink.vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useAppToast } from '@/composables/useToast'
import TransactionLinkItem from '@/components/TransactionLinkItem.vue'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    params: { code: 'some-code' },
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

vi.mock('vuex', () => ({
  useStore: vi.fn(() => ({
    state: {
      token: null,
      tokenTime: null,
      gradidoID: 'current-user-id',
    },
  })),
}))

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: vi.fn(),
    toastSuccess: vi.fn(),
  })),
}))

vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    d: vi.fn((d) => d.toISOString()),
    t: vi.fn((t, obj = null) => (obj ? [t, obj.date].join('; ') : t)),
  })),
}))

const now = new Date().toISOString()

const transactionLinkValidExpireDate = () => {
  const validUntil = new Date()
  return new Date(validUntil.setDate(new Date().getDate() + 14)).toISOString()
}

describe('TransactionLink', () => {
  let wrapper
  let mockUseQuery
  let mockUseMutation
  let mockRouter
  let mockStore
  let mockToast

  beforeEach(() => {
    mockUseQuery = vi.fn()
    mockUseMutation = vi.fn()
    mockRouter = { push: vi.fn() }
    mockStore = {
      state: {
        token: null,
        tokenTime: null,
        gradidoID: 'current-user-id',
      },
    }
    mockToast = {
      toastError: vi.fn(),
      toastSuccess: vi.fn(),
    }

    vi.mocked(useQuery).mockImplementation(mockUseQuery)
    vi.mocked(useMutation).mockImplementation(mockUseMutation)

    mockUseQuery.mockReturnValue({
      result: { value: null },
      onResult: vi.fn((fn) => fn()),
      onError: vi.fn((fn) => fn()),
      loading: { value: false },
      error: { value: null },
    })

    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      loading: { value: false },
      error: { value: null },
    })

    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(useStore).mockReturnValue(mockStore)
    vi.mocked(useAppToast).mockReturnValue(mockToast)

    wrapper = mount(TransactionLink, {
      global: {
        stubs: {
          TransactionLinkItem: true,
          RedeemLoggedOut: true,
          RedeemSelfCreator: true,
          RedeemValid: true,
          RedeemedTextBox: true,
        },
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component', () => {
    expect(wrapper.find('div.show-transaction-link-informations').exists()).toBe(true)
  })

  it('calls the queryTransactionLink query', () => {
    expect(mockUseQuery).toHaveBeenCalled()
  })

  describe('deleted link', () => {
    beforeEach(() => {
      vi.mocked(useQuery).mockReturnValue({
        result: {
          value: {
            queryTransactionLink: {
              __typename: 'TransactionLink',
              id: 92,
              amount: '22',
              memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
              createdAt: '2022-03-17T16:10:28.000Z',
              validUntil: transactionLinkValidExpireDate(),
              redeemedAt: '2022-03-18T10:08:43.000Z',
              deletedAt: now,
              user: { firstName: 'Bibi', publisherId: 0, gradidoID: 'other-user-id' },
            },
          },
        },
        onResult: vi.fn((fn) => fn()),
        onError: vi.fn(),
        loading: { value: false },
        error: { value: null },
      })
      wrapper = mount(TransactionLink, {
        global: {
          components: {
            TransactionLinkItem,
          },
          stubs: {
            RedeemLoggedOut: true,
            RedeemSelfCreator: true,
            RedeemValid: true,
            RedeemedTextBox: true,
          },
        },
      })
    })

    it('has a component RedeemedTextBox', () => {
      expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).exists()).toBe(true)
    })

    it('has a link deleted text in text box', () => {
      const box = wrapper.findComponent({ name: 'RedeemedTextBox' })
      expect(box.vm.text).toContain(`gdd_per_link.link-deleted; ${now}`)
    })
  })

  describe('redeem link with success', () => {
    let mockMutation

    beforeEach(async () => {
      mockStore.state.token = 'token'
      mockStore.state.tokenTime = Math.floor(Date.now() / 1000) + 20
      vi.mocked(useQuery).mockReturnValue({
        result: {
          value: {
            queryTransactionLink: {
              __typename: 'TransactionLink',
              id: 92,
              amount: '22',
              memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
              createdAt: '2022-03-17T16:10:28.000Z',
              validUntil: transactionLinkValidExpireDate(),
              redeemedAt: null,
              deletedAt: null,
              user: { firstName: 'Peter', publisherId: 0, gradidoID: 'other-user-id' },
            },
          },
        },
        onResult: vi.fn((fn) => fn()),
        onError: vi.fn(),
        loading: { value: false },
        error: { value: null },
      })

      mockMutation = vi.fn().mockResolvedValue({})
      mockUseMutation.mockReturnValue({
        mutate: mockMutation,
        loading: { value: false },
        error: { value: null },
      })

      wrapper = mount(TransactionLink, {
        global: {
          components: {
            TransactionLinkItem,
          },
          stubs: {
            RedeemLoggedOut: true,
            RedeemSelfCreator: true,
            RedeemValid: true,
            RedeemedTextBox: true,
          },
        },
      })
      await wrapper.vm.$nextTick()
      await wrapper.findComponent({ name: 'RedeemValid' }).vm.$emit('mutation-link', '22')
    })

    it('calls the API', () => {
      expect(mockMutation).toHaveBeenCalledWith({
        code: 'some-code',
      })
    })

    it('toasts a success message', () => {
      expect(mockToast.toastSuccess).toHaveBeenCalledWith('gdd_per_link.redeemed; ')
    })

    it('pushes the route to overview', () => {
      expect(mockRouter.push).toHaveBeenCalledWith('/overview')
    })
  })
})
