// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { VariantIcon } from './VariantIcon'

// Each icon used here is stubbed under the name unplugin-icons gives the component it imports
// (`bi-balloon-heart`), so a misspelt import finds no stub.
const draw = (icon) =>
  mount(VariantIcon, {
    props: { icon },
    global: {
      stubs: {
        BiBalloonHeart: { template: '<svg data-test="icon-balloon-heart" />' },
        BiLink45deg: { template: '<svg data-test="icon-link" />' },
      },
    },
  })

describe('VariantIcon', () => {
  // The icon of a thank-you greeting, from the set the wallet takes its other icons from.
  it('shows the heart-shaped balloon for a thank-you greeting', () => {
    const balloon = draw('balloon-heart').find('[data-test="icon-balloon-heart"]')

    expect(balloon.exists()).toBe(true)
    expect(balloon.classes()).toContain('icon-variant')
  })

  it('shows it for no other icon', () => {
    const wrapper = draw('link45deg')

    expect(wrapper.find('[data-test="icon-balloon-heart"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="icon-link"]').exists()).toBe(true)
  })
})
