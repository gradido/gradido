import { mount } from '@vue/test-utils'
import UserNewsletter from './UserNewsletter'
import { unsubscribeNewsletter, subscribeNewsletter } from '@/graphql/mutations'

import { toastErrorSpy, toastSuccessSpy } from '@test/testSetup'

const localVue = global.localVue

const mockAPIcall = jest.fn()

const storeCommitMock = jest.fn()

describe('UserCard_Newsletter', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $store: {
      state: {
        language: 'de',
        newsletterState: true,
      },
      commit: storeCommitMock,
    },
    $apollo: {
      mutate: mockAPIcall,
    },
  }

  const Wrapper = () => {
    return mount(UserNewsletter, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div#formusernewsletter').exists()).toBeTruthy()
    })

    it('has an edit BFormCheckbox switch', () => {
      expect(wrapper.find('.Test-BFormCheckbox').exists()).toBeTruthy()
    })

    describe('unsubscribe with success', () => {
      beforeEach(async () => {
        await wrapper.setData({ newsletterState: true })
        mockAPIcall.mockResolvedValue({
          data: {
            unsubscribeNewsletter: true,
          },
        })
        await wrapper.find('input').setChecked(false)
      })

      it('calls the unsubscribe mutation', () => {
        expect(mockAPIcall).toBeCalledWith({
          mutation: unsubscribeNewsletter,
        })
      })

      it('updates the store', () => {
        expect(storeCommitMock).toBeCalledWith('newsletterState', false)
      })

      it('toasts a success message', () => {
        expect(toastSuccessSpy).toBeCalledWith('settings.newsletter.newsletterFalse')
      })
    })

    describe('subscribe with success', () => {
      beforeEach(async () => {
        await wrapper.setData({ newsletterState: false })
        mockAPIcall.mockResolvedValue({
          data: {
            subscribeNewsletter: true,
          },
        })
        await wrapper.find('input').setChecked()
      })

      it('calls the subscribe mutation', () => {
        expect(mockAPIcall).toBeCalledWith({
          mutation: subscribeNewsletter,
        })
      })

      it('updates the store', () => {
        expect(storeCommitMock).toBeCalledWith('newsletterState', true)
      })

      it('toasts a success message', () => {
        expect(toastSuccessSpy).toBeCalledWith('settings.newsletter.newsletterTrue')
      })
    })

    describe('unsubscribe with server error', () => {
      beforeEach(() => {
        mockAPIcall.mockRejectedValue({
          message: 'Ouch',
        })
        wrapper.find('input').trigger('change')
      })

      it('resets the newsletterState', () => {
        expect(wrapper.vm.newsletterState).toBeTruthy()
      })

      it('toasts an error message', () => {
        expect(toastErrorSpy).toBeCalledWith('Ouch')
      })
    })
  })
})
