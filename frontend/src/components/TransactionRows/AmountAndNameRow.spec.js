import { mount } from '@vue/test-utils'
import AmountAndNameRow from './AmountAndNameRow'

const localVue = global.localVue

const mocks = {
  $router: {
    push: jest.fn(),
  },
}

const propsData = {
  amount: '19.99',
  text: 'Some text',
}

describe('AmountAndNameRow', () => {
  let wrapper

  const Wrapper = () => {
    return mount(AmountAndNameRow, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.amount-and-name-row').exists()).toBe(true)
    })

    describe('without linked user', () => {
      it('has a span with the text', () => {
        expect(wrapper.find('div.gdd-transaction-list-item-name').text()).toBe('Some text')
      })

      it('has no link', () => {
        expect(wrapper.find('div.gdd-transaction-list-item-name').find('a').exists()).toBe(false)
      })
    })
  })
})
