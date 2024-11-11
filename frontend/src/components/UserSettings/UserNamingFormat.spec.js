import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import UserNamingFormat from './UserNamingFormat.vue'
import { useStore } from 'vuex'
import { useMutation } from '@vue/apollo-composable'
import { useAppToast } from '@/composables/useToast'

vi.mock('vuex')
vi.mock('@vue/apollo-composable')
vi.mock('@/composables/useToast')
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

const mockStore = {
  commit: vi.fn(),
}

const mockUpdateUserData = vi.fn()
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()

describe('UserNamingFormat', () => {
  let wrapper

  beforeEach(() => {
    useStore.mockReturnValue(mockStore)
    useMutation.mockReturnValue({ mutate: mockUpdateUserData })
    useAppToast.mockReturnValue({ toastSuccess: mockToastSuccess, toastError: mockToastError })

    wrapper = mount(UserNamingFormat, {
      global: {
        stubs: {
          BDropdown: {
            template: `
              <div>
                <slot />
              </div>
            `,
          },
          BDropdownItem: true,
        },
      },
      props: {
        initialValue: 'PUBLISH_NAME_ALIAS_OR_INITALS',
        attrName: 'gmsPublishName',
        successMessage: 'success message',
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the correct dropdown options', () => {
    const dropdownItems = wrapper.findAllComponents({ name: 'BDropdownItem' })
    expect(dropdownItems.length).toBe(5)

    const expectedLabels = [
      'settings.publish-name.alias-or-initials',
      'settings.publish-name.initials',
      'settings.publish-name.first',
      'settings.publish-name.first-initial',
      'settings.publish-name.name-full',
    ]

    dropdownItems.forEach((item, index) => {
      expect(item.attributes('value')).toContain(wrapper.vm.dropdownOptions[index].value)
      expect(item.attributes('title')).toContain(expectedLabels[index])
    })
  })

  it('updates selected option on click', async () => {
    const dropdownItems = wrapper.findAllComponents({ name: 'BDropdownItem' })
    await dropdownItems[3].trigger('click')

    expect(mockUpdateUserData).toHaveBeenCalledWith({
      gmsPublishName: 'PUBLISH_NAME_FIRST_INITIAL',
    })
    expect(mockToastSuccess).toHaveBeenCalledWith('success message')
    expect(mockStore.commit).toHaveBeenCalledWith('gmsPublishName', 'PUBLISH_NAME_FIRST_INITIAL')
    expect(wrapper.emitted('valueChanged')).toBeTruthy()
    expect(wrapper.emitted('valueChanged')[0]).toEqual(['PUBLISH_NAME_FIRST_INITIAL'])
  })

  it('does not update when clicking on already selected option', async () => {
    const dropdownItems = wrapper.findAllComponents({ name: 'BDropdownItem' })
    await dropdownItems[0].trigger('click')

    expect(mockUpdateUserData).not.toHaveBeenCalled()
    expect(mockToastSuccess).not.toHaveBeenCalled()
    expect(mockStore.commit).not.toHaveBeenCalled()
    expect(wrapper.emitted('valueChanged')).toBeFalsy()
  })

  it('handles update error', async () => {
    mockUpdateUserData.mockRejectedValueOnce(new Error('Update failed'))
    const dropdownItems = wrapper.findAllComponents({ name: 'BDropdownItem' })
    await dropdownItems[2].trigger('click')

    expect(mockToastError).toHaveBeenCalledWith('Update failed')
    expect(mockStore.commit).not.toHaveBeenCalled()
    expect(wrapper.emitted('valueChanged')).toBeFalsy()
  })

  it('computes selectedOptionLabel correctly', async () => {
    expect(wrapper.vm.selectedOptionLabel).toBe('settings.publish-name.alias-or-initials')

    wrapper.vm.selectedOption = 'PUBLISH_NAME_FULL'
    await nextTick()
    expect(wrapper.vm.selectedOptionLabel).toBe('settings.publish-name.name-full')
  })
})
