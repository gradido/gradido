import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TimePicker from './TimePicker.vue'

describe('TimePicker', () => {
  it('updates timeValue on input and emits update:modelValue event', async () => {
    const wrapper = mount(TimePicker, {
      props: {
        modelValue: '12:34', // Set an initial value for testing
      },
    })

    const input = wrapper.find('input[type="text"]')

    // Simulate user input
    await input.setValue('23:45')

    // Check if timeValue is updated
    expect(wrapper.vm.timeValue).toBe('23:45')

    // Check if update:modelValue event is emitted with updated value
    expect(wrapper.emitted('input')).toBeTruthy()
    expect(wrapper.emitted('input')[0]).toEqual(['23:45'])
  })

  it('validates and corrects time format on blur', async () => {
    const wrapper = mount(TimePicker)

    const input = wrapper.find('input[type="text"]')

    // Simulate user input
    await input.setValue('99:99')
    expect(wrapper.emitted('input')).toBeTruthy()
    expect(wrapper.emitted('input')[0]).toEqual(['99:99'])

    // Trigger blur event
    await input.trigger('blur')

    // Check if timeValue is corrected to valid format
    expect(wrapper.vm.timeValue).toBe('23:59') // Maximum allowed value for hours and minutes

    // Check if update:modelValue event is emitted with corrected value
    expect(wrapper.emitted('input')).toBeTruthy()
    expect(wrapper.emitted('input')[1]).toEqual(['23:59'])
  })

  it('checks handling of empty input', async () => {
    const wrapper = mount(TimePicker)
    const input = wrapper.find('input[type="text"]')

    // Simulate user input with empty string
    await input.setValue('')

    // Trigger blur event
    await input.trigger('blur')

    // Check if empty input is handled correctly
    expect(wrapper.vm.timeValue).toBe('00:00')

    // Check if update:modelValue event is emitted with default value
    expect(wrapper.emitted('input')).toBeTruthy()
    expect(wrapper.emitted('input')[1]).toEqual(['00:00'])
  })
})
