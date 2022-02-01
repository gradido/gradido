import { shallowMount } from '@vue/test-utils'
import Creation from './Creation.vue'

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
            },
          }),
        )
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

    describe('push item', () => {
      beforeEach(() => {
        wrapper.findComponent({ name: 'UserTable' }).vm.$emit('push-item', {
          userId: 2,
          firstName: 'Benjamin',
          lastName: 'Blümchen',
          email: 'benjamin@bluemchen.de',
          creation: [800, 600, 400],
          showDetails: false,
        })
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

      it('adds the pushed item to itemsMassCreation', () => {
        expect(wrapper.vm.itemsMassCreation).toEqual([
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

      it('updates userSelectedInMassCreation in store', () => {
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
    })

    describe('remove item', () => {
      beforeEach(async () => {
        await wrapper.findComponent({ name: 'UserTable' }).vm.$emit('push-item', {
          userId: 2,
          firstName: 'Benjamin',
          lastName: 'Blümchen',
          email: 'benjamin@bluemchen.de',
          creation: [800, 600, 400],
          showDetails: false,
        })
        await wrapper
          .findAllComponents({ name: 'UserTable' })
          .at(1)
          .vm.$emit('remove-item', {
            userId: 2,
            firstName: 'Benjamin',
            lastName: 'Blümchen',
            email: 'benjamin@bluemchen.de',
            creation: [800, 600, 400],
            showDetails: false,
          })
      })

      it('adds the removed item to itemsList', () => {
        expect(wrapper.vm.itemsList).toEqual([
          {
            userId: 2,
            firstName: 'Benjamin',
            lastName: 'Blümchen',
            email: 'benjamin@bluemchen.de',
            creation: [800, 600, 400],
            showDetails: false,
          },
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

      it('removes the item from itemsMassCreation', () => {
        expect(wrapper.vm.itemsMassCreation).toEqual([])
      })

      it('commits empty array as userSelectedInMassCreation', () => {
        expect(storeCommitMock).toBeCalledWith('setUserSelectedInMassCreation', [])
      })
    })

    describe('remove all bookmarks', () => {
      beforeEach(async () => {
        await wrapper.findComponent({ name: 'UserTable' }).vm.$emit('push-item', {
          userId: 2,
          firstName: 'Benjamin',
          lastName: 'Blümchen',
          email: 'benjamin@bluemchen.de',
          creation: [800, 600, 400],
          showDetails: false,
        })
        jest.clearAllMocks()
        wrapper.findComponent({ name: 'CreationFormular' }).vm.$emit('remove-all-bookmark')
      })

      it('removes all items from itemsMassCreation', () => {
        expect(wrapper.vm.itemsMassCreation).toEqual([])
      })

      it('commits empty array to userSelectedInMassCreation', () => {
        expect(storeCommitMock).toBeCalledWith('setUserSelectedInMassCreation', [])
      })

      it('calls searchUsers', () => {
        expect(apolloQueryMock).toBeCalled()
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
          },
        ]
        wrapper = Wrapper()
      })

      it('has only one item itemsList', () => {
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
    })

    describe('watchers', () => {
      beforeEach(() => {
        jest.clearAllMocks()
      })

      it('calls API when criteria changes', async () => {
        await wrapper.setData({ criteria: 'XX' })
        expect(apolloQueryMock).toBeCalledWith(
          expect.objectContaining({
            variables: {
              searchText: 'XX',
              currentPage: 1,
              pageSize: 25,
            },
          }),
        )
      })

      it('calls API when currentPage changes', async () => {
        await wrapper.setData({ currentPage: 2 })
        expect(apolloQueryMock).toBeCalledWith(
          expect.objectContaining({
            variables: {
              searchText: '',
              currentPage: 2,
              pageSize: 25,
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
        expect(toastErrorMock).toBeCalledWith('Ouch')
      })
    })
  })
})
