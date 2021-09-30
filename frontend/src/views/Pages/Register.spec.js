import { mount, RouterLinkStub } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import Register from './Register'

const localVue = global.localVue

const registerUserMutationMock = jest.fn()
const routerPushMock = jest.fn()

describe('Register', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $router: {
      push: routerPushMock,
    },
    $apollo: {
      mutate: registerUserMutationMock,
    },
    $store: {
      state: {
        email: 'peter@lustig.de',
        language: 'en',
        community: {
          name: 'Gradido Entwicklung',
          url: 'http://localhost:3000/vue/',
          registerUrl: 'http://localhost:3000/vue/register',
          description: 'Die lokale Entwicklungsumgebung von Gradido.',
        },
      },
    },
  }

  const stubs = {
    RouterLink: RouterLinkStub,
  }

  const Wrapper = () => {
    return mount(Register, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the Register form', () => {
      expect(wrapper.find('div#registerform').exists()).toBeTruthy()
    })

    describe('Register header', () => {
      it('has a welcome message', () => {
        expect(wrapper.find('div.header').text()).toBe('site.signup.title site.signup.subtitle')
      })
    })

    describe('links', () => {
      it('has a link "Back"', () => {
        expect(wrapper.find('.test-button-back').text()).toEqual('back')
      })

      it('links to /login when clicking "Back"', () => {
        expect(wrapper.find('.test-button-back').props().to).toBe('/login')
      })
    })

    describe('Register form', () => {
      it('has a register form', () => {
        expect(wrapper.find('form').exists()).toBeTruthy()
      })

      it('has firstname input fields', () => {
        expect(wrapper.find('#registerFirstname').exists()).toBeTruthy()
      })
      it('has lastname input fields', () => {
        expect(wrapper.find('#registerLastname').exists()).toBeTruthy()
      })

      it('has email input fields', () => {
        expect(wrapper.find('#Email-input-field').exists()).toBeTruthy()
      })

      it('has password input fields', () => {
        expect(wrapper.find('input[name="form.password"]').exists()).toBeTruthy()
      })

      it('has password repeat input fields', () => {
        expect(wrapper.find('input[name="form.passwordRepeat"]').exists()).toBeTruthy()
      })
      it('has Language selected field', () => {
        expect(wrapper.find('.selectedLanguage').exists()).toBeTruthy()
      })
      it('selects Language value en', async () => {
        wrapper.find('.selectedLanguage').findAll('option').at(1).setSelected()
        expect(wrapper.find('.selectedLanguage').element.value).toBe('en')
      })

      it('has 1 checkbox input fields', () => {
        expect(wrapper.find('#registerCheckbox').exists()).toBeTruthy()
      })

      it('has disabled submit button when not completely filled', () => {
        expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBe('disabled')
      })

      it('displays a message that Email is required', async () => {
        await wrapper.find('form').trigger('submit')
        await flushPromises()
        expect(wrapper.findAll('div.invalid-feedback').at(0).text()).toBe(
          'validations.messages.required',
        )
      })

      it('displays a message that password is required', async () => {
        await wrapper.find('form').trigger('submit')
        await flushPromises()
        expect(wrapper.findAll('div.invalid-feedback').at(1).text()).toBe(
          'validations.messages.required',
        )
      })

      it('displays a message that passwordConfirm is required', async () => {
        await wrapper.find('form').trigger('submit')
        await flushPromises()
        expect(wrapper.findAll('div.invalid-feedback').at(2).text()).toBe(
          'validations.messages.required',
        )
      })
    })

    describe('link Choose another community', () => {
      it('has a link "Choose another community"', () => {
        expect(wrapper.find('.test-button-another-community').text()).toEqual(
          'community.choose-another-community',
        )
      })

      it('links to /select-community when clicking "Choose another community"', () => {
        expect(wrapper.find('.test-button-another-community').props().to).toBe('/select-community')
      })
    })

    describe('API calls', () => {
      beforeEach(() => {
        wrapper.find('#registerFirstname').setValue('Max')
        wrapper.find('#registerLastname').setValue('Mustermann')
        wrapper.find('#Email-input-field').setValue('max.mustermann@gradido.net')
        wrapper.find('input[name="form.password"]').setValue('Aa123456_')
        wrapper.find('input[name="form.passwordRepeat"]').setValue('Aa123456_')
        wrapper.find('.language-switch-select').findAll('option').at(1).setSelected()
      })

      it('has enabled submit button when completely filled', () => {
        expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBe('disabled')
      })

      describe('server sends back error', () => {
        beforeEach(async () => {
          registerUserMutationMock.mockRejectedValue({ message: 'Ouch!' })
          await wrapper.find('form').trigger('submit')
          await flushPromises()
        })

        it('shows error message', () => {
          expect(wrapper.find('span.alert-text').exists()).toBeTruthy()
          expect(wrapper.find('span.alert-text').text().length !== 0).toBeTruthy()
          expect(wrapper.find('span.alert-text').text()).toContain('error.error!')
          expect(wrapper.find('span.alert-text').text()).toContain('Ouch!')
        })

        it('button to dismisses error message is present', () => {
          expect(wrapper.find('button.close').exists()).toBeTruthy()
        })

        it('dismisses error message', async () => {
          await wrapper.find('button.close').trigger('click')
          await flushPromises()
          expect(wrapper.find('span.alert-text').exists()).not.toBeTruthy()
        })
      })

      describe('server sends back success', () => {
        beforeEach(() => {
          registerUserMutationMock.mockResolvedValue({
            data: {
              create: 'success',
            },
          })
        })

        it('routes to "/thx/register"', async () => {
          await wrapper.find('form').trigger('submit')
          await flushPromises()
          expect(registerUserMutationMock).toBeCalledWith(
            expect.objectContaining({
              variables: {
                email: 'max.mustermann@gradido.net',
                firstName: 'Max',
                lastName: 'Mustermann',
                password: 'Aa123456_',
                language: 'en',
              },
            }),
          )
          expect(routerPushMock).toHaveBeenCalledWith('/thx/register')
        })
      })
    })
    // TODO: line 157
  })
})
