import { mount } from '@vue/test-utils'
import ShowTransactionLinkInformations from './ShowTransactionLinkInformations'
import { queryTransactionLink } from '@/graphql/queries'
import { redeemTransactionLink } from '@/graphql/mutations'
import { wrap } from 'regenerator-runtime'

const localVue = global.localVue

const errorHandler = jest.fn()

localVue.config.errorHandler = errorHandler

const apolloQueryMock = jest.fn()
apolloQueryMock.mockResolvedValue({
  id: 92,
  amount: '22',
  memo: 'Abrakadabra drei, vier, fünf, sechs, hier steht jetzt ein Memotext! Hex hex ',
  createdAt: '2022-03-17T16:10:28.000Z',
  validUntil: '2022-03-31T16:10:28.000Z',
  redeemedAt: '2022-03-18T10:08:43.000Z',
  deletedAt: null,
  user: { firstName: 'Bibi', publisherId: 0, email: 'bibi@bloxberg.de', __typename: 'User' },
  __typename: 'TransactionLink',
})

const createMockObject = (code) => {
  return {
    localVue,
    mocks: {
      $t: jest.fn((t) => t),
      $i18n: {
        locale: () => 'en',
      },
      $store: {
        state: {
          email: 'bibi@bloxberg.de',
        },
      },
      $apollo: {
        query: apolloQueryMock,
      },
      $route: {
        params: {
          code: 'c0000c0000c0000',
        },
      },
    },
  }
}

describe('ShowTransactionLinkInformations', () => {
  let wrapper

  const Wrapper = (functionN) => {
    return mount(ShowTransactionLinkInformations, functionN)
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper(createMockObject())
    })

    it('renders the component', () => {
      expect(wrapper.find('div.show-transaction-link-informations').exists()).toBeTruthy()
    })

    it('calls the queryTransactionLink query', () => {
      expect(apolloQueryMock).toBeCalledWith({
        query: queryTransactionLink,
        variables: {
          code: 'c0000c0000c0000',
        },
      })
    })

    it('has link one information link data', () => {
      expect(apolloQueryMock.mockResolvedValue).toHaveLength(1)
    })
  })
})
