import { mount } from '@vue/test-utils'
import Message from './Message'

const localVue = global.localVue

const propsData = {
  headline: 'Headline text',
  subtitle: 'Subtitle text',
  buttonText: 'login',
  linkTo: '/login',
}

const mocks = {
  $t: jest.fn((t) => t),
}

describe('Message', () => {
  let wrapper

  const Wrapper = () => {
    return mount(Message, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.header').exists()).toBe(true)
    })

    describe('with button', () => {
      it('renders title, subtitle, and button text', () => {
        expect(wrapper.find('.test-message-headline').text()).toBe('Headline text')
        expect(wrapper.find('.test-message-subtitle').text()).toBe('Subtitle text')
        expect(wrapper.find('.test-message-button').text()).toBe('login')
      })

      it('button link redirects to /login', () => {
        expect(wrapper.find('a.btn').attributes('href')).toBe('/login')
      })
    })

    describe('without button', () => {
      beforeEach(() => {
        wrapper.setProps({
          buttonText: null,
          linkTo: null,
        })
      })

      it('renders title, subtitle, and button text', () => {
        expect(wrapper.find('.test-message-headline').text()).toBe('Headline text')
        expect(wrapper.find('.test-message-subtitle').text()).toBe('Subtitle text')
      })

      it('button is not shown', () => {
        expect(wrapper.find('.test-message-button').exists()).toBe(false)
      })
    })
  })
})
