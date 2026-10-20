import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { TimePicker } from './TimePicker'

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

    // Check if the field shows the value
    expect(input.element.value).toBe('23:45')

    // Check if update:modelValue event is emitted with updated value
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['23:45'])
  })

  it('keeps only digits and colons, also when that leaves the value it had', async () => {
    const wrapper = mount(TimePicker, {
      props: {
        modelValue: '12:34',
      },
    })

    const input = wrapper.find('input[type="text"]')

    // Filtered, the input is the value the field already holds -- it must not keep the letter
    await input.setValue('12:34x')

    expect(input.element.value).toBe('12:34')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['12:34'])
  })

  it('validates and corrects time format on blur', async () => {
    const wrapper = mount(TimePicker, {
      props: {
        modelValue: '99:99', // Set an invalid value initially
      },
    })

    const input = wrapper.find('input[type="text"]')

    // Simulate user input
    await input.setValue('99:99')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['99:99'])

    // Trigger blur event
    await input.trigger('blur')

    // Check if the field is corrected to valid format
    expect(input.element.value).toBe('23:59') // Maximum allowed value for hours and minutes

    // Check if update:modelValue event is emitted with corrected value
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[1]).toEqual(['23:59'])
  })

  it('checks handling of empty input', async () => {
    const wrapper = mount(TimePicker, {
      props: {
        modelValue: '', // Set initial empty value
      },
    })
    const input = wrapper.find('input[type="text"]')

    // Simulate user input with empty string
    await input.setValue('')

    // Trigger blur event
    await input.trigger('blur')

    // Check if empty input is handled correctly
    expect(input.element.value).toBe('00:00')

    // Check if update:modelValue event is emitted with default value
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[1]).toEqual(['00:00'])
  })
})
