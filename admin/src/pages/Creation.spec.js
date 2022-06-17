import { mount } from '@vue/test-utils'
import Creation from './Creation.vue'
import { toastErrorSpy } from '../../test/testSetup'

const localVue = global.localVue

const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    searchUsers: {
      userCount: 2,
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
          creation: [800, 600, 400],
          emailChecked: true,
        },
      ],
    },
  },
})

const storeCommitMock = jest.fn()

const mocks = {
  $t: jest.fn((t, options) => (options ? [t, options] : t)),
  $d: jest.fn((d) => d),
  $apollo: {
    query: apolloQueryMock,
  },
  $store: {
    commit: storeCommitMock,
    state: {
      userSelectedInMassCreation: [],
    },
  },
}

describe('Creation', () => {
  let wrapper

  const Wrapper = () => {
    return mount(Creation, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.creation', () => {
      expect(wrapper.find('div.creation').exists()).toBeTruthy()
    })

    describe('apollo returns user array', () => {
      it('calls the searchUser query', () => {
        expect(apolloQueryMock).toBeCalledWith(
          expect.objectContaining({
            variables: {
              searchText: '',
              currentPage: 1,
              pageSize: 25,
              filters: {
                byActivated: true,
                byDeleted: false,
              },
            },
          }),
        )
      })

      it('has two rows in the left table', () => {
        expect(wrapper.findAll('table').at(0).findAll('tbody > tr')).toHaveLength(2)
      })

      it('has nwo rows in the right table', () => {
        expect(wrapper.findAll('table').at(1).findAll('tbody > tr')).toHaveLength(0)
      })

      it('has correct data in first row ', () => {
        expect(wrapper.findAll('table').at(0).findAll('tbody > tr').at(0).text()).toContain('Bibi')
        expect(wrapper.findAll('table').at(0).findAll('tbody > tr').at(0).text()).toContain(
          'Bloxberg',
        )
        expect(wrapper.findAll('table').at(0).findAll('tbody > tr').at(0).text()).toContain(
          '200 | 400 | 600',
        )
        expect(wrapper.findAll('table').at(0).findAll('tbody > tr').at(0).text()).toContain(
          'bibi@bloxberg.de',
        )
      })

      it('has correct data in second row ', () => {
        expect(wrapper.findAll('table').at(0).findAll('tbody > tr').at(1).text()).toContain(
          'Benjamin',
        )
        expect(wrapper.findAll('table').at(0).findAll('tbody > tr').at(1).text()).toContain(
          'Blümchen',
        )
        expect(wrapper.findAll('table').at(0).findAll('tbody > tr').at(1).text()).toContain(
          '800 | 600 | 400',
        )
        expect(wrapper.findAll('table').at(0).findAll('tbody > tr').at(1).text()).toContain(
          'benjamin@bluemchen.de',
        )
      })
    })

    describe('push item', () => {
      beforeEach(() => {
        wrapper.findAll('table').at(0).findAll('tbody > tr').at(1).find('button').trigger('click')
      })

      it('has one item in left table', () => {
        expect(wrapper.findAll('table').at(0).findAll('tbody > tr')).toHaveLength(1)
      })

      it('has one item in right table', () => {
        expect(wrapper.findAll('table').at(1).findAll('tbody > tr')).toHaveLength(1)
      })

      it('has the correct user in left table', () => {
        expect(wrapper.findAll('table').at(0).findAll('tbody > tr').at(0).text()).toContain(
          'bibi@bloxberg.de',
        )
      })

      it('has the correct user in right table', () => {
        expect(wrapper.findAll('table').at(1).findAll('tbody > tr').at(0).text()).toContain(
          'benjamin@bluemchen.de',
        )
      })

      it('updates userSelectedInMassCreation in store', () => {
        expect(storeCommitMock).toBeCalledWith('setUserSelectedInMassCreation', [
          {
            userId: 2,
            firstName: 'Benjamin',
            lastName: 'Blümchen',
            email: 'benjamin@bluemchen.de',
            creation: [800, 600, 400],
            showDetails: false,
            emailChecked: true,
          },
        ])
      })

      describe('remove item', () => {
        beforeEach(async () => {
          await wrapper
            .findAll('table')
            .at(1)
            .findAll('tbody > tr')
            .at(0)
            .find('button')
            .trigger('click')
        })

        it('has two items in left table', () => {
          expect(wrapper.findAll('table').at(0).findAll('tbody > tr')).toHaveLength(2)
        })

        it('has the removed user in first row', () => {
          expect(wrapper.findAll('table').at(0).findAll('tbody > tr').at(0).text()).toContain(
            'benjamin@bluemchen.de',
          )
        })

        it('has no items in right table', () => {
          expect(wrapper.findAll('table').at(1).findAll('tbody > tr')).toHaveLength(0)
        })

        it('commits empty array as userSelectedInMassCreation', () => {
          expect(storeCommitMock).toBeCalledWith('setUserSelectedInMassCreation', [])
        })
      })

      describe('remove all bookmarks', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          await wrapper.find('button.btn-light').trigger('click')
        })

        it('has no items in right table', () => {
          expect(wrapper.findAll('table').at(1).findAll('tbody > tr')).toHaveLength(0)
        })

        it('commits empty array to userSelectedInMassCreation', () => {
          expect(storeCommitMock).toBeCalledWith('setUserSelectedInMassCreation', [])
        })

        it('calls searchUsers', () => {
          expect(apolloQueryMock).toBeCalled()
        })
      })
    })

    describe('store has items in userSelectedInMassCreation', () => {
      beforeEach(() => {
        mocks.$store.state.userSelectedInMassCreation = [
          {
            userId: 2,
            firstName: 'Benjamin',
            lastName: 'Blümchen',
            email: 'benjamin@bluemchen.de',
            creation: [800, 600, 400],
            showDetails: false,
            emailChecked: true,
          },
        ]
        wrapper = Wrapper()
      })

      it('has one item in left table', () => {
        expect(wrapper.findAll('table').at(0).findAll('tbody > tr')).toHaveLength(1)
      })

      it('has one item in right table', () => {
        expect(wrapper.findAll('table').at(1).findAll('tbody > tr')).toHaveLength(1)
      })

      it('has the stored user in second row', () => {
        expect(wrapper.findAll('table').at(1).findAll('tbody > tr').at(0).text()).toContain(
          'benjamin@bluemchen.de',
        )
      })
    })

    describe('failed creations', () => {
      beforeEach(async () => {
        await wrapper
          .findComponent({ name: 'CreationFormular' })
          .vm.$emit('toast-failed-creations', ['bibi@bloxberg.de', 'benjamin@bluemchen.de'])
      })

      it('toasts two error messages', () => {
        expect(toastErrorSpy).toBeCalledWith([
          'creation_form.creation_failed',
          { email: 'bibi@bloxberg.de' },
        ])
        expect(toastErrorSpy).toBeCalledWith([
          'creation_form.creation_failed',
          { email: 'benjamin@bluemchen.de' },
        ])
      })
    })

    describe('watchers', () => {
      beforeEach(() => {
        jest.clearAllMocks()
      })

      describe('search criteria', () => {
        beforeEach(async () => {
          await wrapper.setData({ criteria: 'XX' })
        })

        it('calls API when criteria changes', async () => {
          expect(apolloQueryMock).toBeCalledWith(
            expect.objectContaining({
              variables: {
                searchText: 'XX',
                currentPage: 1,
                pageSize: 25,
                filters: {
                  byActivated: true,
                  byDeleted: false,
                },
              },
            }),
          )
        })

        describe('reset search criteria', () => {
          it('calls the API', async () => {
            jest.clearAllMocks()
            await wrapper.find('.test-click-clear-criteria').trigger('click')
            expect(apolloQueryMock).toBeCalledWith(
              expect.objectContaining({
                variables: {
                  searchText: '',
                  currentPage: 1,
                  pageSize: 25,
                  filters: {
                    byActivated: true,
                    byDeleted: false,
                  },
                },
              }),
            )
          })
        })
      })

      it('calls API when currentPage changes', async () => {
        await wrapper.setData({ currentPage: 2 })
        expect(apolloQueryMock).toBeCalledWith(
          expect.objectContaining({
            variables: {
              searchText: '',
              currentPage: 2,
              pageSize: 25,
              filters: {
                byActivated: true,
                byDeleted: false,
              },
            },
          }),
        )
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
