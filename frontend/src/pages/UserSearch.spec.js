import { mount } from '@vue/test-utils'
import UserSearch from './UserSearch'
import { toastErrorSpy } from '../../test/testSetup'
import { authenticateGmsUserSearch } from '@/graphql/queries'

const localVue = global.localVue

window.scrollTo = jest.fn()

const apolloQueryMock = jest
  .fn()
  .mockResolvedValueOnce({
    data: {
      authenticateGmsUserSearch: {
        gmsUri: 'http://localhost:8080/playground?not initialized',
      },
    },
  })
  .mockResolvedValue('default')

describe('UserSearch', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $n: jest.fn(),
    $i18n: {
      locale: 'en',
    },
    $apollo: {
      query: apolloQueryMock,
    },
  }

  const Wrapper = () => {
    return mount(UserSearch, {
      localVue,
      mocks,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the usersearch page', () => {
      expect(wrapper.find('div.usersearch').exists()).toBeTruthy()
    })

    it('calls authenticateGmsUserSearch', () => {
      expect(apolloQueryMock).toBeCalledWith(
        expect.objectContaining({
          query: authenticateGmsUserSearch,
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

      it('toasts an error message', () => {
        expect(toastErrorSpy).toBeCalledWith('authenticateGmsUserSearch failed!')
      })
    })
  })
})
