import { mount } from '@vue/test-utils'
import Community from './Community'

const localVue = global.localVue

const mockStoreDispach = jest.fn()
const apolloQueryMock = jest.fn()
const apolloMutationMock = jest.fn()
apolloQueryMock.mockResolvedValue({
  data: {
    listContributions: [
      {
        id: 1555,
        amount: '200',
        memo: 'Fleisig, fleisig am Arbeiten mein Lieber Freund, 50 Zeichen sind viel',
        createdAt: '2022-07-15T08:47:06.000Z',
        deletedAt: null,
        confirmedBy: null,
        confirmedAt: null,
      },
    ],
  },
})

describe('Community', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $d: jest.fn((d) => d),
    $apollo: {
      query: apolloQueryMock,
      mutate: apolloMutationMock,
    },
    $store: {
      dispatch: mockStoreDispach,
      state: {
        creation: ['1000', '1000', '1000'],
      },
    },
  }

  const Wrapper = () => {
    return mount(Community, {
      localVue,
      mocks,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV .community-page', () => {
      expect(wrapper.find('div.community-page').exists()).toBe(true)
    })
  })
})
