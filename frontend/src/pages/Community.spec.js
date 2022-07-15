import { mount } from '@vue/test-utils'
import Community from './Community'

const localVue = global.localVue

const mockStoreDispach = jest.fn()
const apolloMutationMock = jest.fn()
apolloMutationMock.mockResolvedValue('success')

describe('Community', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $d: jest.fn((d) => d),
    $apollo: {
      mutate: apolloMutationMock,
    },
    $store: {
      dispatch: mockStoreDispach,
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
