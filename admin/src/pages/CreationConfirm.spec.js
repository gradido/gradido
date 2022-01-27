import { mount } from '@vue/test-utils'
import CreationConfirm from './CreationConfirm.vue'
import { deletePendingCreation } from '../graphql/deletePendingCreation'
import { confirmPendingCreation } from '../graphql/confirmPendingCreation'

const localVue = global.localVue

const storeCommitMock = jest.fn()
const toastedErrorMock = jest.fn()
const toastedSuccessMock = jest.fn()
const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    getPendingCreations: [
      {
        id: 1,
        firstName: 'Bibi',
        lastName: 'Bloxberg',
        email: 'bibi@bloxberg.de',
        amount: 500,
        memo: 'Danke für alles',
        date: new Date(),
        moderator: 0,
      },
      {
        id: 2,
        firstName: 'Räuber',
        lastName: 'Hotzenplotz',
        email: 'raeuber@hotzenplotz.de',
        amount: 1000000,
        memo: 'Gut Ergattert',
        date: new Date(),
        moderator: 0,
      },
    ],
  },
})

const apolloMutateMock = jest.fn().mockResolvedValue({})

const mocks = {
  $t: jest.fn((t) => t),
  $store: {
    commit: storeCommitMock,
  },
  $apollo: {
    query: apolloQueryMock,
    mutate: apolloMutateMock,
  },
  $toasted: {
    error: toastedErrorMock,
    success: toastedSuccessMock,
  },
  $moment: jest.fn((value) => {
    return {
      format: jest.fn((format) => value),
    }
  }),
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

    it('has two pending creations', () => {
      expect(wrapper.vm.pendingCreations).toHaveLength(2)
    })

    describe('store', () => {
      it('commits resetOpenCreations to store', () => {
        expect(storeCommitMock).toBeCalledWith('resetOpenCreations')
      })
      it('commits setOpenCreations to store', () => {
        expect(storeCommitMock).toBeCalledWith('setOpenCreations', 2)
      })
    })

    describe('remove creation with success', () => {
      beforeEach(async () => {
        await wrapper.findComponent({ name: 'UserTable' }).vm.$emit('remove-creation', { id: 1 })
      })

      it('calls the deletePendingCreation mutation', () => {
        expect(apolloMutateMock).toBeCalledWith({
          mutation: deletePendingCreation,
          variables: { id: 1 },
        })
      })

      it('commits openCreationsMinus to store', () => {
        expect(storeCommitMock).toBeCalledWith('openCreationsMinus', 1)
      })

      it('toasts a success message', () => {
        expect(toastedSuccessMock).toBeCalledWith('creation_form.toasted_delete')
      })
    })

    describe('remove creation with error', () => {
      beforeEach(async () => {
        apolloMutateMock.mockRejectedValue({ message: 'Ouchhh!' })
        await wrapper.findComponent({ name: 'UserTable' }).vm.$emit('remove-creation', { id: 1 })
      })

      it('toasts an error message', () => {
        expect(toastedErrorMock).toBeCalledWith('Ouchhh!')
      })
    })

    describe('confirm creation with success', () => {
      beforeEach(async () => {
        apolloMutateMock.mockResolvedValue({})
        await wrapper.findComponent({ name: 'UserTable' }).vm.$emit('confirm-creation', { id: 2 })
      })

      it('calls the confirmPendingCreation mutation', () => {
        expect(apolloMutateMock).toBeCalledWith({
          mutation: confirmPendingCreation,
          variables: { id: 2 },
        })
      })

      it('commits openCreationsMinus to store', () => {
        expect(storeCommitMock).toBeCalledWith('openCreationsMinus', 1)
      })

      it('toasts a success message', () => {
        expect(toastedSuccessMock).toBeCalledWith('creation_form.toasted_created')
      })
    })

    describe('confirm creation with error', () => {
      beforeEach(async () => {
        apolloMutateMock.mockRejectedValue({ message: 'Ouchhh!' })
        await wrapper.findComponent({ name: 'UserTable' }).vm.$emit('confirm-creation', { id: 2 })
      })

      it('toasts an error message', () => {
        expect(toastedErrorMock).toBeCalledWith('Ouchhh!')
      })
    })

    describe('server response for get pending creations is error', () => {
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
  })
})
