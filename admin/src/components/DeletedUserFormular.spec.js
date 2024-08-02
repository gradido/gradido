import { mount } from '@vue/test-utils'
import DeletedUserFormular from './DeletedUserFormular'
import { deleteUser } from '../graphql/deleteUser'
import { unDeleteUser } from '../graphql/unDeleteUser'
import { toastErrorSpy } from '../../test/testSetup'
import { vi, describe, beforeEach, it, expect } from 'vitest'

const localVue = global.localVue

const date = new Date()

const apolloMutateMock = vi.fn().mockResolvedValue({
  data: {
    deleteUser: date,
  },
})

const mocks = {
  $t: vi.fn((t) => t),
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
  let spy

  const Wrapper = () => {
    return mount(DeletedUserFormular, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      vi.clearAllMocks()
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

      it('has no "delete_user" button', () => {
        expect(wrapper.find('button').exists()).toBe(false)
      })
    })

    describe('delete other user', () => {
      beforeEach(() => {
        wrapper.setProps({
          item: {
            userId: 1,
            deletedAt: null,
          },
          static: true,
        })
      })

      it('shows the text "delete_user"', () => {
        expect(wrapper.text()).toBe('delete_user')
      })

      it('has a "delete_user" button', () => {
        expect(wrapper.find('button').text()).toBe('delete_user')
      })

      describe('click on "delete_user" button', () => {
        beforeEach(async () => {
          spy = vi.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
          spy.mockImplementation(() => Promise.resolve(true))
          await wrapper.find('button').trigger('click')
          await wrapper.vm.$nextTick()
        })

        it('calls the modal', () => {
          expect(wrapper.emitted('showDeleteModal'))
          expect(spy).toHaveBeenCalled()
        })

        describe('confirm delete with success', () => {
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
        })

        describe('confirm delete with error', () => {
          beforeEach(async () => {
            spy = vi.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
            apolloMutateMock.mockRejectedValue({ message: 'Oh no!' })
            await wrapper.find('button').trigger('click')
            await wrapper.vm.$nextTick()
          })

          it('toasts an error message', () => {
            expect(toastErrorSpy).toBeCalledWith('Oh no!')
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

      it('shows the text "undelete_user"', () => {
        expect(wrapper.text()).toBe('undelete_user')
      })

      it('has a "undelete_user" button', () => {
        expect(wrapper.find('button').text()).toBe('undelete_user')
      })

      describe('click on "undelete_user" button', () => {
        beforeEach(async () => {
          apolloMutateMock.mockResolvedValue({
            data: {
              unDeleteUser: null,
            },
          })
          spy = vi.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
          spy.mockImplementation(() => Promise.resolve(true))
          await wrapper.find('button').trigger('click')
          await wrapper.vm.$nextTick()
        })

        it('calls the modal', () => {
          expect(wrapper.emitted('showUndeleteModal'))
          expect(spy).toHaveBeenCalled()
        })

        describe('confirm recover with success', () => {
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
            expect(wrapper.emitted('updateDeletedAt')).toMatchObject(
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
      })
    })
  })
})
