import { mount } from '@vue/test-utils'
import UserSearch from './UserSearch.vue'

const localVue = global.localVue

const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    searchUsers: {
      userCount: 1,
      userList: [
        {
          userId: 1,
          firstName: 'Bibi',
          lastName: 'Bloxberg',
          email: 'bibi@bloxberg.de',
          creation: [200, 400, 600],
          emailChecked: true,
        },
        {
          userId: 2,
          firstName: 'Benjamin',
          lastName: 'Blümchen',
          email: 'benjamin@bluemchen.de',
          creation: [1000, 1000, 1000],
          emailChecked: true,
        },
        {
          userId: 3,
          firstName: 'Peter',
          lastName: 'Lustig',
          email: 'peter@lustig.de',
          creation: [0, 0, 0],
          emailChecked: true,
        },
        {
          userId: 4,
          firstName: 'New',
          lastName: 'User',
          email: 'new@user.ch',
          creation: [1000, 1000, 1000],
          emailChecked: false,
        },
      ],
    },
  },
})

const toastErrorMock = jest.fn()

const mocks = {
  $t: jest.fn((t) => t),
  $d: jest.fn((d) => String(d)),
  $apollo: {
    query: apolloQueryMock,
  },
  $toasted: {
    error: toastErrorMock,
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
            notActivated: false,
          },
        }),
      )
    })

    describe('row toggling', () => {
      it('has 4 users in the table', () => {
        expect(wrapper.findAll('tbody > tr')).toHaveLength(4)
      })

      describe('user with email not activated', () => {
        it('has no details button', () => {
          expect(
            wrapper.findAll('tbody > tr').at(3).findAll('td').at(4).find('button').exists(),
          ).toBeFalsy()
        })

        it('has a red confirmed button with envelope item', () => {
          const row = wrapper.findAll('tbody > tr').at(3)
          expect(row.findAll('td').at(5).find('button').exists()).toBeTruthy()
          expect(row.findAll('td').at(5).find('button').classes('btn-danger')).toBeTruthy()
          expect(row.findAll('td').at(5).find('svg').classes('bi-envelope')).toBeTruthy()
        })

        describe('click on envelope', () => {
          it('opens the details', async () => {
            await wrapper
              .findAll('tbody > tr')
              .at(3)
              .findAll('td')
              .at(5)
              .find('button')
              .trigger('click')
            expect(wrapper.findAll('tbody > tr')).toHaveLength(6)
            expect(wrapper.findAll('tbody > tr').at(5).find('input').element.value).toBe(
              'new@user.ch',
            )
            expect(wrapper.findAll('tbody > tr').at(5).text()).toContain(
              'unregister_mail.text_false',
            )
          })

          describe('click on envelope again', () => {
            it('closes the details', async () => {
              await wrapper
                .findAll('tbody > tr')
                .at(3)
                .findAll('td')
                .at(5)
                .find('button')
                .trigger('click')
              expect(wrapper.findAll('tbody > tr')).toHaveLength(4)
            })
          })

          describe('click on close details', () => {
            it('closes the details', async () => {
              await wrapper
                .findAll('tbody > tr')
                .at(3)
                .findAll('td')
                .at(5)
                .find('button')
                .trigger('click')
              await wrapper.findAll('tbody > tr').at(5).findAll('button').at(1).trigger('click')
              expect(wrapper.findAll('tbody > tr')).toHaveLength(4)
            })
          })
        })
      })

      describe('different details', () => {
        it.skip('shows the creation formular for second user', async () => {
          await wrapper
            .findAll('tbody > tr')
            .at(1)
            .findAll('td')
            .at(4)
            .find('button')
            .trigger('click')
          expect(wrapper.findAll('tbody > tr')).toHaveLength(6)
          expect(
            wrapper.findAll('tbody > tr').at(3).find('div.component-creation-formular').exists(),
          ).toBeTruthy()
        })

        it.skip('shows the transactions for third user', async () => {
          await wrapper
            .findAll('tbody > tr')
            .at(4)
            .findAll('td')
            .at(6)
            .find('button')
            .trigger('click')
          expect(wrapper.findAll('tbody > tr')).toHaveLength(6)
        })
      })
    })

    describe('unconfirmed emails', () => {
      beforeEach(async () => {
        await wrapper.find('button.btn-block').trigger('click')
      })

      it('calls API with filter', () => {
        expect(apolloQueryMock).toBeCalledWith(
          expect.objectContaining({
            variables: {
              searchText: '',
              currentPage: 1,
              pageSize: 25,
              notActivated: true,
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
              notActivated: false,
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
              notActivated: false,
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
                notActivated: false,
              },
            }),
          )
        })
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
        expect(toastErrorMock).toBeCalledWith('Ouch')
      })
    })
  })
})
