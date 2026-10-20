import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useI18n } from 'vue-i18n'
import { UserQuery } from './UserQuery'

vi.mock('vue-i18n')

describe('UserQuery', () => {
  const mockT = vi.fn((key) => key)
  let wrapper

  beforeEach(() => {
    useI18n.mockReturnValue({ t: mockT })

    wrapper = mount(UserQuery, {
      props: {
        modelValue: '',
        placeholder: '',
      },
    })
  })

  it('renders the component', () => {
    expect(wrapper.find('.test-input-criteria').exists()).toBe(true)
    expect(wrapper.find('.test-click-clear-criteria').exists()).toBe(true)
  })

  it('uses default placeholder when not provided', async () => {
    expect(mockT).toHaveBeenCalledWith('user_search')
    expect(wrapper.find('.test-input-criteria').attributes('placeholder')).toBe('user_search')
  })

  it('uses provided placeholder', async () => {
    await wrapper.setProps({ placeholder: 'Custom Placeholder' })
    expect(wrapper.find('.test-input-criteria').attributes('placeholder')).toBe(
      'Custom Placeholder',
    )
  })

  it('shows the new value when modelValue prop changes', async () => {
    await wrapper.setProps({ modelValue: 'New Value' })
    expect(wrapper.find('.test-input-criteria').element.value).toBe('New Value')
  })

  it('emits update:modelValue event when currentValue changes', async () => {
    const input = wrapper.find('.test-input-criteria')
    await input.setValue('New Input')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['New Input'])
  })

  it('clears the input when clear button is clicked', async () => {
    await wrapper.setProps({ modelValue: 'Initial Value' })
    const clearButton = wrapper.find('.test-click-clear-criteria')
    await clearButton.trigger('click')
    expect(wrapper.find('.test-input-criteria').element.value).toBe('')
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([''])
  })

  it('handles edge case: empty string input', async () => {
    await wrapper.setProps({ modelValue: 'Initial Value' })
    const input = wrapper.find('.test-input-criteria')
    await input.setValue('')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.find('input[type="text"]').element.value).toBe('')
  })

  it('handles edge case: input with only spaces', async () => {
    const input = wrapper.find('.test-input-criteria')
    await input.setValue('   ')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['   '])
  })

  it('does not mutate the original modelValue prop', async () => {
    const originalValue = 'Original'
    await wrapper.setProps({ modelValue: originalValue })
    const input = wrapper.find('.test-input-criteria')
    await input.setValue('New Value')
    expect(wrapper.props('modelValue')).toBe(originalValue)
  })
})
