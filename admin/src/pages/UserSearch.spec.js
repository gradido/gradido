import { mount } from '@vue/test-utils'
import UserSearch from './UserSearch'
import { toastErrorSpy, toastSuccessSpy } from '../../test/testSetup'
import { vi, describe, beforeEach, it, expect } from 'vitest'

const localVue = global.localVue

const apolloQueryMock = vi.fn().mockResolvedValue({
  data: {
    searchUsers: {
      userCount: 4,
      userList: [
        {
          userId: 4,
          firstName: 'New',
          lastName: 'User',
          email: 'new@user.ch',
          creation: [1000, 1000, 1000],
          emailChecked: false,
          roles: [],
          deletedAt: null,
        },
        {
          userId: 3,
          firstName: 'Peter',
          lastName: 'Lustig',
          email: 'peter@lustig.de',
          creation: [0, 0, 0],
          roles: ['ADMIN'],
          emailChecked: true,
          deletedAt: null,
        },
        {
          userId: 2,
          firstName: 'Benjamin',
          lastName: 'Blümchen',
          email: 'benjamin@bluemchen.de',
          creation: [1000, 1000, 1000],
          roles: [],
          emailChecked: true,
          deletedAt: new Date(),
        },
        {
          userId: 1,
          firstName: 'Bibi',
          lastName: 'Bloxberg',
          email: 'bibi@bloxberg.de',
          creation: [200, 400, 600],
          roles: [],
          emailChecked: true,
          deletedAt: null,
        },
      ],
    },
  },
})

const mocks = {
  $t: vi.fn((t) => t),
  $d: vi.fn((d) => String(d)),
  $apollo: {
    query: apolloQueryMock,
  },
}

describe('UserSearch', () => {
  let wrapper

  const Wrapper = () => {
    return mount(UserSearch, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.user-search', () => {
      expect(wrapper.find('div.user-search').exists()).toBeTruthy()
    })

    it('calls the API', () => {
      expect(apolloQueryMock).toBeCalledWith(
        expect.objectContaining({
          variables: {
            query: '',
            currentPage: 1,
            pageSize: 25,
            order: 'DESC',
            filters: {
              byActivated: null,
              byDeleted: null,
            },
          },
        }),
      )
    })

    describe('unconfirmed emails', () => {
      beforeEach(async () => {
        await wrapper.find('button.unconfirmedRegisterMails').trigger('click')
      })

      it('calls API with filter', () => {
        expect(apolloQueryMock).toBeCalledWith(
          expect.objectContaining({
            variables: {
              query: '',
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
              filters: {
                byActivated: false,
                byDeleted: null,
              },
            },
          }),
        )
      })
    })

    describe('deleted Users', () => {
      beforeEach(async () => {
        await wrapper.find('button.deletedUserSearch').trigger('click')
      })

      it('calls API with filter', () => {
        expect(apolloQueryMock).toBeCalledWith(
          expect.objectContaining({
            variables: {
              query: '',
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
              filters: {
                byActivated: null,
                byDeleted: true,
              },
            },
          }),
        )
      })
    })

    describe('pagination', () => {
      beforeEach(async () => {
        wrapper.setData({ currentPage: 2 })
      })

      it('calls the API with new page', () => {
        expect(apolloQueryMock).toBeCalledWith(
          expect.objectContaining({
            variables: {
              query: '',
              currentPage: 2,
              pageSize: 25,
              order: 'DESC',
              filters: {
                byActivated: null,
                byDeleted: null,
              },
            },
          }),
        )
      })
    })

    describe('user search', () => {
      beforeEach(async () => {
        wrapper.setData({ criteria: 'search string' })
      })

      it('calls the API with search string', () => {
        expect(apolloQueryMock).toBeCalledWith(
          expect.objectContaining({
            variables: {
              query: 'search string',
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
              filters: {
                byActivated: null,
                byDeleted: null,
              },
            },
          }),
        )
      })

      describe('reset the search field', () => {
        it('calls the API with empty criteria', async () => {
          vi.clearAllMocks()
          await wrapper.findComponent({ name: 'UserQuery' }).vm.$emit('input', '')
          expect(apolloQueryMock).toBeCalledWith(
            expect.objectContaining({
              variables: {
                query: '',
                currentPage: 1,
                pageSize: 25,
                order: 'DESC',
                filters: {
                  byActivated: null,
                  byDeleted: null,
                },
              },
            }),
          )
        })
      })
    })

    describe('change user role', () => {
      const userId = 4

      describe('to admin', () => {
        it('updates user role to admin', async () => {
          await wrapper
            .findComponent({ name: 'SearchUserTable' })
            .vm.$emit('updateRoles', userId, ['ADMIN'])
          expect(wrapper.vm.searchResult.find((obj) => obj.userId === userId).roles).toEqual([
            'ADMIN',
          ])
        })
      })

      describe('to usual user', () => {
        it('updates user role to usual user', async () => {
          await wrapper
            .findComponent({ name: 'SearchUserTable' })
            .vm.$emit('updateRoles', userId, [])
          expect(wrapper.vm.searchResult.find((obj) => obj.userId === userId).roles).toEqual([])
        })
      })
    })

    describe('delete user', () => {
      const userId = 4
      beforeEach(() => {
        wrapper
          .findComponent({ name: 'SearchUserTable' })
          .vm.$emit('updateDeletedAt', userId, new Date())
      })

      it('marks the user as deleted', () => {
        expect(wrapper.vm.searchResult.find((obj) => obj.userId === userId).deletedAt).toEqual(
          expect.any(Date),
        )
        expect(wrapper.find('.test-deleted-icon').exists()).toBe(true)
      })

      it('toasts a success message', () => {
        expect(toastSuccessSpy).toBeCalledWith('user_deleted')
      })
    })

    describe('recover user', () => {
      const userId = 2
      beforeEach(() => {
        wrapper.findComponent({ name: 'SearchUserTable' }).vm.$emit('updateDeletedAt', userId, null)
      })

      it('toasts a success message', () => {
        expect(toastSuccessSpy).toBeCalledWith('user_recovered')
      })
    })

    describe('apollo returns error', () => {
      beforeEach(() => {
        apolloQueryMock.mockRejectedValue({
          message: 'Ouch',
        })
        wrapper = Wrapper()
      })

      it('toasts an error message', () => {
        expect(toastErrorSpy).toBeCalledWith('Ouch')
      })
    })
  })
})
