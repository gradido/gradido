import { mount } from '@vue/test-utils'
import DeletedUserFormular from './DeletedUserFormular.vue'
import { deleteUser } from '../graphql/deleteUser'
import { unDeleteUser } from '../graphql/unDeleteUser'
import { toastErrorSpy } from '../../test/testSetup'

const localVue = global.localVue

const date = new Date()

const apolloMutateMock = jest.fn().mockResolvedValue({
  data: {
    deleteUser: date,
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

describe('DeletedUserFormular', () => {
  let wrapper

  const Wrapper = () => {
    return mount(DeletedUserFormular, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.delete-user-formular', () => {
      expect(wrapper.find('.deleted-user-formular').exists()).toBe(true)
    })

    describe('delete self', () => {
      beforeEach(() => {
        wrapper.setProps({
          item: {
            userId: 0,
          },
        })
      })

      it('shows a text that you cannot delete yourself', () => {
        expect(wrapper.text()).toBe('removeNotSelf')
      })
    })

    describe('delete other user', () => {
      beforeEach(() => {
        wrapper.setProps({
          item: {
            userId: 1,
            deletedAt: null,
          },
        })
      })

      it('has a checkbox', () => {
        expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
      })

      it('shows the text "delete_user"', () => {
        expect(wrapper.text()).toBe('delete_user')
      })

      describe('click on checkbox', () => {
        beforeEach(async () => {
          await wrapper.find('input[type="checkbox"]').setChecked()
        })

        it('has a confirmation button', () => {
          expect(wrapper.find('button').exists()).toBe(true)
        })

        it('has the button text "delete_user"', () => {
          expect(wrapper.find('button').text()).toBe('delete_user')
        })

        describe('confirm delete with success', () => {
          beforeEach(async () => {
            await wrapper.find('button').trigger('click')
          })

          it('calls the API', () => {
            expect(apolloMutateMock).toBeCalledWith(
              expect.objectContaining({
                mutation: deleteUser,
                variables: {
                  userId: 1,
                },
              }),
            )
          })

          it('emits update deleted At', () => {
            expect(wrapper.emitted('updateDeletedAt')).toEqual(
              expect.arrayContaining([
                expect.arrayContaining([
                  {
                    userId: 1,
                    deletedAt: date,
                  },
                ]),
              ]),
            )
          })

          it('unchecks the checkbox', () => {
            expect(wrapper.find('input').attributes('checked')).toBe(undefined)
          })
        })

        describe('confirm delete with error', () => {
          beforeEach(async () => {
            apolloMutateMock.mockRejectedValue({ message: 'Oh no!' })
            await wrapper.find('button').trigger('click')
          })

          it('toasts an error message', () => {
            expect(toastErrorSpy).toBeCalledWith('Oh no!')
          })
        })

        describe('click on checkbox again', () => {
          beforeEach(async () => {
            await wrapper.find('input[type="checkbox"]').setChecked(false)
          })

          it('has no confirmation button anymore', () => {
            expect(wrapper.find('button').exists()).toBe(false)
          })
        })
      })
    })

    describe('recover user', () => {
      beforeEach(() => {
        wrapper.setProps({
          item: {
            userId: 1,
            deletedAt: date,
          },
        })
      })

      it('has a checkbox', () => {
        expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
      })

      it('shows the text "undelete_user"', () => {
        expect(wrapper.text()).toBe('undelete_user')
      })

      describe('click on checkbox', () => {
        beforeEach(async () => {
          apolloMutateMock.mockResolvedValue({
            data: {
              unDeleteUser: null,
            },
          })
          await wrapper.find('input[type="checkbox"]').setChecked()
        })

        it('has a confirmation button', () => {
          expect(wrapper.find('button').exists()).toBe(true)
        })

        it('has the button text "undelete_user"', () => {
          expect(wrapper.find('button').text()).toBe('undelete_user')
        })

        describe('confirm recover with success', () => {
          beforeEach(async () => {
            await wrapper.find('button').trigger('click')
          })

          it('calls the API', () => {
            expect(apolloMutateMock).toBeCalledWith(
              expect.objectContaining({
                mutation: unDeleteUser,
                variables: {
                  userId: 1,
                },
              }),
            )
          })

          it('emits update deleted At', () => {
            expect(wrapper.emitted('updateDeletedAt')).toEqual(
              expect.arrayContaining([
                expect.arrayContaining([
                  {
                    userId: 1,
                    deletedAt: null,
                  },
                ]),
              ]),
            )
          })

          it('unchecks the checkbox', () => {
            expect(wrapper.find('input').attributes('checked')).toBe(undefined)
          })
        })

        describe('confirm recover with error', () => {
          beforeEach(async () => {
            apolloMutateMock.mockRejectedValue({ message: 'Oh no!' })
            await wrapper.find('button').trigger('click')
          })

          it('toasts an error message', () => {
            expect(toastErrorSpy).toBeCalledWith('Oh no!')
          })
        })

        describe('click on checkbox again', () => {
          beforeEach(async () => {
            await wrapper.find('input[type="checkbox"]').setChecked(false)
          })

          it('has no confirmation button anymore', () => {
            expect(wrapper.find('button').exists()).toBe(false)
          })
        })
      })
    })
  })
})
