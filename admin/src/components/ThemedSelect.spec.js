// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { ThemedSelect } from './ThemedSelect'

const options = [
  { value: 'a', text: 'Apple' },
  { value: 'b', text: 'Banana' },
  { value: 'c', text: 'Cherry', disabled: true },
]

describe('ThemedSelect', () => {
  const createWrapper = (props = {}) =>
    mount(ThemedSelect, { props: { options, ...props }, attachTo: document.body })

  const toggle = (wrapper) => wrapper.find('.themed-select-toggle')
  const items = (wrapper) => wrapper.findAll('.dropdown-item')

  it('shows the text of the chosen option on the toggle', () => {
    const wrapper = createWrapper({ modelValue: 'b' })
    expect(toggle(wrapper).text()).toBe('Banana')
    expect(wrapper.find('.themed-select').classes()).not.toContain('themed-select-placeholder')
  })

  it('shows the placeholder, marked as such, when no option matches', () => {
    const wrapper = createWrapper({ modelValue: 'x', placeholder: 'Pick one' })
    expect(toggle(wrapper).text()).toBe('Pick one')
    expect(wrapper.find('.themed-select').classes()).toContain('themed-select-placeholder')
  })

  it('lists every option and marks the chosen one', () => {
    const wrapper = createWrapper({ modelValue: 'a' })
    expect(items(wrapper).map((item) => item.text())).toEqual(['Apple', 'Banana', 'Cherry'])
    expect(items(wrapper)[0].classes()).toContain('active')
    expect(items(wrapper)[1].classes()).not.toContain('active')
    expect(items(wrapper)[2].classes()).toContain('disabled')
  })

  it('takes plain values as options', () => {
    const wrapper = createWrapper({ options: [1, 2], modelValue: 2 })
    expect(items(wrapper).map((item) => item.text())).toEqual(['1', '2'])
    expect(toggle(wrapper).text()).toBe('2')
  })

  it('reports a newly chosen option', async () => {
    const wrapper = createWrapper({ modelValue: 'a' })
    await items(wrapper)[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
    expect(wrapper.emitted('change')).toEqual([['b']])
  })

  it('reports nothing for the option already chosen, or a disabled one', async () => {
    const wrapper = createWrapper({ modelValue: 'a' })
    await items(wrapper)[0].trigger('click')
    await items(wrapper)[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('passes disabled and data-test on', () => {
    const wrapper = createWrapper({ disabled: true, dataTest: 'group' })
    expect(toggle(wrapper).attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-test="group"]').exists()).toBe(true)
  })
})
