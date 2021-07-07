import { mount, RouterLinkStub } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import loginAPI from '../../apis/loginAPI.js'
import ForgotPassword from './ForgotPassword'

jest.mock('../../apis/loginAPI.js')

const mockAPIcall = jest.fn()
loginAPI.sendEmail = mockAPIcall

const localVue = global.localVue

const mockRouterPush = jest.fn()

describe('ForgotPassword', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $router: {
      push: mockRouterPush,
    },
  }

  const stubs = {
    RouterLink: RouterLinkStub,
  }

  const Wrapper = () => {
    return mount(ForgotPassword, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.forgot-password').exists()).toBeTruthy()
    })

    it('has a title', () => {
      expect(wrapper.find('h1').text()).toEqual('site.password.title')
    })

    it('has a subtitle', () => {
      expect(wrapper.find('p.text-lead').text()).toEqual('site.password.subtitle')
    })

    describe('back button', () => {
      it('has a "back" button', () => {
        expect(wrapper.findComponent(RouterLinkStub).text()).toEqual('back')
      })

      it('links to login', () => {
        expect(wrapper.findComponent(RouterLinkStub).props().to).toEqual('/Login')
      })
    })

    describe('input form', () => {
      let form

      beforeEach(() => {
        form = wrapper.find('form')
      })

      it('has the label "Email"', () => {
        expect(form.find('label').text()).toEqual('Email')
      })

      it('has the placeholder "Email"', () => {
        expect(form.find('input').attributes('placeholder')).toEqual('Email')
      })

      it('has a submit button', () => {
        expect(form.find('button[type="submit"]').exists()).toBeTruthy()
      })

      describe('invalid Email', () => {
        beforeEach(async () => {
          await form.find('input').setValue('no-email')
          await flushPromises()
        })

        it('displays an error', () => {
          expect(form.find('div.invalid-feedback').text()).toEqual('validations.messages.email')
        })

        it('does not call the API', () => {
          expect(mockAPIcall).not.toHaveBeenCalled()
        })
      })

      describe('valid Email', () => {
        beforeEach(async () => {
          await form.find('input').setValue('user@example.org')
          await form.trigger('submit')
          await flushPromises()
        })

        it('calls the API', () => {
          expect(mockAPIcall).toHaveBeenCalledWith('user@example.org')
        })

        it('pushes "/thx/password" to the route', () => {
          expect(mockRouterPush).toHaveBeenCalledWith('/thx/password')
        })
      })
    })
  })
})
