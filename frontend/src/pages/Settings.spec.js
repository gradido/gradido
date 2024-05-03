import { mount } from '@vue/test-utils'
import Settings from './Settings'
import flushPromises from 'flush-promises'
import { toastSuccessSpy } from '@test/testSetup'

const localVue = global.localVue

const mockAPIcall = jest.fn()

const storeCommitMock = jest.fn()

describe('Settings', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $store: {
      state: {
        darkMode: true,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        language: 'en',
        newsletterState: false,
        gmsAllowed: false,
        humhubAllowed: false,
      },
      commit: storeCommitMock,
    },
    $apollo: {
      mutate: mockAPIcall,
    },
    $route: {
      params: {},
    },
  }

  const Wrapper = () => {
    return mount(Settings, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a user change language form', () => {
      expect(wrapper.findComponent({ name: 'LanguageSwitch' }).exists()).toBeTruthy()
    })
    
    it('has a user change password form', () => {
      expect(wrapper.findComponent({ name: 'UserPassword' }).exists()).toBeTruthy()
    })

    describe('isDisabled', () => {
      it('returns false when firstName and lastName match the state', async () => {
        // wrapper.vm.firstName = 'John'
        // wrapper.vm.lastName = 'Doe'
        wrapper.find('[data-test="firstname"]').setValue('John')
        wrapper.find('[data-test="lastname"]').setValue('Doe')
        await wrapper.find('[data-test="firstname"]').trigger('keyup')
        const result = wrapper.find('[data-test="submit-userdata"]')
        expect(result.exists()).toBe(false)
      })

      it('returns true when either firstName or lastName do not match the state', async () => {
        wrapper.find('[data-test="firstname"]').setValue('Janer')
        wrapper.find('[data-test="lastname"]').setValue('Does')
        await wrapper.find('[data-test="firstname"]').trigger('keyup')
        const result = wrapper.find('[data-test="submit-userdata"]')
        expect(result.exists()).toBe(true)
      })
    })

    describe('successfull submit', () => {
      beforeEach(async () => {
        wrapper.find('[data-test="firstname"]').setValue('Janer')
        wrapper.find('[data-test="lastname"]').setValue('Does')

        mockAPIcall.mockResolvedValue({
          data: {
            updateUserInfos: {
              validValues: 3,
            },
          },
        })
      })

      it('Cange first and lastname', async () => {
        await wrapper.find('[data-test="submit-userdata"]').trigger('click')
        await flushPromises()

        expect(mockAPIcall).toBeCalledWith(
          expect.objectContaining({
            variables: {
              firstName: 'Janer',
              lastName: 'Does',
            },
          }),
        )
      })

      it('commits firstname to store', () => {
        expect(storeCommitMock).toBeCalledWith('firstName', 'Janer')
      })

      it('commits lastname to store', () => {
        expect(storeCommitMock).toBeCalledWith('lastName', 'Does')
      })

      it('toasts a success message', () => {
        expect(toastSuccessSpy).toBeCalledWith('settings.name.change-success')
      })
    })

    // TODO: describe('darkMode style', () => {
    //   it('default darkMode is true', () => {
    //     expect(wrapper.vm.darkMode).toBe(true)
    //   })

    //   describe('dark mode is false', () => {
    //     beforeEach(() => {
    //       wrapper.vm.darkMode = false
    //     })

    //     it('commits darkMode to store', () => {
    //       expect(storeCommitMock).toBeCalledWith('setDarkMode', false)
    //     })
    //     it('toasts a success message', () => {
    //       expect(toastSuccessSpy).toBeCalledWith('settings.modeLight')
    //     })

    //     describe('set dark mode is true', () => {
    //       beforeEach(() => {
    //         wrapper.vm.darkMode = true
    //       })
    //       // Test case 1: Test setting dark mode
    //       test('darkMode sets the dark mode', () => {
    //         expect(storeCommitMock).toBeCalledWith('setDarkMode', true)
    //       })
    //     })
    //   })
    // })
  })
})
