import { mount, RouterLinkStub } from '@vue/test-utils'
import flushPromises from 'flush-promises'
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
      expect(wrapper.find('div#registerform').exists()).toBeTruthy()
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
        beforeEach(async () => {
          registerUserMutationMock.mockRejectedValue({ message: 'Ouch!' })
          await wrapper.find('form').trigger('submit')
          await flushPromises()
        })

        it('shows error message', () => {
          expect(wrapper.find('span.alert-text').exists()).toBeTruthy()
          expect(wrapper.find('span.alert-text').text().length !== 0).toBeTruthy()
          expect(wrapper.find('span.alert-text').text()).toContain('error.error')
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
                language: 'en',
                publisherId: 12345,
              },
            }),
          )
          expect(routerPushMock).toHaveBeenCalledWith('/thx/register')
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
