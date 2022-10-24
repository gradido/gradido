import { mount } from '@vue/test-utils'
import InfoStatistic from './InfoStatistic'
import { toastErrorSpy } from '../../test/testSetup'
import { listContributionLinks, communityStatistics, searchAdminUsers } from '@/graphql/queries'

const localVue = global.localVue

const apolloQueryMock = jest
  .fn()
  .mockResolvedValueOnce({
    data: {
      listContributionLinks: {
        count: 2,
        links: [
          {
            id: 1,
            amount: 200,
            name: 'Dokumenta 2017',
            memo: 'Vielen Dank für deinen Besuch bei der Dokumenta 2017',
            cycle: 'ONCE',
          },
          {
            id: 2,
            amount: 200,
            name: 'Dokumenta 2022',
            memo: 'Vielen Dank für deinen Besuch bei der Dokumenta 2022',
            cycle: 'ONCE',
          },
        ],
      },
    },
  })
  .mockResolvedValueOnce({
    data: {
      searchAdminUsers: {
        userCount: 2,
        userList: [
          { firstName: 'Peter', lastName: 'Lustig' },
          { firstName: 'Super', lastName: 'Admin' },
        ],
      },
    },
  })
  .mockResolvedValueOnce({
    data: {
      communityStatistics: {
        totalUsers: 3113,
        // activeUsers: 1057,
        // deletedUsers: 35,
        totalGradidoCreated: '4083774.05000000000000000000',
        totalGradidoDecayed: '-1062639.13634129622923372197',
        totalGradidoAvailable: '2513565.869444365732411569',
        // totalGradidoUnbookedDecayed: '-500474.6738366222166261272',
      },
    },
  })
  .mockResolvedValue('default')

describe('InfoStatistic', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $apollo: {
      query: apolloQueryMock,
    },
  }

  const Wrapper = () => {
    return mount(InfoStatistic, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the info page', () => {
      expect(wrapper.find('div.info-statistic').exists()).toBe(true)
    })

    it('calls listContributionLinks', () => {
      expect(apolloQueryMock).toBeCalledWith(
        expect.objectContaining({
          query: listContributionLinks,
        }),
      )
    })

    it('calls searchAdminUsers', () => {
      expect(apolloQueryMock).toBeCalledWith(
        expect.objectContaining({
          query: searchAdminUsers,
        }),
      )
    })

    it.skip('calls getCommunityStatistics', () => {
      expect(apolloQueryMock).toBeCalledWith(
        expect.objectContaining({
          query: communityStatistics,
        }),
      )
    })

    describe('error apolloQueryMock', () => {
      beforeEach(async () => {
        jest.clearAllMocks()
        apolloQueryMock.mockRejectedValue({
          message: 'uups',
        })
        wrapper = Wrapper()
      })

      it('toasts two error messages', () => {
        expect(toastErrorSpy).toBeCalledWith(
          'listContributionLinks has no result, use default data',
        )
        expect(toastErrorSpy).toBeCalledWith('searchAdminUsers has no result, use default data')
        // expect(toastErrorSpy).toBeCalledWith('communityStatistics has no result, use default data')
      })
    })
  })
})
