import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import UserGMSLocationFormat from './UserGMSLocationFormat.vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useMutation } from '@vue/apollo-composable'
import { useAppToast } from '@/composables/useToast'

// Mock dependencies
vi.mock('vue-i18n')
vi.mock('vuex')
vi.mock('@vue/apollo-composable')
vi.mock('@/composables/useToast')
vi.mock('bootstrap-vue-next', () => ({
  BDropdown: {
    name: 'BDropdown',
    template: '<div><slot name="button-content"></slot><slot></slot></div>',
  },
  BDropdownItem: {
    name: 'BDropdownItem',
    template: '<div class="dropdown-item"><slot></slot></div>',
  },
}))

describe('UserGMSLocationFormat', () => {
  let wrapper
  const mockStore = {
    state: {
      gmsPublishLocation: 'GMS_LOCATION_TYPE_APPROXIMATE',
    },
    commit: vi.fn(),
  }
  const mockMutate = vi.fn()
  const mockToastSuccess = vi.fn()
  const mockToastError = vi.fn()

  beforeEach(() => {
    useI18n.mockReturnValue({
      t: (key) => key,
    })
    useStore.mockReturnValue(mockStore)
    useMutation.mockReturnValue({ mutate: mockMutate })
    useAppToast.mockReturnValue({
      toastSuccess: mockToastSuccess,
      toastError: mockToastError,
    })

    wrapper = mount(UserGMSLocationFormat)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the correct dropdown options', () => {
    const dropdownItems = wrapper.findAll('.dropdown-item')
    expect(dropdownItems.length).toBe(2)

    const labels = dropdownItems.map((item) => item.text())
    expect(labels).toEqual([
      'settings.GMS.publish-location.exact',
      'settings.GMS.publish-location.approximate',
    ])
  })

  it.skip('updates selected option on click', async () => {
    mockMutate.mockResolvedValue({})

    const dropdownItem = wrapper.findAll('.dropdown-item').at(1) // Click the second item
    await dropdownItem.trigger('click')

    expect(mockMutate).toHaveBeenCalledWith({
      gmsPublishLocation: 'GMS_LOCATION_TYPE_APPROXIMATE'
    })
    expect(mockToastSuccess).toHaveBeenCalledWith('settings.GMS.publish-location.updated')
    expect(mockStore.commit).toHaveBeenCalledWith(
      'gmsPublishLocation',
      'GMS_LOCATION_TYPE_APPROXIMATE',
    )
    // Check for emitted event
    expect(wrapper.emitted('gmsPublishLocation')).toBeTruthy()
    expect(wrapper.emitted('gmsPublishLocation')[0]).toEqual(['GMS_LOCATION_TYPE_APPROXIMATE'])
  })

  it('does not update when clicking on already selected option', async () => {
    const dropdownItem = wrapper.findAll('.dropdown-item').at(1) // Click the second item (which is already selected)
    await dropdownItem.trigger('click')

    expect(mockMutate).not.toHaveBeenCalled()
    expect(wrapper.emitted('gmsPublishLocation')).toBeFalsy()
  })

  it('handles error when updating', async () => {
    mockMutate.mockRejectedValue(new Error('Ouch'))

    const dropdownItem = wrapper.findAll('.dropdown-item').at(0) // Click the first item
    await dropdownItem.trigger('click')

    expect(mockToastError).toHaveBeenCalledWith('Ouch')
  })
})
