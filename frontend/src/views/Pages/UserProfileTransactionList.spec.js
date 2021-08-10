import { mount } from '@vue/test-utils'
import UserProfileTransactionList from './UserProfileTransactionList'

const localVue = global.localVue

const mutationObserverMock = jest.fn(function MutationObserver(callback) {
  this.observe = jest.fn()
  this.disconnect = jest.fn()
  this.trigger = (mockedMutationsList) => {
    callback(mockedMutationsList, this)
  }
})

global.MutationObserver = mutationObserverMock

describe('UserProfileTransactionList', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $n: jest.fn((n) => String(n)),
  }

  const Wrapper = () => {
    return mount(UserProfileTransactionList, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the transaction table', () => {
      expect(wrapper.findComponent({ name: 'GddTransactionList' }).exists()).toBeTruthy()
    })

    it('emits update-transactions after creation', () => {
      expect(wrapper.emitted('update-transactions')).toEqual(
        expect.arrayContaining([expect.arrayContaining([{ firstPage: 1, items: 25 }])]),
      )
    })

    it('emist update-transactions when update-transactions is called', () => {
      wrapper
        .findComponent({ name: 'GddTransactionList' })
        .vm.$emit('update-transactions', { firstPage: 2, items: 25 })
      expect(wrapper.emitted('update-transactions')).toEqual(
        expect.arrayContaining([expect.arrayContaining([{ firstPage: 2, items: 25 }])]),
      )
    })

    it('renders the transaction gradido transform table', () => {
      expect(wrapper.findComponent({ name: 'GdtTransactionList' }).exists()).toBeTruthy()
    })
  })
})
