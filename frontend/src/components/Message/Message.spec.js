import { mount } from '@vue/test-utils'
import Message from './Message'

const localVue = global.localVue

const propsData = {
  headline: 'site.thx.title',
  subtitle: 'site.thx.email',
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
      expect(wrapper.find('div.header').exists()).toBeTruthy()
    })

    it('renders title, subtitle, and button text', () => {
      expect(wrapper.find('.test-message-headline').text()).toBe('site.thx.title')
      expect(wrapper.find('.test-message-subtitle').text()).toBe('site.thx.email')
      expect(wrapper.find('.test-message-button').text()).toBe('login')
    })

    it('button link redirects to /login', () => {
      // Wolle console.log(wrapper.html())
      expect(wrapper.find('a.btn').attributes('href')).toBe('/login')
    })
  })

  // Wolle: test 'code' prop and have a look if there is other important stuff uncommented below

  // Wolle describe('coming from /forgot-password', () => {
  //   beforeEach(() => {
  //     wrapper = Wrapper(createMockObject('forgotPassword'))
  //   })

  //   it('renders the thanks text', () => {
  //     expect(wrapper.find('p.h4').text()).toBe('site.thx.email')
  //   })

  //   it('renders the thanks redirect button', () => {
  //     expect(wrapper.find('a.btn').text()).toBe('login')
  //   })

  //   it('links the redirect button to /login', () => {
  //     expect(wrapper.find('a.btn').attributes('href')).toBe('/login')
  //   })
  // })

  // describe('coming from /reset-password', () => {
  //   beforeEach(() => {
  //     wrapper = Wrapper(createMockObject('resetPassword'))
  //   })

  //   it('renders the thanks text', () => {
  //     expect(wrapper.find('p.h4').text()).toBe('site.thx.reset')
  //   })

  //   it('renders the thanks redirect button', () => {
  //     expect(wrapper.find('a.btn').text()).toBe('login')
  //   })

  //   it('links the redirect button to /login', () => {
  //     expect(wrapper.find('a.btn').attributes('href')).toBe('/login')
  //   })
  // })

  // describe('coming from /register', () => {
  //   beforeEach(() => {
  //     wrapper = Wrapper(createMockObject('register'))
  //   })

  //   it('renders the thanks text', () => {
  //     expect(wrapper.find('p.h4').text()).toBe('site.thx.register')
  //   })
  // })

  // describe('coming from /login', () => {
  //   beforeEach(() => {
  //     wrapper = Wrapper(createMockObject('login'))
  //   })

  //   it('renders the thanks text', () => {
  //     expect(wrapper.find('p.h4').text()).toBe('error.backend.ERR_EMAIL_NOT_VALIDATED')
  //   })

  //   it('renders the thanks redirect button', () => {
  //     expect(wrapper.find('a.btn').text()).toBe('settings.password.reset')
  //   })

  //   it('links the redirect button to /forgot-password', () => {
  //     expect(wrapper.find('a.btn').attributes('href')).toBe('/forgot-password')
  //   })
  // })
})
