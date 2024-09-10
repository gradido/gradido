// import { mount } from '@vue/test-utils'
// import UserName from './UserName'
// import flushPromises from 'flush-promises'
//
// import { toastErrorSpy, toastSuccessSpy } from '@test/testSetup'
//
// const localVue = global.localVue
//
// const mockAPIcall = jest.fn()
//
// const storeCommitMock = jest.fn()
//
// describe('UserName Form', () => {
//   let wrapper
//
//   const mocks = {
//     $t: jest.fn((t) => t),
//     $store: {
//       state: {
//         username: null,
//       },
//       commit: storeCommitMock,
//     },
//     $apollo: {
//       mutate: mockAPIcall,
//     },
//   }
//
//   const Wrapper = () => {
//     return mount(UserName, { localVue, mocks })
//   }
//
//   describe('mount', () => {
//     beforeEach(() => {
//       wrapper = Wrapper()
//     })
//
//     it('renders the component', () => {
//       expect(wrapper.find('div#username_form').exists()).toBe(true)
//     })
//
//     describe('has no username', () => {
//       // it('renders the username', () => {
//       //   expect(wrapper.find('[data-test="username-input-group"]')).toBe(true)
//       // })
//
//       it('has a component username change ', () => {
//         expect(wrapper.findComponent({ name: 'InputUsername' }).exists()).toBe(true)
//       })
//     })
//     describe('change / edit  username', () => {
//       beforeEach(async () => {
//         wrapper.vm.isEdit = true
//       })
//
//       it('has no the username', () => {
//         expect(wrapper.find('[data-test="username-input-group"]')).toBeTruthy()
//       })
//
//       it('has a component username change ', () => {
//         expect(wrapper.findComponent({ name: 'InputUsername' }).exists()).toBeTruthy()
//       })
//
//       it('first step is username empty ', () => {
//         expect(wrapper.vm.username).toEqual('')
//       })
//
//       describe('change / edit  username', () => {
//         beforeEach(async () => {
//           mocks.$store.state.username = ''
//           await wrapper.setData({ isEdit: true })
//         })
//
//         it('first step is isEdit false ', () => {
//           expect(wrapper.vm.isEdit).toEqual(true)
//         })
//         it(' has username-alert text ', () => {
//           expect(wrapper.find('[data-test="username-alert"]').text()).toBe(
//             'settings.username.no-username',
//           )
//         })
//         it('has a submit button with disabled true', () => {
//           expect(wrapper.find('[data-test="submit-username-button"]').exists()).toBe(false)
//         })
//       })
//
//       describe('edit username', () => {
//         beforeEach(async () => {
//           await wrapper.setData({ username: 'petra' })
//         })
//
//         it('has a submit button', () => {
//           expect(wrapper.find('[data-test="submit-username-button"]').exists()).toBe(true)
//         })
//
//         describe('successfull submit', () => {
//           beforeEach(async () => {
//             mockAPIcall.mockResolvedValue({
//               data: {
//                 updateUserInfos: {
//                   validValues: 3,
//                 },
//               },
//             })
//             jest.clearAllMocks()
//             await wrapper.find('input').setValue('petra')
//             await wrapper.find('form').trigger('keyup')
//             await wrapper.find('[data-test="submit-username-button"]').trigger('submit')
//             await flushPromises()
//           })
//
//           it('calls the API', () => {
//             expect(mockAPIcall).toBeCalledWith(
//               expect.objectContaining({
//                 variables: {
//                   alias: 'petra',
//                 },
//               }),
//             )
//           })
//
//           it('commits username to store', () => {
//             expect(storeCommitMock).toBeCalledWith('username', 'petra')
//           })
//
//           it('toasts a success message', () => {
//             expect(toastSuccessSpy).toBeCalledWith('settings.username.change-success')
//           })
//         })
//
//         describe('submit results in server error', () => {
//           beforeEach(async () => {
//             mockAPIcall.mockRejectedValue({
//               message: 'Error',
//             })
//             jest.clearAllMocks()
//             await wrapper.find('input').setValue('petra')
//             await wrapper.find('form').trigger('keyup')
//             await wrapper.find('[data-test="submit-username-button"]').trigger('submit')
//             await flushPromises()
//           })
//
//           it('calls the API', () => {
//             expect(mockAPIcall).toBeCalledWith(
//               expect.objectContaining({
//                 variables: {
//                   alias: 'petra',
//                 },
//               }),
//             )
//           })
//
//           it('toasts an error message', () => {
//             expect(toastErrorSpy).toBeCalledWith('Error')
//           })
//         })
//       })
//
//       describe('has a username', () => {
//         beforeEach(async () => {
//           mocks.$store.state.username = 'petra'
//         })
//
//         it('has isEdit true', () => {
//           expect(wrapper.vm.isEdit).toBe(true)
//         })
//
//         it(' has no username-alert text ', () => {
//           expect(wrapper.find('[data-test="username-alert"]').exists()).toBe(false)
//         })
//
//         it('has no component username change ', () => {
//           expect(wrapper.findComponent({ name: 'InputUsername' }).exists()).toBe(false)
//         })
//       })
//     })
//   })
// })

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import UserName from './UserName'
import flushPromises from 'flush-promises'
import { createStore } from 'vuex'
import InputUsername from '@/components/Inputs/InputUsername.vue'

// Mock for useAppToast
const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
    toastSuccess: mockToastSuccess,
  })),
}))

// Mock for useI18n
const mockT = vi.fn((key) => key)
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: mockT,
  }),
}))

const mockAPIcall = vi.fn()
const storeCommitMock = vi.fn()

describe('UserName Form', () => {
  let wrapper
  let store

  const createVuexStore = () => {
    return createStore({
      state: {
        username: null,
      },
      mutations: {
        username: storeCommitMock,
      },
    })
  }

  const createWrapper = () => {
    store = createVuexStore()
    return mount(UserName, {
      global: {
        plugins: [store],
        mocks: {
          $apollo: {
            mutate: mockAPIcall,
          },
        },
        stubs: {
          BForm: true,
          BRow: true,
          BCol: true,
          BFormInput: true,
          BFormGroup: true,
          BButton: true,
          InputUsername,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = createWrapper()
  })

  it('renders the component', () => {
    expect(wrapper.find('div#username_form').exists()).toBe(true)
  })

  describe('has no username', () => {
    it('has a component username change', () => {
      expect(wrapper.findComponent({ name: 'InputUsername' }).exists()).toBe(true)
    })
  })

  describe('change / edit username', () => {
    beforeEach(async () => {
      await wrapper.setData({ isEdit: true })
    })

    it('has the username input group', () => {
      expect(wrapper.find('[data-test="username-input-group"]').exists()).toBe(true)
    })

    it('has a component username change', () => {
      expect(wrapper.findComponent({ name: 'InputUsername' }).exists()).toBe(true)
    })

    it('first step is username empty', () => {
      expect(wrapper.vm.username).toEqual('')
    })

    describe('when store username is empty', () => {
      beforeEach(async () => {
        store.state.username = ''
        await wrapper.setData({ isEdit: true })
      })

      it('isEdit is true', () => {
        expect(wrapper.vm.isEdit).toEqual(true)
      })

      it('has username-alert text', () => {
        expect(wrapper.find('[data-test="username-alert"]').text()).toBe(
          'settings.username.no-username',
        )
        expect(mockT).toHaveBeenCalledWith('settings.username.no-username')
      })

      it('has no submit button', () => {
        expect(wrapper.find('[data-test="submit-username-button"]').exists()).toBe(false)
      })
    })

    describe('edit username', () => {
      beforeEach(async () => {
        await wrapper.setData({ username: 'petra' })
      })

      it('has a submit button', () => {
        expect(wrapper.find('[data-test="submit-username-button"]').exists()).toBe(true)
      })

      describe('successful submit', () => {
        beforeEach(async () => {
          mockAPIcall.mockResolvedValue({
            data: {
              updateUserInfos: {
                validValues: 3,
              },
            },
          })
          await wrapper.find('input').setValue('petra')
          await wrapper.find('form').trigger('keyup')
          await wrapper.find('[data-test="submit-username-button"]').trigger('submit')
          await flushPromises()
        })

        it('calls the API', () => {
          expect(mockAPIcall).toHaveBeenCalledWith(
            expect.objectContaining({
              variables: {
                alias: 'petra',
              },
            }),
          )
        })

        it('commits username to store', () => {
          expect(storeCommitMock).toHaveBeenCalledWith('username', 'petra')
        })

        it('toasts a success message', () => {
          expect(mockToastSuccess).toHaveBeenCalledWith('settings.username.change-success')
          expect(mockT).toHaveBeenCalledWith('settings.username.change-success')
        })
      })

      describe('submit results in server error', () => {
        beforeEach(async () => {
          mockAPIcall.mockRejectedValue({
            message: 'Error',
          })
          await wrapper.find('input').setValue('petra')
          await wrapper.find('form').trigger('keyup')
          await wrapper.find('[data-test="submit-username-button"]').trigger('submit')
          await flushPromises()
        })

        it('calls the API', () => {
          expect(mockAPIcall).toHaveBeenCalledWith(
            expect.objectContaining({
              variables: {
                alias: 'petra',
              },
            }),
          )
        })

        it('toasts an error message', () => {
          expect(mockToastError).toHaveBeenCalledWith('Error')
        })
      })
    })

    describe('has a username', () => {
      beforeEach(async () => {
        store.state.username = 'petra'
        wrapper = createWrapper()
      })

      it('has isEdit true', () => {
        expect(wrapper.vm.isEdit).toBe(true)
      })

      it('has no username-alert text', () => {
        expect(wrapper.find('[data-test="username-alert"]').exists()).toBe(false)
      })

      it('has no component username change', () => {
        expect(wrapper.findComponent({ name: 'InputUsername' }).exists()).toBe(false)
      })
    })
  })
})
