// import { mount } from '@vue/test-utils'
// import UserPassword from './UserPassword'
// import flushPromises from 'flush-promises'
//
// import { toastErrorSpy, toastSuccessSpy } from '@test/testSetup'
//
// const localVue = global.localVue
//
// const changePasswordProfileMock = jest.fn()
// changePasswordProfileMock.mockReturnValue({ success: true })
//
// describe('UserCard_FormUserPasswort', () => {
//   let wrapper
//
//   const mocks = {
//     $t: jest.fn((t) => t),
//     $apollo: {
//       mutate: changePasswordProfileMock,
//     },
//   }
//
//   const Wrapper = () => {
//     return mount(UserPassword, { localVue, mocks })
//   }
//
//   describe('mount', () => {
//     beforeEach(() => {
//       wrapper = Wrapper()
//     })
//
//     it('renders the component', () => {
//       expect(wrapper.find('div#change_pwd').exists()).toBeTruthy()
//     })
//
//     it('has a change password button', () => {
//       expect(wrapper.find('a').exists()).toBeTruthy()
//     })
//
//     it('has a change password button with text "form.change-password"', () => {
//       expect(wrapper.find('a').text()).toEqual('settings.password.change-password')
//     })
//
//     it('has a change password button with a pencil icon', () => {
//       expect(wrapper.find('svg.bi-pencil').exists()).toBeTruthy()
//     })
//
//     describe('change password from', () => {
//       let form
//
//       beforeEach(async () => {
//         await wrapper.find('a').trigger('click')
//         await flushPromises()
//         form = wrapper.find('form')
//       })
//
//       it('has a change password form', () => {
//         expect(form.exists()).toBeTruthy()
//       })
//
//       it('has a cancel button', () => {
//         expect(wrapper.find('svg.bi-x-circle').exists()).toBeTruthy()
//       })
//
//       it('closes the form when cancel button is clicked', async () => {
//         await wrapper.find('svg.bi-x-circle').trigger('click')
//         expect(wrapper.find('input').exists()).toBeFalsy()
//       })
//
//       it('has three input fields', () => {
//         expect(form.findAll('input')).toHaveLength(3)
//       })
//
//       it('switches the first input type to text when show password is clicked', async () => {
//         form.findAll('button').at(0).trigger('click')
//         await wrapper.vm.$nextTick()
//         expect(form.findAll('input').at(0).attributes('type')).toEqual('text')
//       })
//
//       it('switches the second input type to text when show password is clicked', async () => {
//         form.findAll('button').at(1).trigger('click')
//         await wrapper.vm.$nextTick()
//         expect(form.findAll('input').at(1).attributes('type')).toEqual('text')
//       })
//
//       it('switches the third input type to text when show password is clicked', async () => {
//         form.findAll('button').at(2).trigger('click')
//         await wrapper.vm.$nextTick()
//         expect(form.findAll('input').at(2).attributes('type')).toEqual('text')
//       })
//
//       it('has a submit button', () => {
//         expect(form.find('button[type="submit"]').exists()).toBeTruthy()
//       })
//
//       describe('validation', () => {
//         it('displays all password requirements', () => {
//           const feedbackArray = wrapper.findAll('div.invalid-feedback').at(1).findAll('span')
//           expect(feedbackArray).toHaveLength(6)
//           expect(feedbackArray.at(0).text()).toBe('validations.messages.required')
//           expect(feedbackArray.at(1).text()).toBe('site.signup.lowercase')
//           expect(feedbackArray.at(2).text()).toBe('site.signup.uppercase')
//           expect(feedbackArray.at(3).text()).toBe('site.signup.one_number')
//           expect(feedbackArray.at(4).text()).toBe('site.signup.minimum')
//           expect(feedbackArray.at(5).text()).toBe('site.signup.special-char')
//         })
//
//         it('displays no whitespace error when a space character is entered', async () => {
//           await wrapper.findAll('input').at(1).setValue(' ')
//           await flushPromises()
//           const feedbackArray = wrapper.findAll('div.invalid-feedback').at(1).findAll('span')
//           expect(feedbackArray).toHaveLength(7)
//           expect(feedbackArray.at(6).text()).toBe('site.signup.no-whitespace')
//         })
//
//         it('removes first message when a character is given', async () => {
//           await wrapper.findAll('input').at(1).setValue('@')
//           await flushPromises()
//           const feedbackArray = wrapper.findAll('div.invalid-feedback').at(1).findAll('span')
//           expect(feedbackArray).toHaveLength(4)
//           expect(feedbackArray.at(0).text()).toBe('site.signup.lowercase')
//         })
//
//         it('removes first and second message when a lowercase character is given', async () => {
//           await wrapper.findAll('input').at(1).setValue('a')
//           await flushPromises()
//           const feedbackArray = wrapper.findAll('div.invalid-feedback').at(1).findAll('span')
//           expect(feedbackArray).toHaveLength(4)
//           expect(feedbackArray.at(0).text()).toBe('site.signup.uppercase')
//         })
//
//         it('removes the first three messages when a lowercase and uppercase characters are given', async () => {
//           await wrapper.findAll('input').at(1).setValue('Aa')
//           await flushPromises()
//           const feedbackArray = wrapper.findAll('div.invalid-feedback').at(1).findAll('span')
//           expect(feedbackArray).toHaveLength(3)
//           expect(feedbackArray.at(0).text()).toBe('site.signup.one_number')
//         })
//
//         it('removes the first four messages when a lowercase, uppercase and numeric characters are given', async () => {
//           await wrapper.findAll('input').at(1).setValue('Aa1')
//           await flushPromises()
//           const feedbackArray = wrapper.findAll('div.invalid-feedback').at(1).findAll('span')
//           expect(feedbackArray).toHaveLength(2)
//           expect(feedbackArray.at(0).text()).toBe('site.signup.minimum')
//         })
//
//         it('removes the first five messages when a eight lowercase, uppercase and numeric characters are given', async () => {
//           await wrapper.findAll('input').at(1).setValue('Aa123456')
//           await flushPromises()
//           const feedbackArray = wrapper.findAll('div.invalid-feedback').at(1).findAll('span')
//           expect(feedbackArray).toHaveLength(1)
//           expect(feedbackArray.at(0).text()).toBe('site.signup.special-char')
//         })
//
//         it('removes all messages when a eight lowercase, uppercase and numeric characters are given', async () => {
//           await wrapper.findAll('input').at(1).setValue('Aa123456_')
//           await flushPromises()
//           const feedbackArray = wrapper.findAll('div.invalid-feedback').at(1).findAll('span')
//           expect(feedbackArray).toHaveLength(0)
//         })
//       })
//
//       describe('submit', () => {
//         describe('valid data', () => {
//           beforeEach(async () => {
//             changePasswordProfileMock.mockResolvedValue({
//               data: {
//                 updateUserData: {
//                   validValues: 1,
//                 },
//               },
//             })
//             await form.findAll('input').at(0).setValue('1234')
//             await form.findAll('input').at(1).setValue('Aa123456_')
//             await form.findAll('input').at(2).setValue('Aa123456_')
//             await form.trigger('submit')
//             await flushPromises()
//           })
//
//           it('calls the API', () => {
//             expect(changePasswordProfileMock).toHaveBeenCalledWith(
//               expect.objectContaining({
//                 variables: {
//                   password: '1234',
//                   passwordNew: 'Aa123456_',
//                 },
//               }),
//             )
//           })
//
//           it('toasts a success message', () => {
//             expect(toastSuccessSpy).toBeCalledWith('message.reset')
//           })
//
//           it('cancels the edit process', () => {
//             expect(wrapper.find('input').exists()).toBeFalsy()
//           })
//         })
//
//         describe('server response is error', () => {
//           beforeEach(async () => {
//             changePasswordProfileMock.mockRejectedValue({
//               message: 'error',
//             })
//             await form.findAll('input').at(0).setValue('1234')
//             await form.findAll('input').at(1).setValue('Aa123456_')
//             await form.findAll('input').at(2).setValue('Aa123456_')
//             await form.trigger('submit')
//             await flushPromises()
//           })
//
//           it('toasts an error message', () => {
//             expect(toastErrorSpy).toBeCalledWith('error')
//           })
//         })
//       })
//     })
//   })
// })

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import UserPassword from './UserPassword.vue'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import { BButton, BCard, BCol, BForm, BRow } from 'bootstrap-vue-next'
import InputPassword from '@/components/Inputs/InputPassword.vue'
import InputPasswordConfirmation from '@/components/Inputs/InputPasswordConfirmation.vue'
import { configure, defineRule } from 'vee-validate'
import { email, min, required } from '@vee-validate/rules'

defineRule('required', required)
defineRule('email', email)
defineRule('min', min)

// Configure vee-validate
configure({
  generateMessage: (context) => {
    return `The field ${context.field} is invalid`
  },
})

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()

vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
    toastSuccess: mockToastSuccess,
  })),
}))

const mockUpdateUserInfo = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: mockUpdateUserInfo,
  }),
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      'settings.password.change-password': 'Change Password',
      'form.password_old': 'Old Password',
      'form.save': 'Save',
      'message.reset': 'Password Reset',
      'validations.messages.required': 'Required',
      'site.signup.lowercase': 'Lowercase',
      'site.signup.uppercase': 'Uppercase',
      'site.signup.one_number': 'One Number',
      'site.signup.minimum': 'Minimum',
      'site.signup.special-char': 'Special Character',
      'site.signup.no-whitespace': 'No Whitespace',
    },
  },
})

describe('UserPassword', () => {
  let wrapper

  const mountComponent = () => {
    return mount(UserPassword, {
      global: {
        plugins: [i18n],
        stubs: {
          BCard,
          BRow,
          BCol,
          BButton,
          BForm,
          IBiPencil: true,
          IBiXCircle: true,
          InputPassword: true,
          InputPasswordConfirmation: true,
        },
      },
    })
  }

  beforeEach(() => {
    wrapper = mountComponent()
  })

  it('renders the component', () => {
    expect(wrapper.find('#change_pwd').exists()).toBe(true)
  })

  it('has a change password button', () => {
    expect(wrapper.find('.change-password-form-opener').exists()).toBe(true)
  })

  it('has a change password button with text "Change Password"', () => {
    expect(wrapper.find('.change-password-form-opener span').text()).toBe('Change Password')
  })

  it('has a change password button with a pencil icon', () => {
    expect(wrapper.find('.change-password-form-opener i-bi-pencil-stub').exists()).toBe(true)
  })

  describe('change password form', () => {
    beforeEach(async () => {
      await wrapper.find('.change-password-form-opener').trigger('click')
    })

    it('has a change password form', () => {
      expect(wrapper.find('form').exists()).toBe(true)
    })

    it('has a cancel button', () => {
      expect(wrapper.find('i-bi-x-circle-stub').exists()).toBe(true)
    })

    it('closes the form when cancel button is clicked', async () => {
      await wrapper.find('i-bi-x-circle-stub').trigger('click')
      expect(wrapper.find('form').exists()).toBe(false)
    })

    it('has two input components', () => {
      expect(wrapper.findAll('input-password-stub, input-password-confirmation-stub')).toHaveLength(
        2,
      )
    })

    it('has a submit button', () => {
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    describe('validation', () => {
      it('displays all password requirements', async () => {
        await wrapper.find('input-password-confirmation').vm.$emit('update:modelValue', '')
        await nextTick()
        const feedbackArray = wrapper.findAll('.invalid-feedback span')
        expect(feedbackArray).toHaveLength(6)
        expect(feedbackArray[0].text()).toBe('Required')
        expect(feedbackArray[1].text()).toBe('Lowercase')
        expect(feedbackArray[2].text()).toBe('Uppercase')
        expect(feedbackArray[3].text()).toBe('One Number')
        expect(feedbackArray[4].text()).toBe('Minimum')
        expect(feedbackArray[5].text()).toBe('Special Character')
      })

      it('displays no whitespace error when a space character is entered', async () => {
        await wrapper.find('input-password-confirmation').vm.$emit('update:modelValue', ' ')
        await nextTick()
        const feedbackArray = wrapper.findAll('.invalid-feedback span')
        expect(feedbackArray).toHaveLength(7)
        expect(feedbackArray[6].text()).toBe('No Whitespace')
      })

      it('removes first message when a character is given', async () => {
        await wrapper.find('input-password-confirmation').vm.$emit('update:modelValue', '@')
        await nextTick()
        const feedbackArray = wrapper.findAll('.invalid-feedback span')
        expect(feedbackArray).toHaveLength(4)
        expect(feedbackArray[0].text()).toBe('Lowercase')
      })

      it('removes first and second message when a lowercase character is given', async () => {
        await wrapper.find('input-password-confirmation').vm.$emit('update:modelValue', 'a')
        await nextTick()
        const feedbackArray = wrapper.findAll('.invalid-feedback span')
        expect(feedbackArray).toHaveLength(4)
        expect(feedbackArray[0].text()).toBe('Uppercase')
      })

      it('removes the first three messages when a lowercase and uppercase characters are given', async () => {
        await wrapper.find('input-password-confirmation').vm.$emit('update:modelValue', 'Aa')
        await nextTick()
        const feedbackArray = wrapper.findAll('.invalid-feedback span')
        expect(feedbackArray).toHaveLength(3)
        expect(feedbackArray[0].text()).toBe('One Number')
      })

      it('removes the first four messages when a lowercase, uppercase and numeric characters are given', async () => {
        await wrapper.find('input-password-confirmation').vm.$emit('update:modelValue', 'Aa1')
        await nextTick()
        const feedbackArray = wrapper.findAll('.invalid-feedback span')
        expect(feedbackArray).toHaveLength(2)
        expect(feedbackArray[0].text()).toBe('Minimum')
      })

      it('removes the first five messages when eight lowercase, uppercase and numeric characters are given', async () => {
        await wrapper.find('input-password-confirmation').vm.$emit('update:modelValue', 'Aa123456')
        await nextTick()
        const feedbackArray = wrapper.findAll('.invalid-feedback span')
        expect(feedbackArray).toHaveLength(1)
        expect(feedbackArray[0].text()).toBe('Special Character')
      })

      it('removes all messages when eight lowercase, uppercase and numeric characters are given', async () => {
        await wrapper.find('input-password-confirmation').vm.$emit('update:modelValue', 'Aa123456_')
        await nextTick()
        const feedbackArray = wrapper.findAll('.invalid-feedback span')
        expect(feedbackArray).toHaveLength(0)
      })
    })

    describe('submit', () => {
      describe('valid data', () => {
        beforeEach(async () => {
          mockUpdateUserInfo.mockResolvedValue({
            data: {
              updateUserData: {
                validValues: 1,
              },
            },
          })
          await wrapper.find('input-password').vm.$emit('update:modelValue', '1234')
          await wrapper
            .find('input-password-confirmation')
            .vm.$emit('update:modelValue', 'Aa123456_')
          await wrapper.find('form').trigger('submit')
          await nextTick()
        })

        it('calls the API', () => {
          expect(mockUpdateUserInfo).toHaveBeenCalledWith({
            password: '1234',
            passwordNew: 'Aa123456_',
          })
        })

        it('toasts a success message', () => {
          expect(mockToastSuccess).toHaveBeenCalledWith('Password Reset')
        })

        it('cancels the edit process', () => {
          expect(wrapper.find('form').exists()).toBe(false)
        })
      })

      describe('server response is error', () => {
        beforeEach(async () => {
          mockUpdateUserInfo.mockRejectedValue(new Error('error'))
          await wrapper.find('input-password').vm.$emit('update:modelValue', '1234')
          await wrapper
            .find('input-password-confirmation')
            .vm.$emit('update:modelValue', 'Aa123456_')
          await wrapper.find('form').trigger('submit')
          await nextTick()
        })

        it('toasts an error message', () => {
          expect(mockToastError).toHaveBeenCalledWith('error')
        })
      })
    })
  })
})
