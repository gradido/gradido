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

    describe('with linked user', () => {
      beforeEach(async () => {
        await wrapper.setProps({
          linkedUser: { firstName: 'Bibi', lastName: 'Bloxberg', email: 'bibi@bloxberg.de' },
        })
      })

      it('has a link with first and last name', () => {
        expect(wrapper.find('div.gdd-transaction-list-item-name').text()).toBe('Bibi Bloxberg')
      })

      it('has a link', () => {
        expect(wrapper.find('div.gdd-transaction-list-item-name').find('a').exists()).toBe(true)
      })

      describe('click link', () => {
        beforeEach(async () => {
          await wrapper.find('div.gdd-transaction-list-item-name').find('a').trigger('click')
        })

        it('emits  set tunneled email', () => {
          expect(wrapper.emitted('set-tunneled-email')).toEqual([['bibi@bloxberg.de']])
        })

        it('pushes the route with query for email', () => {
          expect(mocks.$router.push).toBeCalledWith({
            path: '/send',
          })
        })
      })
    })
  })
})
