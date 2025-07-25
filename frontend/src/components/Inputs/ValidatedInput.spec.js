import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ValidatedInput from '@/components/Inputs/ValidatedInput.vue'
import * as yup from 'yup'
import { BFormInvalidFeedback, BFormInput, BFormTextarea, BFormGroup } from 'bootstrap-vue-next'
import LabeledInput from '@/components/Inputs/LabeledInput.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    n: (n) => String(n),
  }),
}))

describe('ValidatedInput', () => {
  let wrapper
  const createWrapper = (props = {}) =>
    mount(ValidatedInput, {
      props: {
        label: 'Test Label',
        modelValue: '',
        name: 'testInput',
        rules: yup.string().required().min(3).default(''),
        ...props,
      },
      global: {
        mocks: {
          $t: (key) => key,
          $i18n: {
            locale: 'en',
          },
          $n: (n) => String(n),
        },
        components: {
          BFormInvalidFeedback,
          BFormInput,
          BFormTextarea,
          BFormGroup,
          LabeledInput,
        },
      },
    })

  beforeEach(() => {
    wrapper = createWrapper()
  })

  it('renders the label and input', () => {
    expect(wrapper.text()).toContain('Test Label')
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
  })

  it('starts with neutral validation state', () => {
    const input = wrapper.find('input')
    expect(input.classes()).not.toContain('is-valid')
    expect(input.classes()).not.toContain('is-invalid')
  })

  it('shows green border when value is valid before blur', async () => {
    await wrapper.setProps({ modelValue: 'validInput' })
    await wrapper.vm.$nextTick()
    const input = wrapper.find('input')
    expect(input.classes()).toContain('is-valid')
    expect(input.classes()).not.toContain('is-invalid')
  })

  it('does not show red border before blur even if invalid', async () => {
    await wrapper.setProps({ modelValue: 'a' })
    const input = wrapper.find('input')
    expect(input.classes()).not.toContain('is-invalid')
  })

  it('shows red border and error message after blur when input is invalid', async () => {
    await wrapper.setProps({ modelValue: 'a' })
    const input = wrapper.find('input')
    await input.trigger('blur')
    await wrapper.vm.$nextTick()
    expect(input.classes()).toContain('is-invalid')
    expect(wrapper.text()).toContain('this must be at least 3 characters')
  })

  it('emits update:modelValue on input', async () => {
    const input = wrapper.find('input')
    await input.setValue('hello')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
    const [value, name] = wrapper.emitted()['update:modelValue'][0]
    expect(value).toBe('hello')
    expect(name).toBe('testInput')
  })
})
