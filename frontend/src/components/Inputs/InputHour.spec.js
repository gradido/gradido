import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import InputHour from './InputHour.vue'
import { useField } from 'vee-validate'
import { BFormGroup, BFormInput, BFormInvalidFeedback } from 'bootstrap-vue-next'

// Mock vee-validate
vi.mock('vee-validate', () => ({
  useField: vi.fn(),
}))

describe('InputHour', () => {
  let wrapper

  const createWrapper = (propsData = {}) => {
    return mount(InputHour, {
      props: {
        rules: {},
        name: 'input-field-name',
        label: 'input-field-label',
        placeholder: 'input-field-placeholder',
        validMaxTime: 25,
        ...propsData,
      },
      global: {
        components: {
          BFormGroup,
          BFormInput,
          BFormInvalidFeedback,
        },
        mocks: {
          $t: (t) => t,
          $i18n: {
            locale: () => 'en',
          },
          $n: (n) => String(n),
          $route: {
            params: {},
          },
        },
      },
    })
  }

  beforeEach(() => {
    useField.mockReturnValue({
      value: ref(0),
      errorMessage: ref(''),
      meta: ref({ valid: true }),
    })
    wrapper = createWrapper()
  })

  it('renders the component input-hour', () => {
    expect(wrapper.find('div.input-hour').exists()).toBe(true)
  })

  it('has an input field', () => {
    expect(wrapper.findComponent({ name: 'BFormInput' }).exists()).toBe(true)
  })

  describe('properties', () => {
    it('passes correct props to BFormInput', () => {
      const input = wrapper.findComponent({ name: 'BFormInput' })
      console.log(input.props())
      expect(input.props()).toMatchObject({
        id: 'input-field-name-input-field',
        modelValue: 0,
        name: 'input-field-name',
        placeholder: 'input-field-placeholder',
        type: 'number',
        state: true,
        step: '0.01',
        min: '0',
        max: 25,
      })
    })

    it('passes correct props to BFormGroup', () => {
      const formGroup = wrapper.findComponent({ name: 'BFormGroup' })
      expect(formGroup.props()).toMatchObject({
        label: 'input-field-label',
        labelFor: 'input-field-name-input-field',
      })
    })
  })

  describe('input value changes', () => {
    it('updates currentValue when input changes', async () => {
      await wrapper.findComponent({ name: 'BFormInput' }).vm.$emit('update:modelValue', 12)
      expect(wrapper.vm.currentValue).toBe(12)
    })
  })

  describe('error handling', () => {
    it('displays error message when present', async () => {
      useField.mockReturnValue({
        value: ref(0),
        errorMessage: ref('Error message'),
        meta: ref({ valid: false }),
      })
      wrapper = createWrapper()

      expect(wrapper.findComponent({ name: 'BFormInvalidFeedback' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'BFormInvalidFeedback' }).text()).toBe('Error message')
    })
  })
})
