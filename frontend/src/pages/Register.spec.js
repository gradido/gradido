import { mount, RouterLinkStub } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import { ERRORS } from '@/config/errors'
import { toastErrorSpy } from '@test/testSetup'
import Register from './Register'

const localVue = global.localVue

const mockStoreCommit = jest.fn()
const registerUserMutationMock = jest.fn()
const routerPushMock = jest.fn()

describe('Register', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $te: jest.fn((te) => true),
    $router: {
      push: routerPushMock,
    },
    $route: {
      params: {},
    },
    $apollo: {
      mutate: registerUserMutationMock,
    },
    $store: {
      commit: mockStoreCommit,
      state: {
        email: 'peter@lustig.de',
        language: 'en',
        publisherId: 12345,
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
      expect(wrapper.find('div#registerform').exists()).toBe(true)
    })

    describe('Register header', () => {
      it('has a welcome message', () => {
        expect(wrapper.find('div.header').text()).toBe('site.signup.title site.signup.subtitle')
      })
    })

    describe('Community data already loaded', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        mocks.$store.state.community = {
          name: 'Gradido Entwicklung',
          url: 'http://localhost/',
          registerUrl: 'http://localhost/register',
          description: 'Die lokale Entwicklungsumgebung von Gradido.',
        }
        wrapper = Wrapper()
      })

      it('has a Community name', () => {
        expect(wrapper.find('.test-communitydata b').text()).toBe('Gradido Entwicklung')
      })

      it('has a Community description', () => {
        expect(wrapper.find('.test-communitydata p').text()).toBe(
          'Die lokale Entwicklungsumgebung von Gradido.',
        )
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
        expect(wrapper.find('form').exists()).toBe(true)
      })

      it('has firstname input fields', () => {
        expect(wrapper.find('#registerFirstname').exists()).toBe(true)
      })
      it('has lastname input fields', () => {
        expect(wrapper.find('#registerLastname').exists()).toBe(true)
      })

      it('has email input fields', () => {
        expect(wrapper.find('#Email-input-field').exists()).toBe(true)
      })

      it('has Language selected field', () => {
        expect(wrapper.find('.selectedLanguage').exists()).toBe(true)
      })

      it('selects Language value en', async () => {
        wrapper.find('.selectedLanguage').findAll('option').at(1).setSelected()
        expect(wrapper.find('.selectedLanguage').element.value).toBe('en')
      })

      it('has 1 checkbox input fields', () => {
        expect(wrapper.find('#registerCheckbox').exists()).toBe(true)
      })

      it('has PublisherId input fields', () => {
        wrapper.find('.publisherCollaps').trigger('click')
        expect(wrapper.find('#publisherid').exists()).toBe(true)
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

    /*
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
    */

    describe('API calls when form is missing input', () => {
      beforeEach(() => {
        wrapper.find('#registerFirstname').setValue('Max')
        wrapper.find('#registerLastname').setValue('Mustermann')
        wrapper.find('.language-switch-select').findAll('option').at(1).setSelected()
        wrapper.find('#publisherid').setValue('12345')
      })
      it('has disabled submit button when missing input checked box', () => {
        wrapper.find('#Email-input-field').setValue('max.mustermann@gradido.net')
        expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBe('disabled')
      })

      it('has disabled submit button when missing email input', () => {
        wrapper.find('#registerCheckbox').setChecked()
        expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBe('disabled')
      })
    })

    describe('API calls when completely filled and missing publisherid', () => {
      beforeEach(() => {
        wrapper.find('#registerFirstname').setValue('Max')
        wrapper.find('#registerLastname').setValue('Mustermann')
        wrapper.find('#Email-input-field').setValue('max.mustermann@gradido.net')
        wrapper.find('.language-switch-select').findAll('option').at(1).setSelected()
        wrapper.find('#registerCheckbox').setChecked()
      })
      it('has enabled submit button when completely filled', async () => {
        await wrapper.vm.$nextTick()
        expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBe(undefined)
      })
    })

    describe('API calls when completely filled', () => {
      beforeEach(() => {
        wrapper.find('#registerFirstname').setValue('Max')
        wrapper.find('#registerLastname').setValue('Mustermann')
        wrapper.find('#Email-input-field').setValue('max.mustermann@gradido.net')
        wrapper.find('.language-switch-select').findAll('option').at(1).setSelected()
        wrapper.find('#publisherid').setValue('12345')
        wrapper.find('#registerCheckbox').setChecked()
      })

      it('commits publisherId to store', () => {
        expect(mockStoreCommit).toBeCalledWith('publisherId', 12345)
      })

      it('has enabled submit button when completely filled', async () => {
        await wrapper.vm.$nextTick()
        expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBe(undefined)
      })

      describe('server sends back error', () => {
        const createError = async (errorMessage) => {
          registerUserMutationMock.mockRejectedValue({
            message: errorMessage,
          })
          await wrapper.find('form').trigger('submit')
          await flushPromises()
        }

        describe('server sends back error "User already exists."', () => {
          beforeEach(async () => {
            await createError('GraphQL error: ' + ERRORS.ERR_USER_ALREADY_EXISTS)
          })

          it('shows no error message on the page', () => {
            // don't show any error on the page! against boots
            expect(wrapper.vm.showPageMessage).toBe(false)
            expect(wrapper.find('.test-message-headline').exists()).toBe(false)
            expect(wrapper.find('.test-message-subtitle').exists()).toBe(false)
            expect(wrapper.find('.test-message-button').exists()).toBe(false)
          })

          it('toasts the error message', () => {
            expect(toastErrorSpy).toBeCalledWith('error.backend.ERR_USER_ALREADY_EXISTS')
          })
        })

        describe('server sends back error "Unknown error"', () => {
          beforeEach(async () => {
            await createError(' – Unknown error.')
          })

          it('shows no error message on the page', () => {
            // don't show any error on the page! against boots
            expect(wrapper.vm.showPageMessage).toBe(false)
            expect(wrapper.find('.test-message-headline').exists()).toBe(false)
            expect(wrapper.find('.test-message-subtitle').exists()).toBe(false)
            expect(wrapper.find('.test-message-button').exists()).toBe(false)
          })

          it('toasts the error message', () => {
            expect(toastErrorSpy).toBeCalledWith('error.backend. – Unknown error.')
          })
        })
      })

      describe('server sends back success', () => {
        beforeEach(async () => {
          registerUserMutationMock.mockResolvedValue({
            data: {
              create: 'success',
            },
          })
          await wrapper.find('form').trigger('submit')
          await flushPromises()
        })

        it('submit sends apollo mutate', () => {
          expect(registerUserMutationMock).toBeCalledWith(
            expect.objectContaining({
              variables: {
                email: 'max.mustermann@gradido.net',
                firstName: 'Max',
                lastName: 'Mustermann',
                language: 'en',
                publisherId: 12345,
              },
            }),
          )
        })

        it('shows success title, subtitle', () => {
          expect(wrapper.vm.showPageMessage).toBe(true)
          expect(wrapper.find('.test-message-headline').text()).toBe('site.thx.title')
          expect(wrapper.find('.test-message-subtitle').text()).toBe('site.thx.register')
        })

        it('button is not present', () => {
          expect(wrapper.find('.test-message-button').exists()).toBe(false)
        })
      })
    })

    describe('redeem code', () => {
      describe('no redeem code', () => {
        it('has no redeem code', () => {
          expect(wrapper.vm.redeemCode).toBe(undefined)
        })
      })
    })

    describe('with redeem code', () => {
      beforeEach(async () => {
        jest.clearAllMocks()
        mocks.$route.params = {
          code: 'some-code',
        }
        wrapper = Wrapper()
        wrapper.find('#registerFirstname').setValue('Max')
        wrapper.find('#registerLastname').setValue('Mustermann')
        wrapper.find('#Email-input-field').setValue('max.mustermann@gradido.net')
        wrapper.find('.language-switch-select').findAll('option').at(1).setSelected()
        wrapper.find('#registerCheckbox').setChecked()
        await wrapper.find('form').trigger('submit')
        await flushPromises()
      })

      it('sends the redeem code to the server', () => {
        expect(registerUserMutationMock).toBeCalledWith(
          expect.objectContaining({
            variables: {
              email: 'max.mustermann@gradido.net',
              firstName: 'Max',
              lastName: 'Mustermann',
              language: 'en',
              publisherId: 12345,
              redeemCode: 'some-code',
            },
          }),
        )
      })
    })
  })
})
