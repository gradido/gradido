import { mount } from '@vue/test-utils'
import ContributionLink from './ContributionLink.vue'
import { listContributionLinks } from '@/graphql/listContributionLinks.js'

const localVue = global.localVue

const apolloQueryMock = jest.fn().mockResolvedValueOnce({
  data: {
    listContributionLinks: {
      links: [
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
    },
  },
})

const mocks = {
  $t: jest.fn((t) => t),
  $d: jest.fn((d) => d),
  $apollo: {
    query: apolloQueryMock,
  },
}

describe('ContributionLink', () => {
  // eslint-disable-next-line no-unused-vars
  let wrapper

  const Wrapper = () => {
    return mount(ContributionLink, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('calls listContributionLinks', () => {
      expect(apolloQueryMock).toBeCalledWith(
        expect.objectContaining({
          query: listContributionLinks,
        }),
      )
    })
  })
})
