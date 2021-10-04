import { mount } from '@vue/test-utils'
import UserCardCoinAnimation from './UserCard_CoinAnimation'
import { updateUserInfos } from '../../../graphql/mutations'

const localVue = global.localVue

const mockAPIcall = jest.fn()

const toastErrorMock = jest.fn()
const toastSuccessMock = jest.fn()
const storeCommitMock = jest.fn()

describe('UserCard_CoinAnimation', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $store: {
      state: {
        language: 'de',
        coinanimation: true,
      },
      commit: storeCommitMock,
    },
    $toasted: {
      success: toastSuccessMock,
      error: toastErrorMock,
    },
    $apollo: {
      mutate: mockAPIcall,
    },
  }

  const Wrapper = () => {
    return mount(UserCardCoinAnimation, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div#formusercoinanimation').exists()).toBeTruthy()
    })

    it('has an edit BFormCheckbox switch', () => {
      expect(wrapper.find('.Test-BFormCheckbox').exists()).toBeTruthy()
    })

    describe('enable with success', () => {
      beforeEach(async () => {
        mocks.$store.state.coinanimation = false
        mockAPIcall.mockResolvedValue({
          data: {
            updateUserInfos: {
              validValues: 1,
            },
          },
        })
        await wrapper.find('input').trigger('change')
      })

      it('calls the updateUserInfos mutation', () => {
        expect(mockAPIcall).toBeCalledWith({
          mutation: updateUserInfos,
          variables: {
            coinanimation: true,
          },
        })
      })

      it('updates the store', () => {
        expect(storeCommitMock).toBeCalledWith('coinanimation', false)
      })

      it('toasts a success message', () => {
        expect(toastSuccessMock).toBeCalledWith('settings.coinanimation.False')
      })
    })

    describe('disable with success', () => {
      beforeEach(async () => {
        mocks.$store.state.coinanimation = true
        mockAPIcall.mockResolvedValue({
          data: {
            updateUserInfos: {
              validValues: 1,
            },
          },
        })
        wrapper.find('input').trigger('change')
      })

      it('calls the subscribe mutation', () => {
        expect(mockAPIcall).toBeCalledWith({
          mutation: updateUserInfos,
          variables: {
            coinanimation: false,
          },
        })
      })

      it('updates the store', () => {
        expect(storeCommitMock).toBeCalledWith('coinanimation', true)
      })

      it('toasts a success message', () => {
        expect(toastSuccessMock).toBeCalledWith('settings.coinanimation.True')
      })
    })

    describe('disable with server error', () => {
      beforeEach(() => {
        mockAPIcall.mockRejectedValue({
          message: 'Ouch',
        })
        wrapper.find('input').trigger('change')
      })

      it('resets the CoinAnimationStatus', () => {
        expect(wrapper.vm.CoinAnimationStatus).toBeTruthy()
      })

      it('toasts an error message', () => {
        expect(toastErrorMock).toBeCalledWith('Ouch')
      })
    })
  })
})
