// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { BFormGroup, BFormInput, BFormTextarea } from 'bootstrap-vue-next'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { LabeledInput } from './LabeledInput'

describe('LabeledInput', () => {
  const createWrapper = (props = {}, attrs = {}, slots = {}) =>
    mount(LabeledInput, {
      props: { label: 'The label', name: 'alias', ...props },
      attrs,
      slots,
      global: { stubs: { BFormGroup, BFormInput, BFormTextarea } },
    })

  it('wraps the field in a class named after it, and labels it', () => {
    const wrapper = createWrapper()
    expect(wrapper.classes()).toEqual(['input-alias'])
    expect(wrapper.find('label').text()).toBe('The label')
    expect(wrapper.find('label').attributes('for')).toBe('alias-input-field')
  })

  it('names the input field and gives it the id the label points to', () => {
    const wrapper = createWrapper()
    const input = wrapper.find('input')
    expect(input.attributes('id')).toBe('alias-input-field')
    expect(input.attributes('name')).toBe('alias')
  })

  it('hands further attributes to the field, not to the wrapper', () => {
    const wrapper = createWrapper({}, { placeholder: 'type here', class: 'mb-3' })
    expect(wrapper.find('input').attributes('placeholder')).toBe('type here')
    expect(wrapper.attributes('placeholder')).toBeUndefined()
    expect(wrapper.classes()).toEqual(['input-alias'])
    expect(wrapper.find('input').classes()).toContain('mb-3')
  })

  it('does not let an id or name among the attributes override its own', () => {
    const wrapper = createWrapper({}, { id: 'other-id', name: 'other-name' })
    expect(wrapper.find('input').attributes('id')).toBe('alias-input-field')
    expect(wrapper.find('input').attributes('name')).toBe('alias')
  })

  it('shows the value it is given and reports a typed one', async () => {
    const wrapper = createWrapper({ modelValue: 'start' })
    expect(wrapper.find('input').element.value).toBe('start')
    await wrapper.find('input').setValue('typed')
    expect(wrapper.emitted('update:modelValue')).toEqual([['typed']])
  })

  it('keeps a typed value when nobody binds it', async () => {
    const wrapper = createWrapper()
    await wrapper.find('input').setValue('typed')
    expect(wrapper.find('input').element.value).toBe('typed')
    expect(wrapper.emitted('update:modelValue')).toEqual([['typed']])
  })

  it('follows a bound value, not the typed one', async () => {
    const wrapper = createWrapper({ modelValue: 'bound', 'onUpdate:modelValue': () => undefined })
    await wrapper.find('input').setValue('typed')
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['typed'])
    await wrapper.setProps({ modelValue: 'next' })
    expect(wrapper.find('input').element.value).toBe('next')
  })

  it('renders a textarea of four rows when asked to', async () => {
    const wrapper = createWrapper({ textarea: true, modelValue: 'start' })
    expect(wrapper.find('input').exists()).toBe(false)
    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('id')).toBe('alias-input-field')
    expect(textarea.attributes('name')).toBe('alias')
    expect(textarea.attributes('rows')).toBe('4')
    expect(textarea.classes()).toContain('form-control')
    const props = wrapper.findComponent(BFormTextarea).props()
    expect([props.rows, props.maxRows, props.noResize]).toEqual([4, 4, true])
    // no prop of BFormTextarea: it lands on the element as it is written
    expect(textarea.attributes('trim')).toBe('')
    await textarea.setValue('typed')
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['typed'])
  })

  it('renders what it is given below the field', () => {
    const wrapper = createWrapper({}, {}, { default: () => h('p', { class: 'below' }, 'hint') })
    expect(wrapper.find('.below').text()).toBe('hint')
  })
})
