import { mount } from '@vue/test-utils'
import Overview from './Overview.vue'

const localVue = global.localVue

const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    getPendingCreations: [
      {
        pending: true,
      },
      {
        pending: true,
      },
      {
        pending: true,
      },
    ],
  },
})

const storeCommitMock = jest.fn()

const mocks = {
  $t: jest.fn((t) => t),
  $apollo: {
    query: apolloQueryMock,
  },
  $store: {
    commit: storeCommitMock,
    state: {
      openCreations: 2,
    },
  },
}

describe('Overview', () => {
  let wrapper

  const Wrapper = () => {
    return mount(Overview, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('calls getPendingCreations', () => {
      expect(apolloQueryMock).toBeCalled()
    })

    it('commts three pending creations to store', () => {
      expect(storeCommitMock).toBeCalledWith('setOpenCreations', 3)
    })

    describe('with open creations', () => {
      it('renders a link to confirm creations', () => {
        expect(wrapper.find('a[href="creation-confirm"]').text()).toContain('2')
        expect(wrapper.find('a[href="creation-confirm"]').exists()).toBeTruthy()
      })
    })

    describe('without open creations', () => {
      beforeEach(() => {
        mocks.$store.state.openCreations = 0
      })

      it('renders a link to confirm creations', () => {
        expect(wrapper.find('a[href="creation-confirm"]').text()).toContain('0')
        expect(wrapper.find('a[href="creation-confirm"]').exists()).toBeTruthy()
      })
    })
  })
})
