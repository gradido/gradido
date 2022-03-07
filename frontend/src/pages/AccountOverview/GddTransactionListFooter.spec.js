import { mount, RouterLinkStub } from '@vue/test-utils'
import GddTransactionListFooter from './GddTransactionListFooter'

const localVue = global.localVue

describe('GddTransactionListFooter', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
  }

  const stubs = {
    RouterLink: RouterLinkStub,
  }

  const Wrapper = () => {
    return mount(GddTransactionListFooter, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.list-group').exists()).toBeTruthy()
    })

    it('contains no text', () => {
      expect(wrapper.text()).toBe('')
    })
  })

  describe('count property is greater than 5', () => {
    beforeEach(async () => {
      wrapper.setProps({ count: 6 })
    })

    it('renders a link to show all', () => {
      expect(wrapper.text()).toBe('transaction.show_all')
    })

    it('links to /transactions', () => {
      expect(wrapper.findComponent(RouterLinkStub).props().to).toBe('/transactions')
    })
  })
})
