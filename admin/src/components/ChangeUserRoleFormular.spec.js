// import { mount } from '@vue/test-utils'
// import ChangeUserRoleFormular from './ChangeUserRoleFormular'
// import { setUserRole } from '../graphql/setUserRole'
// import { toastSuccessSpy, toastErrorSpy } from '../../test/testSetup'
//
// const localVue = global.localVue
//
// const apolloMutateMock = jest.fn().mockResolvedValue({
//   data: {
//     setUserRole: null,
//   },
// })
//
// const mocks = {
//   $t: jest.fn((t) => t),
//   $apollo: {
//     mutate: apolloMutateMock,
//   },
//   $store: {
//     state: {
//       moderator: {
//         id: 0,
//         name: 'test moderator',
//         roles: ['ADMIN'],
//       },
//     },
//   },
// }
//
// let propsData
// let wrapper
// let spy
//
// describe('ChangeUserRoleFormular', () => {
//   const Wrapper = () => {
//     return mount(ChangeUserRoleFormular, { localVue, mocks, propsData })
//   }
//
//   describe('mount', () => {
//     beforeEach(() => {
//       jest.clearAllMocks()
//     })
//
//     describe('DOM has', () => {
//       beforeEach(() => {
//         propsData = {
//           item: {
//             userId: 1,
//             roles: [],
//           },
//         }
//         wrapper = Wrapper()
//       })
//
//       it('has a DIV element with the class.delete-user-formular', () => {
//         expect(wrapper.find('.change-user-role-formular').exists()).toBe(true)
//       })
//     })
//
//     describe('change own role', () => {
//       beforeEach(() => {
//         propsData = {
//           item: {
//             userId: 0,
//             roles: ['ADMIN'],
//           },
//         }
//         wrapper = Wrapper()
//       })
//
//       it('has the text that you cannot change own role', () => {
//         expect(wrapper.text()).toContain('userRole.notChangeYourSelf')
//       })
//
//       it('has no role select', () => {
//         expect(wrapper.find('select.role-select').exists()).toBe(false)
//       })
//
//       it('has no button', () => {
//         expect(wrapper.find('button.btn.btn-dange').exists()).toBe(false)
//       })
//     })
//
//     describe("change other user's role", () => {
//       let rolesToSelect
//
//       describe('general', () => {
//         beforeEach(() => {
//           propsData = {
//             item: {
//               userId: 1,
//               roles: [],
//             },
//           }
//           wrapper = Wrapper()
//           rolesToSelect = wrapper.find('select.role-select').findAll('option')
//         })
//
//         it('has no text that you cannot change own role', () => {
//           expect(wrapper.text()).not.toContain('userRole.notChangeYourSelf')
//         })
//
//         it('has the select label', () => {
//           expect(wrapper.text()).toContain('userRole.selectLabel')
//         })
//
//         it('has a select', () => {
//           expect(wrapper.find('select.role-select').exists()).toBe(true)
//         })
//
//         it('has role select enabled', () => {
//           expect(wrapper.find('select.role-select[disabled="disabled"]').exists()).toBe(false)
//         })
//
//         it('has "change_user_role" button', () => {
//           expect(wrapper.find('button.btn.btn-danger').text()).toBe('change_user_role')
//         })
//       })
//
//       describe('user has role "usual user"', () => {
//         beforeEach(() => {
//           apolloMutateMock.mockResolvedValue({
//             data: {
//               setUserRole: 'ADMIN',
//             },
//           })
//           propsData = {
//             item: {
//               userId: 1,
//               roles: ['USER'],
//             },
//           }
//           wrapper = Wrapper()
//           rolesToSelect = wrapper.find('select.role-select').findAll('option')
//         })
//
//         it('has selected option set to "usual user"', () => {
//           expect(wrapper.find('select.role-select').element.value).toBe('USER')
//         })
//
//         describe('change select to', () => {
//           describe('same role', () => {
//             it('has "change_user_role" button disabled', () => {
//               expect(wrapper.find('button.btn.btn-danger[disabled="disabled"]').exists()).toBe(true)
//             })
//
//             it('does not call the API', () => {
//               rolesToSelect.at(0).setSelected()
//               expect(apolloMutateMock).not.toHaveBeenCalled()
//             })
//           })
//
//           describe('new role "MODERATOR"', () => {
//             beforeEach(() => {
//               rolesToSelect.at(1).setSelected()
//             })
//
//             it('has "change_user_role" button enabled', () => {
//               expect(wrapper.find('button.btn.btn-danger').exists()).toBe(true)
//               expect(wrapper.find('button.btn.btn-danger[disabled="disabled"]').exists()).toBe(
//                 false,
//               )
//             })
//
//             describe('clicking the "change_user_role" button', () => {
//               beforeEach(async () => {
//                 spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
//                 spy.mockImplementation(() => Promise.resolve(true))
//                 await wrapper.find('button').trigger('click')
//                 await wrapper.vm.$nextTick()
//               })
//
//               it('calls the modal', () => {
//                 expect(wrapper.emitted('showModal'))
//                 expect(spy).toHaveBeenCalled()
//               })
//
//               describe('confirm role change with success', () => {
//                 it('calls the API', () => {
//                   expect(apolloMutateMock).toBeCalledWith(
//                     expect.objectContaining({
//                       mutation: setUserRole,
//                       variables: {
//                         userId: 1,
//                         role: 'MODERATOR',
//                       },
//                     }),
//                   )
//                 })
//
//                 it('emits "updateRoles" with role moderator', () => {
//                   expect(wrapper.emitted('updateRoles')).toEqual(
//                     expect.arrayContaining([
//                       expect.arrayContaining([
//                         {
//                           userId: 1,
//                           roles: ['MODERATOR'],
//                         },
//                       ]),
//                     ]),
//                   )
//                 })
//
//                 it('toasts success message', () => {
//                   expect(toastSuccessSpy).toBeCalledWith('userRole.successfullyChangedTo')
//                 })
//               })
//
//               describe('confirm role change with error', () => {
//                 beforeEach(async () => {
//                   spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
//                   apolloMutateMock.mockRejectedValue({ message: 'Oh no!' })
//                   await wrapper.find('button').trigger('click')
//                   await wrapper.vm.$nextTick()
//                 })
//
//                 it('toasts an error message', () => {
//                   expect(toastErrorSpy).toBeCalledWith('Oh no!')
//                 })
//               })
//             })
//           })
//
//           describe('new role "ADMIN"', () => {
//             beforeEach(() => {
//               rolesToSelect.at(2).setSelected()
//             })
//
//             it('has "change_user_role" button enabled', () => {
//               expect(wrapper.find('button.btn.btn-danger').exists()).toBe(true)
//               expect(wrapper.find('button.btn.btn-danger[disabled="disabled"]').exists()).toBe(
//                 false,
//               )
//             })
//
//             describe('clicking the "change_user_role" button', () => {
//               beforeEach(async () => {
//                 spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
//                 spy.mockImplementation(() => Promise.resolve(true))
//                 await wrapper.find('button').trigger('click')
//                 await wrapper.vm.$nextTick()
//               })
//
//               it('calls the modal', () => {
//                 expect(wrapper.emitted('showModal'))
//                 expect(spy).toHaveBeenCalled()
//               })
//
//               describe('confirm role change with success', () => {
//                 it('calls the API', () => {
//                   expect(apolloMutateMock).toBeCalledWith(
//                     expect.objectContaining({
//                       mutation: setUserRole,
//                       variables: {
//                         userId: 1,
//                         role: 'ADMIN',
//                       },
//                     }),
//                   )
//                 })
//
//                 it('emits "updateRoles" with role moderator', () => {
//                   expect(wrapper.emitted('updateRoles')).toEqual(
//                     expect.arrayContaining([
//                       expect.arrayContaining([
//                         {
//                           userId: 1,
//                           roles: ['ADMIN'],
//                         },
//                       ]),
//                     ]),
//                   )
//                 })
//
//                 it('toasts success message', () => {
//                   expect(toastSuccessSpy).toBeCalledWith('userRole.successfullyChangedTo')
//                 })
//               })
//
//               describe('confirm role change with error', () => {
//                 beforeEach(async () => {
//                   spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
//                   apolloMutateMock.mockRejectedValue({ message: 'Oh no!' })
//                   await wrapper.find('button').trigger('click')
//                   await wrapper.vm.$nextTick()
//                 })
//
//                 it('toasts an error message', () => {
//                   expect(toastErrorSpy).toBeCalledWith('Oh no!')
//                 })
//               })
//             })
//           })
//         })
//       })
//
//       describe('user has role "moderator"', () => {
//         beforeEach(() => {
//           apolloMutateMock.mockResolvedValue({
//             data: {
//               setUserRole: null,
//             },
//           })
//           propsData = {
//             item: {
//               userId: 1,
//               roles: ['MODERATOR'],
//             },
//           }
//           wrapper = Wrapper()
//           rolesToSelect = wrapper.find('select.role-select').findAll('option')
//         })
//
//         it('has selected option set to "MODERATOR"', () => {
//           expect(wrapper.find('select.role-select').element.value).toBe('MODERATOR')
//         })
//
//         describe('change select to', () => {
//           describe('same role', () => {
//             it('has "change_user_role" button disabled', () => {
//               expect(wrapper.find('button.btn.btn-danger[disabled="disabled"]').exists()).toBe(true)
//             })
//
//             it('does not call the API', () => {
//               rolesToSelect.at(1).setSelected()
//               expect(apolloMutateMock).not.toHaveBeenCalled()
//             })
//           })
//
//           describe('new role "USER"', () => {
//             beforeEach(() => {
//               rolesToSelect.at(0).setSelected()
//             })
//
//             it('has "change_user_role" button enabled', () => {
//               expect(wrapper.find('button.btn.btn-danger').exists()).toBe(true)
//               expect(wrapper.find('button.btn.btn-danger[disabled="disabled"]').exists()).toBe(
//                 false,
//               )
//             })
//
//             describe('clicking the "change_user_role" button', () => {
//               beforeEach(async () => {
//                 spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
//                 spy.mockImplementation(() => Promise.resolve(true))
//                 await wrapper.find('button').trigger('click')
//                 await wrapper.vm.$nextTick()
//               })
//
//               it('calls the modal', () => {
//                 expect(wrapper.emitted('showModal'))
//                 expect(spy).toHaveBeenCalled()
//               })
//
//               describe('confirm role change with success', () => {
//                 it('calls the API', () => {
//                   expect(apolloMutateMock).toBeCalledWith(
//                     expect.objectContaining({
//                       mutation: setUserRole,
//                       variables: {
//                         userId: 1,
//                         role: 'USER',
//                       },
//                     }),
//                   )
//                 })
//
//                 it('emits "updateRoles"', () => {
//                   expect(wrapper.emitted('updateRoles')).toEqual(
//                     expect.arrayContaining([
//                       expect.arrayContaining([
//                         {
//                           userId: 1,
//                           roles: [],
//                         },
//                       ]),
//                     ]),
//                   )
//                 })
//
//                 it('toasts success message', () => {
//                   expect(toastSuccessSpy).toBeCalledWith('userRole.successfullyChangedTo')
//                 })
//               })
//
//               describe('confirm role change with error', () => {
//                 beforeEach(async () => {
//                   spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
//                   apolloMutateMock.mockRejectedValue({ message: 'Oh no!' })
//                   await wrapper.find('button').trigger('click')
//                   await wrapper.vm.$nextTick()
//                 })
//
//                 it('toasts an error message', () => {
//                   expect(toastErrorSpy).toBeCalledWith('Oh no!')
//                 })
//               })
//             })
//           })
//
//           describe('new role "ADMIN"', () => {
//             beforeEach(() => {
//               rolesToSelect.at(2).setSelected()
//             })
//
//             it('has "change_user_role" button enabled', () => {
//               expect(wrapper.find('button.btn.btn-danger').exists()).toBe(true)
//               expect(wrapper.find('button.btn.btn-danger[disabled="disabled"]').exists()).toBe(
//                 false,
//               )
//             })
//
//             describe('clicking the "change_user_role" button', () => {
//               beforeEach(async () => {
//                 spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
//                 spy.mockImplementation(() => Promise.resolve(true))
//                 await wrapper.find('button').trigger('click')
//                 await wrapper.vm.$nextTick()
//               })
//
//               it('calls the modal', () => {
//                 expect(wrapper.emitted('showModal'))
//                 expect(spy).toHaveBeenCalled()
//               })
//
//               describe('confirm role change with success', () => {
//                 it('calls the API', () => {
//                   expect(apolloMutateMock).toBeCalledWith(
//                     expect.objectContaining({
//                       mutation: setUserRole,
//                       variables: {
//                         userId: 1,
//                         role: 'ADMIN',
//                       },
//                     }),
//                   )
//                 })
//
//                 it('emits "updateRoles"', () => {
//                   expect(wrapper.emitted('updateRoles')).toEqual(
//                     expect.arrayContaining([
//                       expect.arrayContaining([
//                         {
//                           userId: 1,
//                           roles: ['ADMIN'],
//                         },
//                       ]),
//                     ]),
//                   )
//                 })
//
//                 it('toasts success message', () => {
//                   expect(toastSuccessSpy).toBeCalledWith('userRole.successfullyChangedTo')
//                 })
//               })
//
//               describe('confirm role change with error', () => {
//                 beforeEach(async () => {
//                   spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
//                   apolloMutateMock.mockRejectedValue({ message: 'Oh no!' })
//                   await wrapper.find('button').trigger('click')
//                   await wrapper.vm.$nextTick()
//                 })
//
//                 it('toasts an error message', () => {
//                   expect(toastErrorSpy).toBeCalledWith('Oh no!')
//                 })
//               })
//             })
//           })
//         })
//       })
//
//       describe('user has role "admin"', () => {
//         beforeEach(() => {
//           apolloMutateMock.mockResolvedValue({
//             data: {
//               setUserRole: null,
//             },
//           })
//           propsData = {
//             item: {
//               userId: 1,
//               roles: ['ADMIN'],
//             },
//           }
//           wrapper = Wrapper()
//           rolesToSelect = wrapper.find('select.role-select').findAll('option')
//         })
//
//         it('has selected option set to "admin"', () => {
//           expect(wrapper.find('select.role-select').element.value).toBe('ADMIN')
//         })
//
//         describe('change select to', () => {
//           describe('same role', () => {
//             it('has "change_user_role" button disabled', () => {
//               expect(wrapper.find('button.btn.btn-danger[disabled="disabled"]').exists()).toBe(true)
//             })
//
//             it('does not call the API', () => {
//               rolesToSelect.at(1).setSelected()
//               // TODO: Fix this
//               expect(apolloMutateMock).not.toHaveBeenCalled()
//             })
//           })
//
//           describe('new role "USER"', () => {
//             beforeEach(() => {
//               rolesToSelect.at(0).setSelected()
//             })
//
//             it('has "change_user_role" button enabled', () => {
//               expect(wrapper.find('button.btn.btn-danger').exists()).toBe(true)
//               expect(wrapper.find('button.btn.btn-danger[disabled="disabled"]').exists()).toBe(
//                 false,
//               )
//             })
//
//             describe('clicking the "change_user_role" button', () => {
//               beforeEach(async () => {
//                 spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
//                 spy.mockImplementation(() => Promise.resolve(true))
//                 await wrapper.find('button').trigger('click')
//                 await wrapper.vm.$nextTick()
//               })
//
//               it('calls the modal', () => {
//                 expect(wrapper.emitted('showModal'))
//                 expect(spy).toHaveBeenCalled()
//               })
//
//               describe('confirm role change with success', () => {
//                 it('calls the API', () => {
//                   expect(apolloMutateMock).toBeCalledWith(
//                     expect.objectContaining({
//                       mutation: setUserRole,
//                       variables: {
//                         userId: 1,
//                         role: 'USER',
//                       },
//                     }),
//                   )
//                 })
//
//                 it('emits "updateRoles"', () => {
//                   expect(wrapper.emitted('updateRoles')).toEqual(
//                     expect.arrayContaining([
//                       expect.arrayContaining([
//                         {
//                           userId: 1,
//                           roles: [],
//                         },
//                       ]),
//                     ]),
//                   )
//                 })
//
//                 it('toasts success message', () => {
//                   expect(toastSuccessSpy).toBeCalledWith('userRole.successfullyChangedTo')
//                 })
//               })
//
//               describe('confirm role change with error', () => {
//                 beforeEach(async () => {
//                   spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
//                   apolloMutateMock.mockRejectedValue({ message: 'Oh no!' })
//                   await wrapper.find('button').trigger('click')
//                   await wrapper.vm.$nextTick()
//                 })
//
//                 it('toasts an error message', () => {
//                   expect(toastErrorSpy).toBeCalledWith('Oh no!')
//                 })
//               })
//             })
//           })
//
//           describe('new role "MODERATOR"', () => {
//             beforeEach(() => {
//               rolesToSelect.at(1).setSelected()
//             })
//
//             it('has "change_user_role" button enabled', () => {
//               expect(wrapper.find('button.btn.btn-danger').exists()).toBe(true)
//               expect(wrapper.find('button.btn.btn-danger[disabled="disabled"]').exists()).toBe(
//                 false,
//               )
//             })
//
//             describe('clicking the "change_user_role" button', () => {
//               beforeEach(async () => {
//                 spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
//                 spy.mockImplementation(() => Promise.resolve(true))
//                 await wrapper.find('button').trigger('click')
//                 await wrapper.vm.$nextTick()
//               })
//
//               it('calls the modal', () => {
//                 expect(wrapper.emitted('showModal'))
//                 expect(spy).toHaveBeenCalled()
//               })
//
//               describe('confirm role change with success', () => {
//                 it('calls the API', () => {
//                   expect(apolloMutateMock).toBeCalledWith(
//                     expect.objectContaining({
//                       mutation: setUserRole,
//                       variables: {
//                         userId: 1,
//                         role: 'MODERATOR',
//                       },
//                     }),
//                   )
//                 })
//
//                 it('emits "updateRoles"', () => {
//                   expect(wrapper.emitted('updateRoles')).toEqual(
//                     expect.arrayContaining([
//                       expect.arrayContaining([
//                         {
//                           userId: 1,
//                           roles: ['MODERATOR'],
//                         },
//                       ]),
//                     ]),
//                   )
//                 })
//
//                 it('toasts success message', () => {
//                   expect(toastSuccessSpy).toBeCalledWith('userRole.successfullyChangedTo')
//                 })
//               })
//
//               describe('confirm role change with error', () => {
//                 beforeEach(async () => {
//                   spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
//                   apolloMutateMock.mockRejectedValue({ message: 'Oh no!' })
//                   await wrapper.find('button').trigger('click')
//                   await wrapper.vm.$nextTick()
//                 })
//
//                 it('toasts an error message', () => {
//                   expect(toastErrorSpy).toBeCalledWith('Oh no!')
//                 })
//               })
//             })
//           })
//         })
//       })
//     })
//
//     describe('authenticated user is MODERATOR', () => {
//       beforeEach(() => {
//         mocks.$store.state.moderator.roles = ['MODERATOR']
//       })
//
//       it('displays text with role', () => {
//         expect(wrapper.text()).toBe('userRole.selectRoles.admin')
//       })
//
//       it('has no role select', () => {
//         expect(wrapper.find('select.role-select').exists()).toBe(false)
//       })
//
//       it('has no button', () => {
//         expect(wrapper.find('button.btn.btn-dange').exists()).toBe(false)
//       })
//     })
//   })
// })

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ChangeUserRoleFormular from './ChangeUserRoleFormular.vue'
import { setUserRole } from '../graphql/setUserRole'
import { useMutation } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { createStore } from 'vuex'
import { BButton } from 'bootstrap-vue-next'

vi.mock('@vue/apollo-composable')
vi.mock('vue-i18n')
vi.mock('@/composables/useToast')

const createVuexStore = (roles = ['ADMIN']) => {
  return createStore({
    state: {
      moderator: {
        id: 0,
        name: 'test moderator',
        roles,
      },
    },
  })
}

describe('ChangeUserRoleFormular', () => {
  let wrapper
  let store
  const mockMutate = vi.fn()
  const mockT = vi.fn((key) => key)
  const mockToastSuccess = vi.fn()
  const mockToastError = vi.fn()
  const mockMsgBoxConfirm = vi.fn()

  beforeEach(() => {
    store = createVuexStore()

    useMutation.mockReturnValue({
      mutate: mockMutate,
    })

    useI18n.mockReturnValue({
      t: mockT,
    })

    useAppToast.mockReturnValue({
      toastSuccess: mockToastSuccess,
      toastError: mockToastError,
    })

    wrapper = mount(ChangeUserRoleFormular, {
      global: {
        plugins: [store],
        mocks: {
          $t: mockT,
          $bvModal: {
            msgBoxConfirm: mockMsgBoxConfirm,
          },
        },
        stubs: {
          BButton,
        },
      },
      props: {
        item: {
          userId: 1,
          roles: [],
        },
      },
    })
  })

  it('renders the component', () => {
    expect(wrapper.find('.change-user-role-formular').exists()).toBe(true)
  })

  describe('change own role', () => {
    beforeEach(async () => {
      await wrapper.setProps({
        item: {
          userId: 0,
          roles: ['ADMIN'],
        },
      })
    })

    it('shows text that you cannot change own role', () => {
      expect(wrapper.text()).toContain('userRole.notChangeYourSelf')
    })

    it('does not show role select', () => {
      expect(wrapper.find('select.role-select').exists()).toBe(false)
    })

    it('does not show button', () => {
      expect(wrapper.find('button.btn.btn-danger').exists()).toBe(false)
    })
  })

  describe("change other user's role", () => {
    describe('user has role "usual user"', () => {
      beforeEach(async () => {
        mockMutate.mockResolvedValue({
          data: {
            setUserRole: 'ADMIN',
          },
        })
        await wrapper.setProps({
          item: {
            userId: 1,
            roles: ['USER'],
          },
        })
      })

      it('shows role select', () => {
        expect(wrapper.find('select.role-select').exists()).toBe(true)
      })

      it('has "USER" role selected', () => {
        expect(wrapper.find('select.role-select').element.value).toBe('USER')
      })

      describe('change role to "MODERATOR"', () => {
        beforeEach(async () => {
          await wrapper.find('select.role-select').setValue('MODERATOR')
          mockMsgBoxConfirm.mockResolvedValue(true)
          console.log(wrapper.html())
          await wrapper.find('button.btn.btn-danger').trigger('click')
        })

        it('calls the API', () => {
          expect(mockMutate).toHaveBeenCalledWith({
            userId: 1,
            role: 'MODERATOR',
          })
        })

        it('emits "updateRoles" with new role', () => {
          expect(wrapper.emitted('updateRoles')).toEqual([
            [
              {
                userId: 1,
                roles: ['MODERATOR'],
              },
            ],
          ])
        })

        it('shows success message', () => {
          expect(mockToastSuccess).toHaveBeenCalledWith('userRole.successfullyChangedTo')
        })
      })

      describe('change role with API error', () => {
        beforeEach(async () => {
          await wrapper.find('select.role-select').setValue('ADMIN')
          mockMsgBoxConfirm.mockResolvedValue(true)
          mockMutate.mockRejectedValue(new Error('Oh no!'))
          await wrapper.find('button.btn.btn-danger').trigger('click')
        })

        it('shows error message', () => {
          expect(mockToastError).toHaveBeenCalledWith('Oh no!')
        })
      })
    })

    // Similar tests for "MODERATOR" and "ADMIN" roles...
  })

  describe('authenticated user is MODERATOR', () => {
    beforeEach(() => {
      store = createVuexStore(['MODERATOR'])
      wrapper = mount(ChangeUserRoleFormular, {
        global: {
          plugins: [store],
          mocks: {
            $t: mockT,
          },
        },
        props: {
          item: {
            userId: 1,
            roles: ['USER'],
          },
        },
      })
    })

    it('displays text with role', () => {
      console.log(wrapper.html())
      expect(wrapper.text()).toBe('userRole.selectRoles.admin')
    })

    it('does not show role select', () => {
      expect(wrapper.find('select.role-select').exists()).toBe(false)
    })

    it('does not show button', () => {
      expect(wrapper.find('button.btn.btn-danger').exists()).toBe(false)
    })
  })
})
