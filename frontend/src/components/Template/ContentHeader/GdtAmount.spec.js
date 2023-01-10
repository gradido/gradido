import { mount } from '@vue/test-utils'
import GdtAmount from './GdtAmount'
import { updateUserInfos } from '@/graphql/mutations'
import flushPromises from 'flush-promises'

import { toastErrorSpy, toastSuccessSpy } from '@test/testSetup'

const localVue = global.localVue

const mockAPICall = jest.fn()
const storeCommitMock = jest.fn()

const state = {
  hideAmountGDT: false,
}

const mocks = {
  $store: {
    state,
    commit: storeCommitMock,
  },
  $i18n: {
    locale: 'en',
  },
  $apollo: {
    mutate: mockAPICall,
  },
  $t: jest.fn((t) => t),
  $n: jest.fn((n) => n),
}

const propsData = {
  path: 'string',
  GdtBalance: 123.45,
  badgeShow: false,
  showStatus: false,
}

describe('GdtAmount', () => {
  let wrapper

  const Wrapper = () => {
    return mount(GdtAmount, { localVue, mocks, propsData })
  }
  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component gdt-amount', () => {
      expect(wrapper.find('div.gdt-amount').exists()).toBe(true)
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
              hideAmountGDT: true,
            },
          }),
        )
      })

      it('commits hideAmountGDT to store', () => {
        expect(storeCommitMock).toBeCalledWith('hideAmountGDT', true)
      })

      it('toasts a success message', () => {
        expect(toastSuccessSpy).toBeCalledWith('settings.showAmountGDT')
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
            hideAmountGDT: true,
          },
        }),
      )
    })

    it('commits hideAmountGDT to store', () => {
      expect(storeCommitMock).toBeCalledWith('hideAmountGDT', false)
    })

    it('toasts a success message', () => {
      expect(toastSuccessSpy).toBeCalledWith('settings.hideAmountGDT')
    })
  })
})
