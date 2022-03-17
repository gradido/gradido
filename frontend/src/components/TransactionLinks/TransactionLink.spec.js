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
  memo: 'asdasdaadsdd asd asdadss',
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

        it('toasts success message', () => {
          expect(toastSuccessSpy).toBeCalledWith(
            'gdd_per_link.link-copied' + '\n' + 'http://localhost/redeem/c00000000c000000c0000',
          )
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

    describe('deleteLink', () => {
      beforeEach(async () => {
        jest.clearAllMocks()
        mockAPIcall.mockResolvedValue()
        await wrapper.findAll('button').at(1).trigger('click')
      })

      it('test Modal if confirm true', () => {
        const spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
        spy.mockImplementation(() => Promise.resolve('some value'))
        wrapper.vm.deleteLink()
        expect(spy).toHaveBeenCalled()
      })

      it('calls the API', () => {
        expect.objectContaining({
          mutation: deleteTransactionLink,
          variables: {
            id: 12,
          },
        })
      })
    })

    // describe('delete with error', () => {
    //   beforeEach(async () => {
    //     mockAPIcall.mockRejectedValue({ message: 'Oh no!' })
    //     await wrapper.findAll('button').at(1).trigger('click')
    //   })

    //   it('toasts an error message', () => {
    //     expect(toastErrorSpy).toBeCalledWith('Oh no!')
    //   })
    // })
  })
})
