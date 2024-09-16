import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import DeletedUserFormular from './DeletedUserFormular.vue'
import { deleteUser } from '../graphql/deleteUser'
import { unDeleteUser } from '../graphql/unDeleteUser'
import { useApolloClient } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { createStore } from 'vuex'
import { BButton } from 'bootstrap-vue-next'

vi.mock('@vue/apollo-composable')
vi.mock('vue-i18n')
vi.mock('@/composables/useToast')

const createVuexStore = (moderatorId = 0) => {
  return createStore({
    state: {
      moderator: {
        id: moderatorId,
        name: 'test moderator',
      },
    },
  })
}

describe('DeletedUserFormular', () => {
  let wrapper
  let store
  const mockMutate = vi.fn()
  const mockT = vi.fn((key) => key)
  const mockToastError = vi.fn()
  const date = new Date()

  beforeEach(() => {
    store = createVuexStore()

    useApolloClient.mockReturnValue({
      client: {
        mutate: mockMutate,
      },
    })

    useI18n.mockReturnValue({
      t: mockT,
    })

    useAppToast.mockReturnValue({
      toastError: mockToastError,
    })

    wrapper = mount(DeletedUserFormular, {
      props: {
        item: {
          userId: 1,
          deletedAt: null,
        },
      },
      global: {
        plugins: [store],
        mocks: {
          $t: mockT,
        },
        stubs: {
          BButton,
        },
      },
    })
  })

  it('renders the component', () => {
    expect(wrapper.find('.deleted-user-formular').exists()).toBe(true)
  })

  describe('when user is not a moderator', () => {
    it('shows delete button when user is not deleted', () => {
      expect(wrapper.find('button').text()).toBe('delete_user')
    })

    it('shows undelete button when user is deleted', async () => {
      await wrapper.setProps({
        item: {
          userId: 1,
          deletedAt: date,
        },
      })
      expect(wrapper.find('button').text()).toBe('undelete_user')
    })

    it('emits show-delete-modal when delete button is clicked', async () => {
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('show-delete-modal')).toBeTruthy()
    })

    it('emits show-undelete-modal when undelete button is clicked', async () => {
      await wrapper.setProps({
        item: {
          userId: 1,
          deletedAt: date,
        },
      })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('show-undelete-modal')).toBeTruthy()
    })
  })

  describe('when user is a moderator', () => {
    beforeEach(() => {
      store = createVuexStore(1)
      wrapper = mount(DeletedUserFormular, {
        props: {
          item: {
            userId: 1,
            deletedAt: null,
          },
        },
        global: {
          plugins: [store],
          mocks: {
            $t: mockT,
          },
        },
      })
    })

    it('shows removeNotSelf message', () => {
      expect(wrapper.text()).toBe('removeNotSelf')
    })

    it('does not show any button', () => {
      expect(wrapper.find('button').exists()).toBe(false)
    })
  })

  describe('deleteUserMutation', () => {
    beforeEach(() => {
      mockMutate.mockResolvedValue({
        data: {
          deleteUser: date,
        },
      })
    })

    it('calls the mutation with correct parameters', async () => {
      await wrapper.vm.deleteUserMutation()
      expect(mockMutate).toHaveBeenCalledWith({
        mutation: deleteUser,
        variables: {
          userId: 1,
        },
      })
    })

    it('emits update-deleted-at with correct data on success', async () => {
      await wrapper.vm.deleteUserMutation()
      expect(wrapper.emitted('update-deleted-at')).toEqual([
        [
          {
            userId: 1,
            deletedAt: date,
          },
        ],
      ])
    })

    it('calls toastError on failure', async () => {
      const error = new Error('Delete failed')
      mockMutate.mockRejectedValueOnce(error)
      await wrapper.vm.deleteUserMutation()
      expect(mockToastError).toHaveBeenCalledWith('Delete failed')
    })
  })

  describe('undeleteUserMutation', () => {
    beforeEach(() => {
      mockMutate.mockResolvedValue({
        data: {
          unDeleteUser: null,
        },
      })
    })

    it('calls the mutation with correct parameters', async () => {
      await wrapper.vm.undeleteUserMutation()
      expect(mockMutate).toHaveBeenCalledWith({
        mutation: unDeleteUser,
        variables: {
          userId: 1,
        },
      })
    })

    it('emits update-deleted-at with correct data on success', async () => {
      await wrapper.vm.undeleteUserMutation()
      expect(wrapper.emitted('update-deleted-at')).toEqual([
        [
          {
            userId: 1,
            deletedAt: null,
          },
        ],
      ])
    })

    it('calls toastError on failure', async () => {
      const error = new Error('Undelete failed')
      mockMutate.mockRejectedValueOnce(error)
      await wrapper.vm.undeleteUserMutation()
      expect(mockToastError).toHaveBeenCalledWith('Undelete failed')
    })
  })
})
