import { useMutation } from '@vue/apollo-composable'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAdminStore } from '@/store/useAdminStore'
import { setCreationAllowed as setCreationAllowedMutation } from '../graphql/setCreationAllowed'
import { ChangeUserRoleFormular } from './ChangeUserRoleFormular'

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

vi.mock('@/store/useAdminStore', () => ({
  useAdminStore: vi.fn(() => ({
    moderator: {
      gradidoID: 'moderator-gid',
      communityUuid: 'home',
      name: 'test moderator',
      role: 'ADMIN',
    },
  })),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
  }),
}))

// Driven the way an administrator drives it: by choosing an option.
const mockBFormSelect = {
  name: 'BFormSelect',
  template:
    '<select data-testid="mock-bformselect" :value="modelValue" @change="$emit(`update:modelValue`, $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.text }}</option></select>',
  props: ['modelValue', 'options'],
  emits: ['update:modelValue'],
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
          ThemedSelect: true,
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
          role: null,
        },
      }
      wrapper = createWrapper()
    })

    it('has a DIV element with the class change-user-role-formular', () => {
      expect(wrapper.find('.change-user-role-formular').exists()).toBe(true)
    })

    // Its surface is the one of the card it stands in, which a dark mode can turn. On a phone it
    // has half its padding, as the other forms of an opened member.
    it('the card has no fixed white ground', () => {
      const card = wrapper.find('.change-user-role-formular > div')
      expect(card.classes()).toEqual(expect.arrayContaining(['shadow', 'p-2', 'p-lg-3', 'rounded']))
      expect(card.classes()).not.toContain('bg-white')
    })
  })

  describe('change own role', () => {
    beforeEach(() => {
      propsData = {
        item: {
          userId: 0,
          gradidoID: 'moderator-gid',
          communityUuid: 'home',
          role: 'ADMIN',
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
          role: null,
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
        await wrapper.find('[data-testid="mock-bformselect"]').setValue(role)
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
        propsData.item.role = null
        wrapper = createWrapper()
      })

      it('has selected option set to "USER"', () => {
        expect(wrapper.find('[data-testid="mock-bformselect"]').element.value).toBe('USER')
      })

      it('offers the four roles', () => {
        expect(
          wrapper
            .find('[data-testid="mock-bformselect"]')
            .findAll('option')
            .map((option) => option.element.value),
        ).toEqual(['USER', 'MODERATOR', 'MODERATOR_AI', 'ADMIN'])
      })

      describe('change select to new role "MODERATOR"', () => {
        beforeEach(async () => {
          await wrapper.find('[data-testid="mock-bformselect"]').setValue('MODERATOR')
        })

        it('has "change_user_role" button enabled', () => {
          const button = wrapper.find('[data-testid="mock-bbutton"]')
          expect(button.attributes('disabled')).toBeUndefined()
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
      vi.mocked(useAdminStore).mockReturnValue({
        moderator: {
          gradidoID: 'moderator-gid',
          communityUuid: 'home',
          name: 'test moderator',
          role: 'MODERATOR',
        },
      })
      propsData = {
        item: {
          userId: 1,
          role: null,
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

    // ⚠️ Meant to name the member's role; it looks it up with `currentRole.value` on the
    // unwrapped string and never finds it. Pinned as it is.
    it('shows an empty line where the role would be', () => {
      expect(wrapper.find('.m-3.mb-4').text()).toBe('')
    })
  })

  // ES-021: the "may create" switch next to the roles.
  describe('the may-create switch', () => {
    let creationMutate
    const asAdmin = () =>
      vi.mocked(useAdminStore).mockReturnValue({
        moderator: {
          gradidoID: 'moderator-gid',
          communityUuid: 'home',
          name: 'test moderator',
          role: 'ADMIN',
        },
      })
    const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

    beforeEach(() => {
      creationMutate = vi.fn()
      // The role mutation and this one share useMutation; tell them apart by document.
      useMutation.mockImplementation((document) => ({
        mutate: document === setCreationAllowedMutation ? creationMutate : vi.fn(),
      }))
      asAdmin()
    })

    it('shows an administrator the switch, on for an account that may create', () => {
      propsData = { item: { userId: 1, role: null, creationAllowed: true } }
      wrapper = createWrapper()
      const box = wrapper.find('[data-testid="mock-switch"]')
      expect(box.exists()).toBe(true)
      expect(box.element.checked).toBe(true)
      expect(wrapper.find('[data-test="creation-allowed-readonly"]').exists()).toBe(false)
    })

    it('shows it off for a project account, and on where the row does not say', () => {
      propsData = { item: { userId: 1, role: null, creationAllowed: false } }
      expect(createWrapper().find('[data-testid="mock-switch"]').element.checked).toBe(false)
      propsData = { item: { userId: 1, role: null } }
      expect(createWrapper().find('[data-testid="mock-switch"]').element.checked).toBe(true)
    })

    it('shows a moderator where the switch stands, without a switch', () => {
      vi.mocked(useAdminStore).mockReturnValue({
        moderator: {
          gradidoID: 'moderator-gid',
          communityUuid: 'home',
          name: 'test moderator',
          role: 'MODERATOR',
        },
      })
      propsData = { item: { userId: 1, role: null, creationAllowed: false } }
      wrapper = createWrapper()
      expect(wrapper.find('[data-testid="mock-switch"]').exists()).toBe(false)
      const readonly = wrapper.find('[data-test="creation-allowed-readonly"]')
      expect(readonly.exists()).toBe(true)
      expect(readonly.text()).toContain('userRole.creationAllowed.no')
    })

    it('switches creation off, tells the table and stays off', async () => {
      creationMutate.mockResolvedValue({ data: { setCreationAllowed: false } })
      propsData = { item: { userId: 7, role: null, creationAllowed: true } }
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
      propsData = { item: { userId: 7, role: null, creationAllowed: false } }
      wrapper = createWrapper()
      await wrapper.find('[data-testid="mock-switch"]').setValue(true)
      await flush()
      expect(creationMutate).toHaveBeenCalledWith({ userId: 7, allowed: true })
      expect(wrapper.find('[data-testid="mock-switch"]').element.checked).toBe(true)
    })

    it('sends one request however often the switch is flipped while the first is out', async () => {
      let release
      creationMutate.mockImplementation(() => new Promise((resolve) => (release = resolve)))
      propsData = { item: { userId: 7, role: null, creationAllowed: true } }
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
      propsData = { item: { userId: 7, role: null, creationAllowed: true } }
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
          role: null,
        },
      }
      wrapper = createWrapper()
    })

    it('calls setUserRole mutation and emits update-role on success', async () => {
      mockMutate.mockResolvedValue({ data: { setUserRole: 'MODERATOR' } })

      await wrapper.vm.updateUserRole('MODERATOR', 'USER')

      expect(mockMutate).toHaveBeenCalledWith({
        userId: 1,
        role: 'MODERATOR',
      })
      expect(wrapper.emitted('update-role')).toBeTruthy()
      expect(wrapper.emitted('update-role')[0]).toEqual([
        {
          userId: 1,
          role: 'MODERATOR',
        },
      ])
    })

    it('sends null, not USER, when the role is taken away', async () => {
      propsData.item.role = 'MODERATOR'
      wrapper = createWrapper()
      mockMutate.mockResolvedValue({ data: { setUserRole: null } })

      await wrapper.vm.updateUserRole('USER', 'MODERATOR')

      expect(mockMutate).toHaveBeenCalledWith({
        userId: 1,
        role: null,
      })
      expect(wrapper.emitted('update-role')[0]).toEqual([
        {
          userId: 1,
          role: null,
        },
      ])
    })

    it('handles error and resets role on failure', async () => {
      mockMutate.mockRejectedValue(new Error('API Error'))
      const select = wrapper.find('[data-testid="mock-bformselect"]')
      await select.setValue('MODERATOR')

      await wrapper.vm.updateUserRole('MODERATOR', 'USER')
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockMutate).toHaveBeenCalled()
      expect(select.element.value).toBe('USER')
      expect(wrapper.emitted('update-role')).toBeFalsy()
    })
  })
})
