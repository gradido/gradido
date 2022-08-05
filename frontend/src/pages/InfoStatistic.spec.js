import { mount } from '@vue/test-utils'
import InfoStatistic from './InfoStatistic'
import { toastErrorSpy } from '../../test/testSetup'

const localVue = global.localVue

const apolloQueryMock = jest.fn().mockResolvedValue({
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

    it('calls listUnconfirmedContributions', () => {
      expect(apolloQueryMock).toBeCalled()
    })

    describe('error apolloQueryMock', () => {
      beforeEach(async () => {
        apolloQueryMock.mockRejectedValue({
          message: 'uups',
        })
        wrapper = Wrapper()
        jest.clearAllMocks()
      })

      it('toasts the error message', () => {
        expect(toastErrorSpy).toBeCalledWith(
          'listContributionLinks has no result, use default data',
        )
      })
    })
  })
})
