import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ChangeUserRoleFormular from './ChangeUserRoleFormular.vue'
import { useMutation } from '@vue/apollo-composable'
import { useStore } from 'vuex'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}))

vi.mock('vuex', () => ({
  useStore: vi.fn(() => ({
    state: {
      moderator: {
        id: 0,
        name: 'test moderator',
        roles: ['ADMIN'],
      },
    },
  })),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
  }),
}))

const mockBFormSelect = {
  name: 'BFormSelect',
  template: '<select data-testid="mock-bformselect"><slot></slot></select>',
  props: ['modelValue', 'options'],
}
const mockBButton = {
  name: 'BButton',
  template: '<button data-testid="mock-bbutton"><slot></slot></button>',
}

describe('ChangeUserRoleFormular', () => {
  let wrapper
  let propsData

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createWrapper = () => {
    return mount(ChangeUserRoleFormular, {
      props: propsData,
      global: {
        stubs: {
          BFormSelect: mockBFormSelect,
          BButton: mockBButton,
        },
        mocks: {
          $t: (key) => key,
        },
      },
    })
  }

  describe('DOM elements', () => {
    beforeEach(() => {
      propsData = {
        item: {
          userId: 1,
          roles: [],
        },
      }
      wrapper = createWrapper()
    })

    it('has a DIV element with the class change-user-role-formular', () => {
      expect(wrapper.find('.change-user-role-formular').exists()).toBe(true)
    })
  })

  describe('change own role', () => {
    beforeEach(() => {
      propsData = {
        item: {
          userId: 0,
          roles: ['ADMIN'],
        },
      }
      wrapper = createWrapper()
    })

    it('has the text that you cannot change own role', () => {
      expect(wrapper.text()).toContain('userRole.notChangeYourSelf')
    })

    it('has no role select', () => {
      expect(wrapper.find('[data-testid="mock-bformselect"]').exists()).toBe(false)
    })

    it('has no button', () => {
      expect(wrapper.find('[data-testid="mock-bbutton"]').exists()).toBe(false)
    })
  })

  describe("change other user's role", () => {
    beforeEach(() => {
      propsData = {
        item: {
          userId: 1,
          roles: [],
        },
      }
      wrapper = createWrapper()
    })

    it('has no text that you cannot change own role', () => {
      expect(wrapper.text()).not.toContain('userRole.notChangeYourSelf')
    })

    it('has the select label', () => {
      expect(wrapper.text()).toContain('userRole.selectLabel')
    })

    it('has a select', () => {
      expect(wrapper.find('[data-testid="mock-bformselect"]').exists()).toBe(true)
    })

    it('has "change_user_role" button', () => {
      const button = wrapper.find('[data-testid="mock-bbutton"]')
      expect(button.exists()).toBe(true)
      expect(button.text()).toBe('change_user_role')
    })

    describe('user has role "usual user"', () => {
      beforeEach(() => {
        propsData.item.roles = ['USER']
        wrapper = createWrapper()
      })

      it('has selected option set to "USER"', () => {
        expect(wrapper.vm.roleSelected).toBe('USER')
      })

      describe('change select to new role "MODERATOR"', () => {
        beforeEach(async () => {
          wrapper.vm.roleSelected = 'MODERATOR'
          await wrapper.vm.$nextTick()
        })

        it('has "change_user_role" button enabled', () => {
          const button = wrapper.find('[data-testid="mock-bbutton"]')
          expect(button.attributes('disabled')).toBeFalsy()
        })

        describe('clicking the "change_user_role" button', () => {
          beforeEach(async () => {
            await wrapper.find('[data-testid="mock-bbutton"]').trigger('click')
          })

          it('emits "show-modal" event', () => {
            expect(wrapper.emitted('show-modal')).toBeTruthy()
          })
        })
      })
    })
  })

  describe('authenticated user is MODERATOR', () => {
    beforeEach(() => {
      vi.mocked(useStore).mockReturnValue({
        state: {
          moderator: {
            id: 0,
            name: 'test moderator',
            roles: ['MODERATOR'],
          },
        },
      })
      propsData = {
        item: {
          userId: 1,
          roles: [],
        },
      }
      wrapper = createWrapper()
    })

    it('has no role select', () => {
      expect(wrapper.find('[data-testid="mock-bformselect"]').exists()).toBe(false)
    })

    it('has no button', () => {
      expect(wrapper.find('[data-testid="mock-bbutton"]').exists()).toBe(false)
    })
  })

  describe('updateUserRole method', () => {
    let mockMutate

    beforeEach(() => {
      mockMutate = vi.fn()
      useMutation.mockReturnValue({
        mutate: mockMutate,
      })

      propsData = {
        item: {
          userId: 1,
          roles: ['USER'],
        },
      }
      wrapper = createWrapper()
    })

    it('calls setUserRole mutation and emits update-roles on success', async () => {
      mockMutate.mockResolvedValue({ data: { setUserRole: 'MODERATOR' } })

      await wrapper.vm.updateUserRole('MODERATOR', 'USER')

      expect(mockMutate).toHaveBeenCalledWith({
        userId: 1,
        role: 'MODERATOR',
      })
      expect(wrapper.emitted('update-roles')).toBeTruthy()
      expect(wrapper.emitted('update-roles')[0]).toEqual([
        {
          userId: 1,
          roles: ['MODERATOR'],
        },
      ])
    })

    it('handles error and resets role on failure', async () => {
      mockMutate.mockRejectedValue(new Error('API Error'))

      await wrapper.vm.updateUserRole('MODERATOR', 'USER')

      expect(mockMutate).toHaveBeenCalled()
      expect(wrapper.vm.roleSelected).toBe('USER')
      expect(wrapper.emitted('update-roles')).toBeFalsy()
    })
  })
})
