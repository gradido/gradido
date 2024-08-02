import { mount } from '@vue/test-utils'
import TimePicker from './TimePicker.vue'
import { describe, it, expect } from 'vitest'

describe('TimePicker', () => {
  it('updates timeValue on input and emits input event', async () => {
    const wrapper = mount(TimePicker, {
      propsData: {
        value: '12:34', // Set an initial value for testing
      },
    })

    const input = wrapper.find('input[type="text"]')

    // Simulate user input
    await input.setValue('23:45')

    // Check if timeValue is updated
    expect(wrapper.vm.timeValue).toBe('23:45')

    // Check if input event is emitted with updated value
    expect(wrapper.emitted().input).toBeTruthy()
    expect(wrapper.emitted().input[0]).toEqual(['23:45'])
  })

  it('validates and corrects time format on blur', async () => {
    const wrapper = mount(TimePicker)

    const input = wrapper.find('input[type="text"]')

    // Simulate user input
    await input.setValue('99:99')
    expect(wrapper.emitted().input).toBeTruthy()
    expect(wrapper.emitted().input[0]).toEqual(['99:99'])

    // Trigger blur event
    await input.trigger('blur')

    // Check if timeValue is corrected to valid format
    expect(wrapper.vm.timeValue).toBe('23:59') // Maximum allowed value for hours and minutes

    // Check if input event is emitted with corrected value
    expect(wrapper.emitted().input).toBeTruthy()
    expect(wrapper.emitted().input[1]).toEqual(['23:59'])
  })

  it('check handling of empty input', async () => {
    const wrapper = mount(TimePicker)
    const input = wrapper.find('input[type="text"]')

    // Simulate user input with non-numeric characters
    await input.setValue('')

    // Trigger blur event
    await input.trigger('blur')

    // Check if non-numeric characters are filtered out
    expect(wrapper.vm.timeValue).toBe('00:00')

    // Check if input event is emitted with filtered value
    expect(wrapper.emitted().input).toBeTruthy()
    expect(wrapper.emitted().input[1]).toEqual(['00:00'])
  })
})
