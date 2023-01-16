import { mount, RouterLinkStub } from '@vue/test-utils'
import flushPromises from 'flush-promises'
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
        expect(wrapper.find('div[data-test="input-email"]').find('input').exists()).toBe(true)
      })

      it('has 1 checkbox input fields', () => {
        expect(wrapper.find('#registerCheckbox').exists()).toBe(true)
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

    describe('API calls when form is missing input', () => {
      beforeEach(() => {
        wrapper.find('#registerFirstname').setValue('Max')
        wrapper.find('#registerLastname').setValue('Mustermann')
      })
      it('has disabled submit button when missing input checked box', () => {
        wrapper
          .find('div[data-test="input-email"]')
          .find('input')
          .setValue('max.mustermann@gradido.net')
        expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBe('disabled')
      })

      it('has disabled submit button when missing email input', () => {
        wrapper.find('#registerCheckbox').setChecked()
        expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBe('disabled')
      })
    })

    describe('API calls when completely filled', () => {
      beforeEach(() => {
        wrapper.find('#registerFirstname').setValue('Max')
        wrapper.find('#registerLastname').setValue('Mustermann')
        wrapper
          .find('div[data-test="input-email"]')
          .find('input')
          .setValue('max.mustermann@gradido.net')
        wrapper.find('#registerCheckbox').setChecked()
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
            expect(toastErrorSpy).toBeCalledWith('error.unknown-error – Unknown error.')
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
              },
            }),
          )
        })

        it('shows success title, subtitle', () => {
          expect(wrapper.vm.showPageMessage).toBe(true)
          expect(wrapper.find('.test-message-headline').text()).toBe('message.title')
          expect(wrapper.find('.test-message-subtitle').text()).toBe('message.register')
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
        wrapper
          .find('div[data-test="input-email"]')
          .find('input')
          .setValue('max.mustermann@gradido.net')
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
              redeemCode: 'some-code',
            },
          }),
        )
      })
    })
  })
})
