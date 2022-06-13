import { mount } from '@vue/test-utils'
import ChangeUserRoleFormular from './ChangeUserRoleFormular.vue'
import { setUserRole } from '../graphql/setUserRole'
import { toastErrorSpy } from '../../test/testSetup'

const localVue = global.localVue

const date = new Date()

const apolloMutateMock = jest.fn().mockResolvedValue({
  data: {
    setUserRole: date,
  },
})

const mocks = {
  $t: jest.fn((t) => t),
  $apollo: {
    mutate: apolloMutateMock,
  },
  $store: {
    state: {
      moderator: {
        id: 0,
        name: 'test moderator',
      },
    },
  },
}

const propsData = {
  item: {},
}

describe('ChangeUserRoleFormular', () => {
  let wrapper

  const Wrapper = () => {
    return mount(ChangeUserRoleFormular, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.delete-user-formular', () => {
      expect(wrapper.find('.change-user-role-formular').exists()).toBe(true)
    })

    describe('change own role', () => {
      beforeEach(() => {
        wrapper.setProps({
          item: {
            userId: 0,
          },
        })
      })

      it('shows a text that you cannot change own role', () => {
        expect(wrapper.text()).toContain('userRole.notChangeYourSelf')
      })

      it('role select is disabled', () => {
        expect(wrapper.find('select[disabled="disabled"]').exists()).toBe(true)
      })
    })

    describe('change others role', () => {
      beforeEach(() => {
        // Wolle: await?
        wrapper.setProps({
          item: {
            userId: 1,
            isAdmin: null,
          },
        })
      })

      it('shows no text that you cannot change own role', () => {
        expect(wrapper.text()).not.toContain('userRole.notChangeYourSelf')
      })

      it('shows the select label', () => {
        expect(wrapper.text()).toContain('userRole.selectLabel')
      })

      it('has a select', () => {
        expect(wrapper.find('select.role-select').exists()).toBe(true)
      })

      it('role select is enabled', () => {
        expect(wrapper.find('select.role-select[disabled="disabled"]').exists()).toBe(false)
      })

      describe('user is usual user', () => {
        it('select is set to "usual user"', () => {
          // expect(wrapper.find('option:checked').element.value).toBe('user')
          expect(wrapper.find('select.role-select').element.value).toBe('user')
        })
      })

      describe('user is admin', () => {
        beforeEach(async () => {
          await wrapper.setProps({
            item: {
              userId: 1,
              isAdmin: date,
            },
          })
          await wrapper.vm.$nextTick()
        })

        it.only('select is set to "admin"', () => {
          // expect(wrapper.find('option:checked').element.value).toBe('admin')
          expect(wrapper.find('select.role-select').element.value).toBe('admin')
        })
      })

      // Wolle
      // describe('click on select', () => {
      //   beforeEach(async () => {
      //     await wrapper.find('input[type="checkbox"]').setChecked()
      //   })

      //   it('has a confirmation button', () => {
      //     expect(wrapper.find('button').exists()).toBeTruthy()
      //   })

      //   it('has the button text "delete_user"', () => {
      //     expect(wrapper.find('button').text()).toBe('delete_user')
      //   })

      //   describe('confirm delete with success', () => {
      //     beforeEach(async () => {
      //       await wrapper.find('button').trigger('click')
      //     })

      //     it('calls the API', () => {
      //       expect(apolloMutateMock).toBeCalledWith(
      //         expect.objectContaining({
      //           mutation: setUserRole,
      //           variables: {
      //             userId: 1,
      //           },
      //         }),
      //       )
      //     })

      //     it('emits update deleted At', () => {
      //       expect(wrapper.emitted('updateDeletedAt')).toEqual(
      //         expect.arrayContaining([
      //           expect.arrayContaining([
      //             {
      //               userId: 1,
      //               isAdmin: date,
      //             },
      //           ]),
      //         ]),
      //       )
      //     })

      //     it('unchecks the checkbox', () => {
      //       expect(wrapper.find('input').attributes('checked')).toBe(undefined)
      //     })
      //   })

      //   describe('confirm delete with error', () => {
      //     beforeEach(async () => {
      //       apolloMutateMock.mockRejectedValue({ message: 'Oh no!' })
      //       await wrapper.find('button').trigger('click')
      //     })

      //     it('toasts an error message', () => {
      //       expect(toastErrorSpy).toBeCalledWith('Oh no!')
      //     })
      //   })

      //   describe('click on checkbox again', () => {
      //     beforeEach(async () => {
      //       await wrapper.find('input[type="checkbox"]').setChecked(false)
      //     })

      //     it('has no confirmation button anymore', () => {
      //       expect(wrapper.find('button').exists()).toBeFalsy()
      //     })
      //   })
      // })
    })

    // Wolle
    // describe.skip('recover user', () => {
    //   beforeEach(() => {
    //     wrapper.setProps({
    //       item: {
    //         userId: 1,
    //         isAdmin: date,
    //       },
    //     })
    //   })

    //   it('has a checkbox', () => {
    //     expect(wrapper.find('input[type="checkbox"]').exists()).toBeTruthy()
    //   })

    //   it('shows the text "undelete_user"', () => {
    //     expect(wrapper.text()).toBe('undelete_user')
    //   })

    //   describe('click on checkbox', () => {
    //     beforeEach(async () => {
    //       apolloMutateMock.mockResolvedValue({
    //         data: {
    //           unDeleteUser: null,
    //         },
    //       })
    //       await wrapper.find('input[type="checkbox"]').setChecked()
    //     })

    //     it('has a confirmation button', () => {
    //       expect(wrapper.find('button').exists()).toBeTruthy()
    //     })

    //     it('has the button text "undelete_user"', () => {
    //       expect(wrapper.find('button').text()).toBe('undelete_user')
    //     })

    //     describe('confirm recover with success', () => {
    //       beforeEach(async () => {
    //         await wrapper.find('button').trigger('click')
    //       })

    //       it('calls the API', () => {
    //         expect(apolloMutateMock).toBeCalledWith(
    //           expect.objectContaining({
    //             mutation: unDeleteUser,
    //             variables: {
    //               userId: 1,
    //             },
    //           }),
    //         )
    //       })

    //       it('emits update deleted At', () => {
    //         expect(wrapper.emitted('updateDeletedAt')).toEqual(
    //           expect.arrayContaining([
    //             expect.arrayContaining([
    //               {
    //                 userId: 1,
    //                 isAdmin: null,
    //               },
    //             ]),
    //           ]),
    //         )
    //       })

    //       it('unchecks the checkbox', () => {
    //         expect(wrapper.find('input').attributes('checked')).toBe(undefined)
    //       })
    //     })

    //     describe('confirm recover with error', () => {
    //       beforeEach(async () => {
    //         apolloMutateMock.mockRejectedValue({ message: 'Oh no!' })
    //         await wrapper.find('button').trigger('click')
    //       })

    //       it('toasts an error message', () => {
    //         expect(toastErrorSpy).toBeCalledWith('Oh no!')
    //       })
    //     })

    //     describe('click on checkbox again', () => {
    //       beforeEach(async () => {
    //         await wrapper.find('input[type="checkbox"]').setChecked(false)
    //       })

    //       it('has no confirmation button anymore', () => {
    //         expect(wrapper.find('button').exists()).toBeFalsy()
    //       })
    //     })
    //   })
    // })
  })
})
