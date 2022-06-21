import { mount } from '@vue/test-utils'
import UserSearch from './UserSearch.vue'
import { toastErrorSpy, toastSuccessSpy } from '../../test/testSetup'

const localVue = global.localVue

const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    searchUsers: {
      userCount: 4,
      userList: [
        {
          userId: 1,
          firstName: 'Bibi',
          lastName: 'Bloxberg',
          email: 'bibi@bloxberg.de',
          creation: [200, 400, 600],
          emailChecked: true,
          deletedAt: null,
        },
        {
          userId: 2,
          firstName: 'Benjamin',
          lastName: 'Blümchen',
          email: 'benjamin@bluemchen.de',
          creation: [1000, 1000, 1000],
          emailChecked: true,
          deletedAt: null,
        },
        {
          userId: 3,
          firstName: 'Peter',
          lastName: 'Lustig',
          email: 'peter@lustig.de',
          creation: [0, 0, 0],
          emailChecked: true,
          deletedAt: null,
        },
        {
          userId: 4,
          firstName: 'New',
          lastName: 'User',
          email: 'new@user.ch',
          creation: [1000, 1000, 1000],
          emailChecked: false,
          deletedAt: null,
        },
      ],
    },
  },
})

const mocks = {
  $t: jest.fn((t) => t),
  $d: jest.fn((d) => String(d)),
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
      jest.clearAllMocks()
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.user-search', () => {
      expect(wrapper.find('div.user-search').exists()).toBeTruthy()
    })

    it('calls the API', () => {
      expect(apolloQueryMock).toBeCalledWith(
        expect.objectContaining({
          variables: {
            searchText: '',
            currentPage: 1,
            pageSize: 25,
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
              searchText: '',
              currentPage: 1,
              pageSize: 25,
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
              searchText: '',
              currentPage: 1,
              pageSize: 25,
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
              searchText: '',
              currentPage: 2,
              pageSize: 25,
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
              searchText: 'search string',
              currentPage: 1,
              pageSize: 25,
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
          jest.clearAllMocks()
          await wrapper.find('.test-click-clear-criteria').trigger('click')
          expect(apolloQueryMock).toBeCalledWith(
            expect.objectContaining({
              variables: {
                searchText: '',
                currentPage: 1,
                pageSize: 25,
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
            .vm.$emit('updateIsAdmin', userId, new Date())
          expect(wrapper.vm.searchResult.find((obj) => obj.userId === userId).isAdmin).toEqual(
            expect.any(Date),
          )
        })
      })

      describe('to usual user', () => {
        it('updates user role to usual user', async () => {
          await wrapper
            .findComponent({ name: 'SearchUserTable' })
            .vm.$emit('updateIsAdmin', userId, null)
          expect(wrapper.vm.searchResult.find((obj) => obj.userId === userId).isAdmin).toEqual(null)
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
