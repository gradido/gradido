import { mount } from '@vue/test-utils'
import TransactionLink from './TransactionLink'
import { deleteTransactionLink } from '@/graphql/mutations'
import { toastErrorSpy, toastSuccessSpy } from '@test/testSetup'

const localVue = global.localVue

const mockAPIcall = jest.fn()
const navigatorClipboardMock = jest.fn()

const mocks = {
  $t: jest.fn((t) => t),
  $d: jest.fn((d) => d),
  $apollo: {
    mutate: mockAPIcall,
  },
  $store: {
    state: {
      firstName: 'Testy',
    },
  },
}

const propsData = {
  amount: '75',
  link: 'http://localhost/redeem/c00000000c000000c0000',
  holdAvailableAmount: '5.13109484759482747111',
  id: 12,
  memo: 'Katzenauge, Eulenschrei, was verschwunden komm herbei!',
  validUntil: '2022-03-30T14:22:40.000Z',
  text: '',
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

    describe('Link validUntil Date is not valid', () => {
      it('has no copy link button', () => {
        expect(wrapper.find('.test-copy-link').exists()).toBe(false)
      })

      it('has no Qr-Code Button ', () => {
        expect(wrapper.find('.test-qr-code').exists()).toBe(false)
      })

      it('has delete link button ', () => {
        expect(wrapper.find('.test-delete-link').exists()).toBe(true)
      })
    })

    describe('Link validUntil Date is valid ', () => {
      beforeEach(async () => {
        const now = new Date()
        jest.clearAllMocks()
        await wrapper.setProps({
          validUntil: `${new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2)}`,
        })
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

        describe('copy link with success', () => {
          beforeEach(async () => {
            navigatorClipboardMock.mockResolvedValue()
            await wrapper.find('.test-copy-link .dropdown-item').trigger('click')
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

        describe('copy link and text with success', () => {
          beforeEach(async () => {
            navigatorClipboardMock.mockResolvedValue()
            await wrapper.find('.test-copy-text .dropdown-item').trigger('click')
          })

          it.skip('should call clipboard.writeText', () => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
              'http://localhost/redeem/c00000000c000000c0000\n' +
                'Testy transaction-link.send_you 75 Gradido.\n' +
                '"Katzenauge, Eulenschrei, was verschwunden komm herbei!"\n' +
                'gdd_per_link.credit-your-gradido gdd_per_link.validUntilDate\n' +
                'gdd_per_link.link-hint',
            )
          })
          it('toasts success message', () => {
            expect(toastSuccessSpy).toBeCalledWith('gdd_per_link.link-and-text-copied')
          })
        })

        describe('copy link with error', () => {
          beforeEach(async () => {
            navigatorClipboardMock.mockRejectedValue()
            await wrapper.find('.test-copy-link .dropdown-item').trigger('click')
          })

          it('toasts an error', () => {
            expect(toastErrorSpy).toBeCalledWith('gdd_per_link.not-copied')
          })
        })

        describe('copy link and text with error', () => {
          beforeEach(async () => {
            navigatorClipboardMock.mockRejectedValue()
            await wrapper.find('.test-copy-text .dropdown-item').trigger('click')
          })

          it('toasts an error', () => {
            expect(toastErrorSpy).toBeCalledWith('gdd_per_link.not-copied')
          })
        })
      })

      describe('qr code modal', () => {
        let spy

        beforeEach(async () => {
          jest.clearAllMocks()
        })

        describe('with success', () => {
          beforeEach(async () => {
            spy = jest.spyOn(wrapper.vm.$bvModal, 'show')
            // spy.mockImplementation(() => Promise.resolve('some value'))
            // mockAPIcall.mockResolvedValue()
            await wrapper.find('.test-qr-code .dropdown-item').trigger('click')
          })

          it('opens the qr-code Modal', () => {
            expect(spy).toBeCalled()
          })
        })
      })

      describe('delete link', () => {
        let spy

        beforeEach(async () => {
          jest.clearAllMocks()
        })

        describe('with success', () => {
          beforeEach(async () => {
            spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
            spy.mockImplementation(() => Promise.resolve('some value'))
            mockAPIcall.mockResolvedValue()
            await wrapper.find('.test-delete-link .dropdown-item').trigger('click')
          })

          it('opens the modal ', () => {
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
            await wrapper.find('.test-delete-link .dropdown-item').trigger('click')
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
            await wrapper.find('.test-delete-link .dropdown-item').trigger('click')
          })

          it('does not call the API', () => {
            expect(mockAPIcall).not.toBeCalled()
          })
        })
      })
    })
  })
})
