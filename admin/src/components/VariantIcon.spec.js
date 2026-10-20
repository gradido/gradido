// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { VariantIcon } from './VariantIcon'

// The colour reaches the icon as a CSS variable on the icon itself, read by its class.
const colourOf = (wrapper) => {
  const { style } = wrapper.find('svg').element
  return Array.from({ length: style.length }, (_, i) => style.getPropertyValue(style.item(i)))
}

describe('VariantIcon', () => {
  it('shows the icon it is named for', () => {
    const wrapper = mount(VariantIcon, { props: { icon: 'x-circle' } })
    expect(wrapper.findAll('svg')).toHaveLength(1)
  })

  it('shows nothing for a name it does not know', () => {
    const wrapper = mount(VariantIcon, { props: { icon: 'unknown' } })
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('colours the icon in its variant', () => {
    const wrapper = mount(VariantIcon, { props: { icon: 'check', variant: 'danger' } })
    expect(colourOf(wrapper)).toEqual(['var(--bs-danger'])
  })

  it('colours the icon in success when no variant is given', () => {
    const wrapper = mount(VariantIcon, { props: { icon: 'person-fill' } })
    expect(colourOf(wrapper)).toEqual(['var(--bs-success'])
  })
})
