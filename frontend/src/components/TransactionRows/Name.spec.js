import { mount } from '@vue/test-utils'
import Name from './Name'

const localVue = global.localVue

const mocks = {
  $router: {
    push: jest.fn(),
    history: {
      current: {
        fullPath: '/transactions',
      },
    },
  },
}

const propsData = {
  text: 'Plaintext Name',
}

describe('Name', () => {
  let wrapper

  const Wrapper = () => {
    return mount(Name, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.name').exists()).toBe(true)
    })

    describe('without linked user', () => {
      it('has a span with the text', () => {
        expect(wrapper.find('div.gdd-transaction-list-item-name').text()).toBe('Plaintext Name')
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
