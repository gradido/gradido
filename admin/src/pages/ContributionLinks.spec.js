import { mount } from '@vue/test-utils'
import ContributionLinks from './ContributionLinks.vue'
import { listContributionLinks } from '@/graphql/listContributionLinks.js'
import { toastErrorSpy } from '../../test/testSetup'

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

describe('ContributionLinks', () => {
  // eslint-disable-next-line no-unused-vars
  let wrapper

  const Wrapper = () => {
    return mount(ContributionLinks, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })
    describe('apollo returns', () => {
      it('calls listContributionLinks', () => {
        expect(apolloQueryMock).toBeCalledWith(
          expect.objectContaining({
            query: listContributionLinks,
          }),
        )
      })
    })

    describe.skip('query transaction with error', () => {
      beforeEach(() => {
        apolloQueryMock.mockRejectedValue({ message: 'OUCH!' })
        wrapper = Wrapper()
      })

      it('calls the API', () => {
        expect(apolloQueryMock).toBeCalled()
      })

      it('toast error', () => {
        expect(toastErrorSpy).toBeCalledWith(
          'listContributionLinks has no result, use default data',
        )
      })
    })
  })
})
