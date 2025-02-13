import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import InputTextarea from './InputTextarea'
import { useField } from 'vee-validate'
import { BFormGroup, BFormInvalidFeedback, BFormTextarea } from 'bootstrap-vue-next'

vi.mock('vee-validate', () => ({
  useField: vi.fn(),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

describe('InputTextarea', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(InputTextarea, {
      props: {
        rules: {},
        name: 'input-field-name',
        label: 'input-field-label',
        placeholder: 'input-field-placeholder',
        ...props,
      },
      global: {
        components: {
          BFormGroup,
          BFormTextarea,
          BFormInvalidFeedback,
        },
      },
    })
  }

  beforeEach(() => {
    vi.mocked(useField).mockReturnValue({
      value: '',
      errorMessage: '',
      meta: { valid: true },
    })
    wrapper = createWrapper()
  })

  it('renders the component InputTextarea', () => {
    expect(wrapper.find('[data-test="input-textarea"]').exists()).toBe(true)
  })

  it('has a textarea field', () => {
    expect(wrapper.findComponent({ name: 'BFormTextarea' }).exists()).toBe(true)
  })

  describe('properties', () => {
    it('has the correct id', () => {
      const textarea = wrapper.findComponent({ name: 'BFormTextarea' })
      expect(textarea.attributes('id')).toBe('input-field-name-input-field')
    })

    it('has the correct placeholder', () => {
      const textarea = wrapper.findComponent({ name: 'BFormTextarea' })
      expect(textarea.attributes('placeholder')).toBe('input-field-placeholder')
    })

    it('has the correct label', () => {
      const label = wrapper.find('label')
      expect(label.text()).toBe('input-field-label')
    })

    it('has the correct label-for attribute', () => {
      const label = wrapper.find('label')
      expect(label.attributes('for')).toBe('input-field-name-input-field')
    })
  })

  describe('input value changes', () => {
    it('updates the model value when input changes', async () => {
      const wrapper = mount(InputTextarea, {
        props: {
          rules: {},
          name: 'input-field-name',
          label: 'input-field-label',
          placeholder: 'input-field-placeholder',
        },
        global: {
          components: {
            BFormGroup,
            BFormInvalidFeedback,
            BFormTextarea,
          },
        },
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('New Text')

      expect(wrapper.vm.currentValue).toBe('New Text')
    })
  })

  describe('disabled state', () => {
    it('disables the textarea when disabled prop is true', async () => {
      await wrapper.setProps({ disabled: true })
      const textarea = wrapper.findComponent({ name: 'BFormTextarea' })
      expect(textarea.attributes('disabled')).toBeDefined()
    })
  })

  it('shows error message when there is an error', async () => {
    vi.mocked(useField).mockReturnValue({
      value: '',
      errorMessage: 'This field is required',
      meta: { valid: false },
    })

    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const errorFeedback = wrapper.findComponent({ name: 'BFormInvalidFeedback' })
    expect(errorFeedback.exists()).toBe(true)
    expect(errorFeedback.text()).toBe('This field is required')
  })
})
