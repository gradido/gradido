import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import TransactionLink from './TransactionLink.vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useAppToast } from '@/composables/useToast'
import TransactionLinkItem from '@/components/TransactionLinkItem.vue'
import AuthTriads from '@/components/Auth/AuthTriads.vue'

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
          AuthTriads: true,
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

  // A door like the login and the register page: the triads come first, with the padding that
  // is the gap to the cards below. And they are there before the link has loaded, or when it
  // never does -- this wrapper's query answers with nothing.
  it('opens with the rotating triads before the link has loaded', () => {
    const triads = wrapper.findComponent(AuthTriads)
    expect(triads.exists()).toBe(true)
    expect(wrapper.element.firstElementChild).toBe(triads.element)
    // The gap below is the triads' own, the same on every door: no spacing from the page.
    expect(triads.classes().filter((name) => /^[mp][tbsexy]?-/.test(name))).toEqual([])
  })

  it('calls the queryTransactionLink query', () => {
    expect(mockUseQuery).toHaveBeenCalled()
  })

  // A member's redeem link is received as a thank-you in every state it can have, this one
  // included: the page hands it to RedeemThanks and the old text box is not shown for it.
  // TransactionLink.thanks.spec.js holds that view and its states with the real components.
  describe('deleted link of a member', () => {
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
            RedeemThanks: true,
            AuthTriads: true,
          },
        },
      })
    })

    it('hands the link to the thank-you view, as deleted', () => {
      const thanks = wrapper.findComponent({ name: 'RedeemThanks' })
      expect(thanks.exists()).toBe(true)
      expect(thanks.props('state')).toBe('TEXT_DELETED')
      expect(thanks.props('linkData').deletedAt).toBe(now)
    })

    it('has no component RedeemedTextBox', () => {
      expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).exists()).toBe(false)
    })

    it('keeps the triads above the state the link turned out to have', () => {
      const triads = wrapper.findComponent(AuthTriads)
      expect(triads.exists()).toBe(true)
      expect(wrapper.element.firstElementChild).toBe(triads.element)
    })
  })

  // The old text box stays for the two other kinds of link. A contribution link carries
  // `deletedAt` as well.
  describe('deleted contribution link', () => {
    beforeEach(() => {
      vi.mocked(useQuery).mockReturnValue({
        result: {
          value: {
            queryTransactionLink: {
              __typename: 'ContributionLink',
              id: 3,
              amount: '100',
              name: 'Startguthaben',
              memo: 'Willkommen bei Gradido',
              cycle: 'ONCE',
              validFrom: '2022-03-17T16:10:28.000Z',
              validTo: null,
              createdAt: '2022-03-17T16:10:28.000Z',
              deletedAt: now,
              maxAmountPerMonth: null,
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
            RedeemThanks: true,
            AuthTriads: true,
          },
        },
      })
    })

    it('has a component RedeemedTextBox', () => {
      expect(wrapper.findComponent({ name: 'RedeemedTextBox' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'RedeemThanks' }).exists()).toBe(false)
    })

    it('has a link deleted text in text box', () => {
      const box = wrapper.findComponent({ name: 'RedeemedTextBox' })
      expect(box.vm.text).toContain(`gdd_per_link.link-deleted; ${now}`)
    })
  })
})
