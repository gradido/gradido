import { mount } from '@vue/test-utils'
import UserCardNewsletter from './UserCard_Newsletter'
import { unsubscribeNewsletter, subscribeNewsletter } from '../../../graphql/mutations'

const localVue = global.localVue

const mockAPIcall = jest.fn()

const toastErrorMock = jest.fn()
const toastSuccessMock = jest.fn()
const storeCommitMock = jest.fn()

describe('UserCard_Newsletter', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $store: {
      state: {
        language: 'de',
        email: 'peter@lustig.de',
        newsletterState: true,
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
    return mount(UserCardNewsletter, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div#formusernewsletter').exists()).toBeTruthy()
    })

    it('has an edit BFormCheckbox switch', () => {
      expect(wrapper.find('.Test-BFormCheckbox').exists()).toBeTruthy()
    })

    describe('unsubscribe with sucess', () => {
      beforeEach(async () => {
        await wrapper.setData({ newsletterState: false })
        mockAPIcall.mockResolvedValue({
          data: {
            unsubscribeNewsletter: true,
          },
        })
        await wrapper.find('input').trigger('change')
      })

      it('calls the unsubscribe mutation', () => {
        expect(mockAPIcall).toBeCalledWith({
          mutation: unsubscribeNewsletter,
          variables: {
            email: 'peter@lustig.de',
          },
        })
      })

      it('updates the store', () => {
        expect(storeCommitMock).toBeCalledWith('newsletterState', false)
      })

      it('toasts a success message', () => {
        expect(toastSuccessMock).toBeCalledWith('setting.newsletterFalse')
      })
    })

    describe('subscribe with sucess', () => {
      beforeEach(async () => {
        await wrapper.setData({ newsletterState: true })
        mockAPIcall.mockResolvedValue({
          data: {
            subscribeNewsletter: true,
          },
        })
        wrapper.find('input').trigger('change')
      })

      it('calls the subscribe mutation', () => {
        expect(mockAPIcall).toBeCalledWith({
          mutation: subscribeNewsletter,
          variables: {
            email: 'peter@lustig.de',
            language: 'de',
          },
        })
      })

      it('updates the store', () => {
        expect(storeCommitMock).toBeCalledWith('newsletterState', true)
      })

      it('toasts a success message', () => {
        expect(toastSuccessMock).toBeCalledWith('setting.newsletterFalse')
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
        expect(toastErrorMock).toBeCalledWith('Ouch')
      })
    })
  })
})
