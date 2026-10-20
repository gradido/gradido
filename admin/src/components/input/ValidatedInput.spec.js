// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { BFormGroup, BFormInput, BFormInvalidFeedback, BFormTextarea } from 'bootstrap-vue-next'
import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import { number, string } from 'yup'
import { ValidatedInput } from './ValidatedInput'

const i18n = () =>
  createI18n({ legacy: false, locale: 'de', missingWarn: false, fallbackWarn: false })

describe('ValidatedInput', () => {
  const createWrapper = (props = {}, attrs = {}) =>
    mount(ValidatedInput, {
      props: { label: 'Alias', name: 'alias', rules: string().min(3).max(32).required(), ...props },
      attrs,
      global: {
        plugins: [i18n()],
        stubs: { BFormGroup, BFormInput, BFormTextarea, BFormInvalidFeedback },
      },
    })

  it('labels and names the field', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('label').text()).toBe('Alias')
    expect(wrapper.find('input').attributes('name')).toBe('alias')
    expect(wrapper.classes()).toContain('input-alias')
  })

  it('hands the limits of the rules, the language and the default to the field', () => {
    const wrapper = createWrapper({ rules: number().min(1).max(5).default(2), modelValue: 3 })
    const input = wrapper.find('input')
    expect(input.attributes('min')).toBe('1')
    expect(input.attributes('max')).toBe('5')
    expect(input.attributes('locale')).toBe('de')
    expect(input.attributes('reset-value')).toBe('2')
  })

  it('marks the field required unless the rules make it optional', () => {
    expect(createWrapper().find('input').attributes('required')).toBeDefined()
    const optional = createWrapper({ rules: string().optional() })
    expect(optional.find('input').attributes('required')).toBeUndefined()
  })

  it('shows a valid value as valid, without a message', () => {
    const wrapper = createWrapper({ modelValue: 'good-alias' })
    expect(wrapper.find('input').classes()).toContain('is-valid')
    expect(wrapper.find('.invalid-feedback').exists()).toBe(false)
  })

  it('shows an invalid value as invalid, with the message of the rules', () => {
    const wrapper = createWrapper({ modelValue: 'ab' })
    expect(wrapper.find('input').classes()).toContain('is-invalid')
    expect(wrapper.find('.invalid-feedback').text()).toBe('this must be at least 3 characters')
  })

  it('shows an empty required field as invalid, but without a message', () => {
    const wrapper = createWrapper({ modelValue: '' })
    expect(wrapper.find('input').classes()).toContain('is-invalid')
    expect(wrapper.find('.invalid-feedback').exists()).toBe(false)
  })

  it('shows an empty optional field neither valid nor invalid', () => {
    const wrapper = createWrapper({ modelValue: '', rules: string().optional() })
    const classes = wrapper.find('input').classes()
    expect(classes).not.toContain('is-valid')
    expect(classes).not.toContain('is-invalid')
  })

  it('reports a typed value with its name and whether the value it was given is valid', async () => {
    const wrapper = createWrapper({ modelValue: 'good-alias' })
    await wrapper.find('input').setValue('ab')
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['ab', 'alias', true])
  })

  it('shows a new value it is given', async () => {
    const wrapper = createWrapper({ modelValue: 'good-alias' })
    await wrapper.setProps({ modelValue: 'other-alias' })
    expect(wrapper.find('input').element.value).toBe('other-alias')
  })

  it('hands further attributes to the field', () => {
    const wrapper = createWrapper({}, { textarea: 'true', placeholder: 'type here' })
    expect(wrapper.find('textarea').attributes('placeholder')).toBe('type here')
  })
})
