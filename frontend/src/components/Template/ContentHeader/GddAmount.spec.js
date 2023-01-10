import { mount } from '@vue/test-utils'
import GddAmount from './GddAmount'
import { updateUserInfos } from '@/graphql/mutations'
import flushPromises from 'flush-promises'

import { toastErrorSpy, toastSuccessSpy } from '@test/testSetup'

const localVue = global.localVue

const mockAPICall = jest.fn()
const storeCommitMock = jest.fn()

const state = {
  hideAmountGDD: false,
}

const mocks = {
  $store: {
    state,
    commit: storeCommitMock,
  },
  $i18n: {
    locale: 'en',
  },
  $t: jest.fn((t) => t),
  $apollo: {
    mutate: mockAPICall,
  },
}

const propsData = {
  path: 'string',
  balance: 123.45,
  badgeShow: false,
  showStatus: false,
}

describe('GddAmount', () => {
  let wrapper

  const Wrapper = () => {
    return mount(GddAmount, { localVue, mocks, propsData })
  }
  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component gdd-amount', () => {
      expect(wrapper.find('div.gdd-amount').exists()).toBe(true)
    })

    describe('API throws exception', () => {
      beforeEach(async () => {
        mockAPICall.mockRejectedValue({
          message: 'Ouch',
        })
        jest.clearAllMocks()
        await wrapper.find('div.border-left svg').trigger('click')
        await flushPromises()
      })

      it('toasts an error message', () => {
        expect(toastErrorSpy).toBeCalledWith('Ouch')
      })
    })

    describe('API call successful', () => {
      beforeEach(async () => {
        mockAPICall.mockResolvedValue({
          data: {
            updateUserInfos: {
              validValues: 1,
            },
          },
        })
        jest.clearAllMocks()
        await wrapper.find('div.border-left svg').trigger('click')
        await flushPromises()
      })

      it('calls the API', () => {
        expect(mockAPICall).toBeCalledWith(
          expect.objectContaining({
            mutation: updateUserInfos,
            variables: {
              hideAmountGDD: true,
            },
          }),
        )
      })

      it('commits hideAmountGDD to store', () => {
        expect(storeCommitMock).toBeCalledWith('hideAmountGDD', true)
      })

      it('toasts a success message', () => {
        expect(toastSuccessSpy).toBeCalledWith('settings.showAmountGDD')
      })
    })
  })

  describe.skip('second call to API', () => {
    beforeEach(async () => {
      mockAPICall.mockResolvedValue({
        data: {
          updateUserInfos: {
            validValues: 1,
          },
        },
      })
      jest.clearAllMocks()
      await wrapper.find('div.border-left svg').trigger('click')
      await flushPromises()
    })

    it('calls the API', () => {
      expect(mockAPICall).toBeCalledWith(
        expect.objectContaining({
          mutation: updateUserInfos,
          variables: {
            hideAmountGDD: true,
          },
        }),
      )
    })

    it('commits hideAmountGDD to store', () => {
      expect(storeCommitMock).toBeCalledWith('hideAmountGDD', false)
    })

    it('toasts a success message', () => {
      expect(toastSuccessSpy).toBeCalledWith('settings.hideAmountGDD')
    })
  })
})
