import { mount } from '@vue/test-utils'
import Community from './Community'
// import { createContribution } from '@/graphql/mutations'

// import { toastErrorSpy } from '@test/testSetup'

const localVue = global.localVue

const apolloMutationMock = jest.fn()
apolloMutationMock.mockResolvedValue('success')

describe('Community', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $apollo: {
      mutate: apolloMutationMock,
    },
    $route: {
      query: {},
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

    it('has a components community-page', () => {
      expect(wrapper.find('div.community-page').exists()).toBe(true)
    })
  })
})
