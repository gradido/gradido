import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ChangeUserRoleFormular from './ChangeUserRoleFormular.vue'
import { useMutation } from '@vue/apollo-composable'
import { useStore } from 'vuex'
import { setCreationAllowed as setCreationAllowedMutation } from '../graphql/setCreationAllowed'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
  })),
  useQuery: vi.fn(() => ({
    result: { value: undefined },
    onResult: vi.fn(),
    onError: vi.fn(),
    refetch: vi.fn(),
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
// Driven the way an administrator drives it: by flipping.
const mockBFormCheckbox = {
  name: 'BFormCheckbox',
  props: ['modelValue', 'switch', 'disabled'],
  emits: ['update:modelValue'],
  template:
    '<label><input type="checkbox" data-testid="mock-switch" :checked="modelValue" :disabled="disabled" @change="$emit(`update:modelValue`, $event.target.checked)" /><slot></slot></label>',
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
          BFormCheckbox: mockBFormCheckbox,
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

    describe('visibility scope field', () => {
      // A KI-Moderator has the moderator rights plus Crea, so the group visibility scope
      // must be settable for them exactly like for a plain moderator.
      const scopeShownFor = async (role) => {
        wrapper.vm.roleSelected = role
        await wrapper.vm.$nextTick()
        return wrapper.find('[data-test="moderator-scope"]').exists()
      }

      it('is offered for a moderator', async () => {
        expect(await scopeShownFor('MODERATOR')).toBe(true)
      })

      it('is offered for a KI-Moderator (MODERATOR_AI)', async () => {
        expect(await scopeShownFor('MODERATOR_AI')).toBe(true)
      })

      it('is not offered for a usual user', async () => {
        expect(await scopeShownFor('USER')).toBe(false)
      })
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

  // ES-021: the "may create" switch next to the roles.
  describe('the may-create switch', () => {
    let creationMutate
    const asAdmin = () =>
      vi.mocked(useStore).mockReturnValue({
        state: { moderator: { id: 0, name: 'test moderator', roles: ['ADMIN'] } },
      })
    const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

    beforeEach(() => {
      creationMutate = vi.fn()
      // The roles mutation and this one share useMutation; tell them apart by document.
      useMutation.mockImplementation((document) => ({
        mutate: document === setCreationAllowedMutation ? creationMutate : vi.fn(),
      }))
      asAdmin()
    })

    it('shows an administrator the switch, on for an account that may create', () => {
      propsData = { item: { userId: 1, roles: [], creationAllowed: true } }
      wrapper = createWrapper()
      const box = wrapper.find('[data-testid="mock-switch"]')
      expect(box.exists()).toBe(true)
      expect(box.element.checked).toBe(true)
      expect(wrapper.find('[data-test="creation-allowed-readonly"]').exists()).toBe(false)
    })

    it('shows it off for a project account, and on where the row does not say', () => {
      propsData = { item: { userId: 1, roles: [], creationAllowed: false } }
      expect(createWrapper().find('[data-testid="mock-switch"]').element.checked).toBe(false)
      propsData = { item: { userId: 1, roles: [] } }
      expect(createWrapper().find('[data-testid="mock-switch"]').element.checked).toBe(true)
    })

    it('shows a moderator where the switch stands, without a switch', () => {
      vi.mocked(useStore).mockReturnValue({
        state: { moderator: { id: 0, name: 'test moderator', roles: ['MODERATOR'] } },
      })
      propsData = { item: { userId: 1, roles: [], creationAllowed: false } }
      wrapper = createWrapper()
      expect(wrapper.find('[data-testid="mock-switch"]').exists()).toBe(false)
      const readonly = wrapper.find('[data-test="creation-allowed-readonly"]')
      expect(readonly.exists()).toBe(true)
      expect(readonly.text()).toContain('userRole.creationAllowed.no')
    })

    it('switches creation off, tells the table and stays off', async () => {
      creationMutate.mockResolvedValue({ data: { setCreationAllowed: false } })
      propsData = { item: { userId: 7, roles: [], creationAllowed: true } }
      wrapper = createWrapper()
      await wrapper.find('[data-testid="mock-switch"]').setValue(false)
      await flush()
      expect(creationMutate).toHaveBeenCalledWith({ userId: 7, allowed: false })
      expect(wrapper.emitted('update-creation-allowed')[0]).toEqual([
        { userId: 7, creationAllowed: false },
      ])
      expect(wrapper.find('[data-testid="mock-switch"]').element.checked).toBe(false)
    })

    it('switches it back on the same way', async () => {
      creationMutate.mockResolvedValue({ data: { setCreationAllowed: true } })
      propsData = { item: { userId: 7, roles: [], creationAllowed: false } }
      wrapper = createWrapper()
      await wrapper.find('[data-testid="mock-switch"]').setValue(true)
      await flush()
      expect(creationMutate).toHaveBeenCalledWith({ userId: 7, allowed: true })
      expect(wrapper.find('[data-testid="mock-switch"]').element.checked).toBe(true)
    })

    it('sends one request however often the switch is flipped while the first is out', async () => {
      let release
      creationMutate.mockImplementation(() => new Promise((resolve) => (release = resolve)))
      propsData = { item: { userId: 7, roles: [], creationAllowed: true } }
      wrapper = createWrapper()
      const box = wrapper.find('[data-testid="mock-switch"]')
      await box.setValue(false)
      expect(box.attributes('disabled')).toBeDefined()
      await wrapper.vm.saveCreationAllowed(true)
      expect(creationMutate).toHaveBeenCalledTimes(1)
      release({ data: { setCreationAllowed: false } })
      await flush()
      expect(box.attributes('disabled')).toBeUndefined()
      expect(wrapper.emitted('update-creation-allowed')).toHaveLength(1)
    })

    it('springs back where the server refuses', async () => {
      creationMutate.mockRejectedValue(new Error('401 Unauthorized'))
      propsData = { item: { userId: 7, roles: [], creationAllowed: true } }
      wrapper = createWrapper()
      await wrapper.find('[data-testid="mock-switch"]').setValue(false)
      await flush()
      expect(wrapper.emitted('update-creation-allowed')).toBeFalsy()
      expect(wrapper.find('[data-testid="mock-switch"]').element.checked).toBe(true)
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
