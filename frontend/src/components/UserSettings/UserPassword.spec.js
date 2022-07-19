import { mount } from '@vue/test-utils'
import UserPassword from './UserPassword'
import flushPromises from 'flush-promises'

import { toastErrorSpy, toastSuccessSpy } from '@test/testSetup'

const localVue = global.localVue

const changePasswordProfileMock = jest.fn()
changePasswordProfileMock.mockReturnValue({ success: true })

describe('UserCard_FormUserPasswort', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $apollo: {
      mutate: changePasswordProfileMock,
    },
  }

  const Wrapper = () => {
    return mount(UserPassword, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div#change_pwd').exists()).toBeTruthy()
    })

    it('has a change password button', () => {
      expect(wrapper.find('a').exists()).toBeTruthy()
    })

    it('has a change password button with text "form.change-password"', () => {
      expect(wrapper.find('a').text()).toEqual('settings.password.change-password')
    })

    it('has a change password button with a pencil icon', () => {
      expect(wrapper.find('svg.bi-pencil').exists()).toBeTruthy()
    })

    describe('change password from', () => {
      let form

      beforeEach(async () => {
        await wrapper.find('a').trigger('click')
        await flushPromises()
        form = wrapper.find('form')
      })

      it('has a change password form', () => {
        expect(form.exists()).toBeTruthy()
      })

      it('has a cancel button', () => {
        expect(wrapper.find('svg.bi-x-circle').exists()).toBeTruthy()
      })

      it('closes the form when cancel button is clicked', async () => {
        await wrapper.find('svg.bi-x-circle').trigger('click')
        expect(wrapper.find('input').exists()).toBeFalsy()
      })

      it('has three input fields', () => {
        expect(form.findAll('input')).toHaveLength(3)
      })

      it('switches the first input type to text when show password is clicked', async () => {
        form.findAll('button').at(0).trigger('click')
        await wrapper.vm.$nextTick()
        expect(form.findAll('input').at(0).attributes('type')).toEqual('text')
      })

      it('switches the second input type to text when show password is clicked', async () => {
        form.findAll('button').at(1).trigger('click')
        await wrapper.vm.$nextTick()
        expect(form.findAll('input').at(1).attributes('type')).toEqual('text')
      })

      it('switches the third input type to text when show password is clicked', async () => {
        form.findAll('button').at(2).trigger('click')
        await wrapper.vm.$nextTick()
        expect(form.findAll('input').at(2).attributes('type')).toEqual('text')
      })

      it('has a submit button', () => {
        expect(form.find('button[type="submit"]').exists()).toBeTruthy()
      })

      describe('validation', () => {
        it('displays all password requirements', () => {
          const feedbackArray = wrapper.findAll('div.invalid-feedback').at(1).findAll('span')
          expect(feedbackArray).toHaveLength(6)
          expect(feedbackArray.at(0).text()).toBe('validations.messages.required')
          expect(feedbackArray.at(1).text()).toBe('site.signup.lowercase')
          expect(feedbackArray.at(2).text()).toBe('site.signup.uppercase')
          expect(feedbackArray.at(3).text()).toBe('site.signup.one_number')
          expect(feedbackArray.at(4).text()).toBe('site.signup.minimum')
          expect(feedbackArray.at(5).text()).toBe('site.signup.special-char')
        })

        it('displays no whitespace error when a space character is entered', async () => {
          await wrapper.findAll('input').at(1).setValue(' ')
          await flushPromises()
          const feedbackArray = wrapper.findAll('div.invalid-feedback').at(1).findAll('span')
          expect(feedbackArray).toHaveLength(7)
          expect(feedbackArray.at(6).text()).toBe('site.signup.no-whitespace')
        })

        it('removes first message when a character is given', async () => {
          await wrapper.findAll('input').at(1).setValue('@')
          await flushPromises()
          const feedbackArray = wrapper.findAll('div.invalid-feedback').at(1).findAll('span')
          expect(feedbackArray).toHaveLength(4)
          expect(feedbackArray.at(0).text()).toBe('site.signup.lowercase')
        })

        it('removes first and second message when a lowercase character is given', async () => {
          await wrapper.findAll('input').at(1).setValue('a')
          await flushPromises()
          const feedbackArray = wrapper.findAll('div.invalid-feedback').at(1).findAll('span')
          expect(feedbackArray).toHaveLength(4)
          expect(feedbackArray.at(0).text()).toBe('site.signup.uppercase')
        })

        it('removes the first three messages when a lowercase and uppercase characters are given', async () => {
          await wrapper.findAll('input').at(1).setValue('Aa')
          await flushPromises()
          const feedbackArray = wrapper.findAll('div.invalid-feedback').at(1).findAll('span')
          expect(feedbackArray).toHaveLength(3)
          expect(feedbackArray.at(0).text()).toBe('site.signup.one_number')
        })

        it('removes the first four messages when a lowercase, uppercase and numeric characters are given', async () => {
          await wrapper.findAll('input').at(1).setValue('Aa1')
          await flushPromises()
          const feedbackArray = wrapper.findAll('div.invalid-feedback').at(1).findAll('span')
          expect(feedbackArray).toHaveLength(2)
          expect(feedbackArray.at(0).text()).toBe('site.signup.minimum')
        })

        it('removes the first five messages when a eight lowercase, uppercase and numeric characters are given', async () => {
          await wrapper.findAll('input').at(1).setValue('Aa123456')
          await flushPromises()
          const feedbackArray = wrapper.findAll('div.invalid-feedback').at(1).findAll('span')
          expect(feedbackArray).toHaveLength(1)
          expect(feedbackArray.at(0).text()).toBe('site.signup.special-char')
        })

        it('removes all messages when a eight lowercase, uppercase and numeric characters are given', async () => {
          await wrapper.findAll('input').at(1).setValue('Aa123456_')
          await flushPromises()
          const feedbackArray = wrapper.findAll('div.invalid-feedback').at(1).findAll('span')
          expect(feedbackArray).toHaveLength(0)
        })
      })

      describe('submit', () => {
        describe('valid data', () => {
          beforeEach(async () => {
            changePasswordProfileMock.mockResolvedValue({
              data: {
                updateUserData: {
                  validValues: 1,
                },
              },
            })
            await form.findAll('input').at(0).setValue('1234')
            await form.findAll('input').at(1).setValue('Aa123456_')
            await form.findAll('input').at(2).setValue('Aa123456_')
            await form.trigger('submit')
            await flushPromises()
          })

          it('calls the API', () => {
            expect(changePasswordProfileMock).toHaveBeenCalledWith(
              expect.objectContaining({
                variables: {
                  password: '1234',
                  passwordNew: 'Aa123456_',
                },
              }),
            )
          })

          it('toasts a success message', () => {
            expect(toastSuccessSpy).toBeCalledWith('message.reset')
          })

          it('cancels the edit process', () => {
            expect(wrapper.find('input').exists()).toBeFalsy()
          })
        })

        describe('server response is error', () => {
          beforeEach(async () => {
            changePasswordProfileMock.mockRejectedValue({
              message: 'error',
            })
            await form.findAll('input').at(0).setValue('1234')
            await form.findAll('input').at(1).setValue('Aa123456_')
            await form.findAll('input').at(2).setValue('Aa123456_')
            await form.trigger('submit')
            await flushPromises()
          })

          it('toasts an error message', () => {
            expect(toastErrorSpy).toBeCalledWith('error')
          })
        })
      })
    })
  })
})
