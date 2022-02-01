import { shallowMount } from '@vue/test-utils'
import Creation from './Creation.vue'
import Vue from 'vue'

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
        },
        {
          userId: 2,
          firstName: 'Benjamin',
          lastName: 'Blümchen',
          email: 'benjamin@bluemchen.de',
          creation: [800, 600, 400],
        },
      ],
    },
  },
})

const toastErrorMock = jest.fn()
const storeCommitMock = jest.fn()

const mocks = {
  $t: jest.fn((t) => t),
  $apollo: {
    query: apolloQueryMock,
  },
  $toasted: {
    error: toastErrorMock,
  },
  $moment: jest.fn(() => {
    return {
      format: jest.fn((m) => m),
      subtract: jest.fn(() => {
        return {
          format: jest.fn((m) => m),
        }
      }),
    }
  }),
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
    return shallowMount(Creation, { localVue, mocks })
  }

  describe('shallowMount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.creation', () => {
      expect(wrapper.find('div.creation').exists()).toBeTruthy()
    })

    describe('apollo returns user array', () => {
      it('calls the searchUser query', () => {
        expect(apolloQueryMock).toBeCalled()
      })

      it('sets the data of itemsList', () => {
        expect(wrapper.vm.itemsList).toEqual([
          {
            userId: 1,
            firstName: 'Bibi',
            lastName: 'Bloxberg',
            email: 'bibi@bloxberg.de',
            creation: [200, 400, 600],
            showDetails: false,
          },
          {
            userId: 2,
            firstName: 'Benjamin',
            lastName: 'Blümchen',
            email: 'benjamin@bluemchen.de',
            creation: [800, 600, 400],
            showDetails: false,
          },
        ])
      })
    })

    describe('update item', () => {
      beforeEach(() => {
        jest.clearAllMocks()
      })

      describe('push', () => {
        beforeEach(() => {
          wrapper.findComponent({ name: 'UserTable' }).vm.$emit(
            'update-item',
            {
              userId: 2,
              firstName: 'Benjamin',
              lastName: 'Blümchen',
              email: 'benjamin@bluemchen.de',
              creation: [800, 600, 400],
              showDetails: false,
            },
            'push',
          )
        })
        beforeEach(() => {
          mocks.$store.state.setUserSelectedInMassCreation = [
            {
              userId: 2,
              firstName: 'Benjamin',
              lastName: 'Blümchen',
              email: 'benjamin@bluemchen.de',
              creation: [800, 600, 400],
              showDetails: false,
            },
          ]
        })
        it('removes the pushed item from itemsList', () => {
          expect(wrapper.vm.itemsList).toEqual([
            {
              userId: 1,
              firstName: 'Bibi',
              lastName: 'Bloxberg',
              email: 'bibi@bloxberg.de',
              creation: [200, 400, 600],
              showDetails: false,
            },
          ])
        })

        it('adds the pushed item to userSelectedInMassCreation', () => {
          expect(storeCommitMock).toBeCalledWith('userSelectedInMassCreation', [
            {
              userId: 2,
              firstName: 'Benjamin',
              lastName: 'Blümchen',
              email: 'benjamin@bluemchen.de',
              creation: [800, 600, 400],
              showDetails: false,
            },
          ])
          // expect(wrapper.vm.userSelectedInMassCreation).toEqual([
          //   {
          //     userId: 2,
          //     firstName: 'Benjamin',
          //     lastName: 'Blümchen',
          //     email: 'benjamin@bluemchen.de',
          //     creation: [800, 600, 400],
          //     showDetails: false,
          //   },
          // ])
        })

        describe('remove', () => {
          beforeEach(() => {
            wrapper.findComponent({ name: 'UserTable' }).vm.$emit(
              'update-item',
              {
                userId: 2,
                firstName: 'Benjamin',
                lastName: 'Blümchen',
                email: 'benjamin@bluemchen.de',
                creation: [800, 600, 400],
                showDetails: false,
              },
              'remove',
            )
          })

          it('removes the item from userSelectedInMassCreation', () => {
            expect(storeCommitMock).toBeCalledWith('setUserSelectedInMassCreation', [
              {
                userId: 2,
                firstName: 'Benjamin',
                lastName: 'Blümchen',
                email: 'benjamin@bluemchen.de',
                creation: [800, 600, 400],
                showDetails: false,
              },
            ])
          })

          it('adds the item to itemsList', () => {
            expect(wrapper.vm.itemsList).toEqual([
              {
                userId: 1,
                firstName: 'Bibi',
                lastName: 'Bloxberg',
                email: 'bibi@bloxberg.de',
                creation: [200, 400, 600],
                showDetails: false,
              },
              {
                userId: 2,
                firstName: 'Benjamin',
                lastName: 'Blümchen',
                email: 'benjamin@bluemchen.de',
                creation: [800, 600, 400],
                showDetails: false,
              },
            ])
          })
        })
      })

      describe('error', () => {
        const consoleErrorMock = jest.fn()
        const warnHandler = Vue.config.warnHandler

        beforeEach(() => {
          Vue.config.warnHandler = (w) => {}
          // eslint-disable-next-line no-console
          console.error = consoleErrorMock
          wrapper.findComponent({ name: 'UserTable' }).vm.$emit('update-item', {}, 'no-rule')
        })

        afterEach(() => {
          Vue.config.warnHandler = warnHandler
        })

        it('throws an error', () => {
          expect(consoleErrorMock).toBeCalledWith(expect.objectContaining({ message: 'no-rule' }))
        })
      })
    })

    describe('remove all bookmarks', () => {
      beforeEach(async () => {
        await wrapper.findComponent({ name: 'UserTable' }).vm.$emit(
          'update-item',
          {
            userId: 2,
            firstName: 'Benjamin',
            lastName: 'Blümchen',
            email: 'benjamin@bluemchen.de',
            creation: [800, 600, 400],
            showDetails: false,
          },
          'push',
        )
        wrapper.findComponent({ name: 'CreationFormular' }).vm.$emit('remove-all-bookmark')
      })

      it('removes all items from userSelectedInMassCreation', () => {
        expect(storeCommitMock).toBeCalledWith('setUserSelectedInMassCreation', [])
      })

      it('adds all items to itemsList', () => {
        expect(wrapper.vm.itemsList).toHaveLength(2)
      })
    })

    describe('watchers', () => {
      beforeEach(() => {
        jest.clearAllMocks()
      })

      it('calls API when criteria changes', async () => {
        await wrapper.setData({ criteria: 'XX' })
        expect(apolloQueryMock).toBeCalled()
      })

      it('calls API when currentPage changes', async () => {
        await wrapper.setData({ currentPage: 2 })
        expect(apolloQueryMock).toBeCalled()
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
