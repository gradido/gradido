import { mount } from '@vue/test-utils'
import TransactionLink from './TransactionLink'
import { deleteTransactionLink } from '@/graphql/mutations'
import { toastErrorSpy, toastSuccessSpy } from '@test/testSetup'

const localVue = global.localVue

const mockAPIcall = jest.fn()
const navigatorClipboardMock = jest.fn()

const mocks = {
  $i18n: {
    locale: 'en',
  },
  $t: jest.fn((t) => t),
  $tc: jest.fn((tc) => tc),
  $apollo: {
    mutate: mockAPIcall,
  },
}

const propsData = {
  amount: '75',
  code: 'c00000000c000000c0000',
  holdAvailableAmount: '5.13109484759482747111',
  id: 12,
  memo: 'Wie schön hier etwas Quatsch zu lesen!',
  validUntil: '2022-03-30T14:22:40.000Z',
}

describe('TransactionLink', () => {
  let wrapper

  const Wrapper = () => {
    return mount(TransactionLink, { localVue, mocks, propsData })
  }
  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component div.transaction-link', () => {
      expect(wrapper.find('div.transaction-link').exists()).toBeTruthy()
    })

    describe('Copy link to Clipboard', () => {
      const navigatorClipboard = navigator.clipboard
      beforeAll(() => {
        delete navigator.clipboard
        navigator.clipboard = { writeText: navigatorClipboardMock }
      })
      afterAll(() => {
        navigator.clipboard = navigatorClipboard
      })

      describe('copy with success', () => {
        beforeEach(async () => {
          navigatorClipboardMock.mockResolvedValue()
          await wrapper.findAll('button').at(0).trigger('click')
        })
        it('should call clipboard.writeText', () => {
          expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            'http://localhost/redeem/c00000000c000000c0000',
          )
        })
        it('toasts success message', () => {
          expect(toastSuccessSpy).toBeCalledWith('gdd_per_link.link-copied')
        })
      })

      describe('copy with error', () => {
        beforeEach(async () => {
          navigatorClipboardMock.mockRejectedValue()
          await wrapper.findAll('button').at(0).trigger('click')
        })

        it('toasts error message', () => {
          expect(toastErrorSpy).toBeCalledWith('gdd_per_link.not-copied')
        })
      })
    })

    describe('qr code modal', () => {
      let spy

      beforeEach(() => {
        jest.clearAllMocks()
      })

      describe.only('with success', () => {
        beforeEach(async () => {
          spy = jest.spyOn(wrapper.vm.$bvModal, 'show')
          // spy.mockImplementation(() => Promise.resolve('some value'))
          // mockAPIcall.mockResolvedValue()
          await wrapper.findAll('button').at(1).trigger('click')
        })

        it('qr-code Modal if show', () => {
          expect(spy).toBeCalled()
        })
      })
    })

    describe('delete link', () => {
      let spy

      beforeEach(() => {
        jest.clearAllMocks()
      })

      describe('with success', () => {
        beforeEach(async () => {
          spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
          spy.mockImplementation(() => Promise.resolve('some value'))
          mockAPIcall.mockResolvedValue()
          await wrapper.findAll('button').at(2).trigger('click')
        })

        it('test Modal if confirm true', () => {
          expect(spy).toBeCalled()
        })

        it('calls the API', () => {
          expect(mockAPIcall).toBeCalledWith(
            expect.objectContaining({
              mutation: deleteTransactionLink,
              variables: {
                id: 12,
              },
            }),
          )
        })

        it('toasts a success message', () => {
          expect(toastSuccessSpy).toBeCalledWith('gdd_per_link.deleted')
        })

        it('emits reset transaction link list', () => {
          expect(wrapper.emitted('reset-transaction-link-list')).toBeTruthy()
        })
      })

      describe('with error', () => {
        beforeEach(async () => {
          spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
          spy.mockImplementation(() => Promise.resolve('some value'))
          mockAPIcall.mockRejectedValue({ message: 'Something went wrong :(' })
          await wrapper.findAll('button').at(2).trigger('click')
        })

        it('toasts an error message', () => {
          expect(toastErrorSpy).toBeCalledWith('Something went wrong :(')
        })
      })

      describe('cancel delete', () => {
        beforeEach(async () => {
          spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
          spy.mockImplementation(() => Promise.resolve(false))
          mockAPIcall.mockResolvedValue()
          await wrapper.findAll('button').at(1).trigger('click')
        })

        it('does not call the API', () => {
          expect(mockAPIcall).not.toBeCalled()
        })
      })
    })
  })
})
