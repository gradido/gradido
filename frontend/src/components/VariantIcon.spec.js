// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import VariantIcon from './VariantIcon.vue'

const draw = (icon) =>
  mount(VariantIcon, {
    props: { icon },
    global: { stubs: { IBiLink45deg: { template: '<svg data-test="icon-link" />' } } },
  })

describe('VariantIcon', () => {
  // The one icon drawn here rather than taken from a set: the bunch of flowers of a greeting.
  it('draws the bunch of flowers: three blossoms and their stems', () => {
    const bouquet = draw('bouquet').find('[data-test="icon-bouquet"]')

    expect(bouquet.findAll('circle')).toHaveLength(3)
    expect(bouquet.find('path').exists()).toBe(true)
    // Held out, not standing: the whole drawing is turned, blossoms and stems together.
    const turned = bouquet.find('g')
    expect(turned.attributes('transform')).toBe('rotate(22 8 8.5)')
    expect(turned.findAll('circle')).toHaveLength(3)
    expect(turned.find('path').exists()).toBe(true)
    expect(bouquet.attributes('aria-hidden')).toBe('true')
    expect(bouquet.classes()).toContain('icon-variant')
  })

  it('draws it for no other icon', () => {
    const wrapper = draw('link45deg')

    expect(wrapper.find('[data-test="icon-bouquet"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="icon-link"]').exists()).toBe(true)
  })
})
