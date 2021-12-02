import { mount } from '@vue/test-utils'
import CreationConfirm from './CreationConfirm.vue'

const localVue = global.localVue

const storeCommitMock = jest.fn()
const toastedErrorMock = jest.fn()
const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    getPendingCreations: [
      {
        firstName: 'Bibi',
        lastName: 'Bloxberg',
        email: 'bibi@bloxberg.de',
        amount: 500,
        memo: 'Danke für alles',
        date: new Date(),
        moderator: 0,
      },
      {
        firstName: 'Räuber',
        lastName: 'Hotzenplotz',
        email: 'raeuber@hotzenplotz.de',
        amount: 1000000,
        memo: 'Gut Ergatert',
        date: new Date(),
        moderator: 0,
      },
    ],
  },
})

const mocks = {
  $store: {
    commit: storeCommitMock,
  },
  $apollo: {
    query: apolloQueryMock,
  },
  $toasted: {
    error: toastedErrorMock,
  },
}

describe('CreationConfirm', () => {
  let wrapper

  const Wrapper = () => {
    return mount(CreationConfirm, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.creation-confirm', () => {
      expect(wrapper.find('div.creation-confirm').exists()).toBeTruthy()
    })

    describe('store', () => {
      it('commits openCreationsPlus to store', () => {
        expect(storeCommitMock).toBeCalledWith('openCreationsPlus', 2)
      })
    })

    describe('server response is error', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        apolloQueryMock.mockRejectedValue({
          message: 'Ouch!',
        })
        wrapper = Wrapper()
      })

      it('toast an error message', () => {
        expect(toastedErrorMock).toBeCalledWith('Ouch!')
      })
    })

    describe('confirm creation', () => {
      beforeEach(async () => {
        await wrapper
          .findComponent({ name: 'UserTable' })
          .vm.$emit('remove-confirm-result', 1, 'remove')
      })

      it('commits openCreationsMinus to store', () => {
        expect(storeCommitMock).toBeCalledWith('openCreationsMinus', 1)
      })
    })
  })
})
