import { mount } from '@vue/test-utils'
import Overview from './Overview.vue'

const localVue = global.localVue

const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    listUnconfirmedContributions: [
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

const propsData = {
  items: [
    {
      id: 1,
      name: 'Meditation',
      memo: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut l',
      amount: '200',
      validFrom: '2022-04-01',
      validTo: '2022-08-01',
      cycle: 'täglich',
      maxPerCycle: '3',
      maxAmountPerMonth: 0,
      link: 'https://localhost/redeem/CL-1a2345678',
    },
  ],
  count: 1,
}

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
    return mount(Overview, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('calls listUnconfirmedContributions', () => {
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
