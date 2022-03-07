import { mount } from '@vue/test-utils'
import UserCardCoinAnimation from './UserCard_CoinAnimation'
import { updateUserInfos } from '@/graphql/mutations'

import { toastErrorSpy, toastSuccessSpy } from '@test/testSetup'

const localVue = global.localVue

const mockAPIcall = jest.fn()

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
    $apollo: {
      mutate: mockAPIcall,
    },
  }

  const Wrapper = () => {
    return mount(UserCardCoinAnimation, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
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
        await wrapper.setData({ CoinAnimationStatus: false })
        mockAPIcall.mockResolvedValue({
          data: {
            updateUserInfos: {
              validValues: 1,
            },
          },
        })
        await wrapper.find('input').setChecked()
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
        expect(storeCommitMock).toBeCalledWith('coinanimation', true)
      })

      it('toasts a success message', () => {
        expect(toastSuccessSpy).toBeCalledWith('settings.coinanimation.True')
      })
    })

    describe('disable with success', () => {
      beforeEach(async () => {
        await wrapper.setData({ CoinAnimationStatus: true })
        mockAPIcall.mockResolvedValue({
          data: {
            updateUserInfos: {
              validValues: 1,
            },
          },
        })
        await wrapper.find('input').setChecked(false)
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
        expect(storeCommitMock).toBeCalledWith('coinanimation', false)
      })

      it('toasts a success message', () => {
        expect(toastSuccessSpy).toBeCalledWith('settings.coinanimation.False')
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
        expect(toastErrorSpy).toBeCalledWith('Ouch')
      })
    })
  })
})
