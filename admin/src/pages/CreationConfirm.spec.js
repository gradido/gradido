import { mount } from '@vue/test-utils'
import CreationConfirm from './CreationConfirm.vue'

const localVue = global.localVue

const storeCommitMock = jest.fn()

const mocks = {
  $store: {
    commit: storeCommitMock,
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
      it('commits resetOpenCreations to store', () => {
        expect(storeCommitMock).toBeCalledWith('resetOpenCreations')
      })

      it('commits openCreationsPlus to store', () => {
        expect(storeCommitMock).toBeCalledWith('openCreationsPlus', 5)
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
