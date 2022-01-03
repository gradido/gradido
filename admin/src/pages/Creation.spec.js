import { shallowMount } from '@vue/test-utils'
import Creation from './Creation.vue'
import Vue from 'vue'

const localVue = global.localVue

const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    searchUsers: [
      {
        id: 1,
        firstName: 'Bibi',
        lastName: 'Bloxberg',
        email: 'bibi@bloxberg.de',
        creation: [200, 400, 600],
      },
      {
        id: 2,
        firstName: 'Benjamin',
        lastName: 'Blümchen',
        email: 'benjamin@bluemchen.de',
        creation: [800, 600, 400],
      },
    ],
  },
})

const toastErrorMock = jest.fn()

const mocks = {
  $t: jest.fn((t) => t),
  $apollo: {
    query: apolloQueryMock,
  },
  $toasted: {
    error: toastErrorMock,
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
            id: 1,
            firstName: 'Bibi',
            lastName: 'Bloxberg',
            email: 'bibi@bloxberg.de',
            creation: [200, 400, 600],
            showDetails: false,
          },
          {
            id: 2,
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
              id: 2,
              firstName: 'Benjamin',
              lastName: 'Blümchen',
              email: 'benjamin@bluemchen.de',
              creation: [800, 600, 400],
              showDetails: false,
            },
            'push',
          )
        })

        it('removes the pushed item from itemsList', () => {
          expect(wrapper.vm.itemsList).toEqual([
            {
              id: 1,
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
              id: 2,
              firstName: 'Benjamin',
              lastName: 'Blümchen',
              email: 'benjamin@bluemchen.de',
              creation: [800, 600, 400],
              showDetails: false,
            },
          ])
        })

        describe('remove', () => {
          beforeEach(() => {
            wrapper.findComponent({ name: 'UserTable' }).vm.$emit(
              'update-item',
              {
                id: 2,
                firstName: 'Benjamin',
                lastName: 'Blümchen',
                email: 'benjamin@bluemchen.de',
                creation: [800, 600, 400],
                showDetails: false,
              },
              'remove',
            )
          })

          it('removes the item from itemsMassCreation', () => {
            expect(wrapper.vm.itemsMassCreation).toEqual([])
          })

          it('adds the item to itemsList', () => {
            expect(wrapper.vm.itemsList).toEqual([
              {
                id: 1,
                firstName: 'Bibi',
                lastName: 'Bloxberg',
                email: 'bibi@bloxberg.de',
                creation: [200, 400, 600],
                showDetails: false,
              },
              {
                id: 2,
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
            id: 2,
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

      it('removes all items from itemsMassCreation', () => {
        expect(wrapper.vm.itemsMassCreation).toEqual([])
      })

      it('adds all items to itemsList', () => {
        expect(wrapper.vm.itemsList).toHaveLength(2)
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
