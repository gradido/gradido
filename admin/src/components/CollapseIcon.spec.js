// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { CollapseIcon } from './CollapseIcon'

describe('CollapseIcon', () => {
  it('points up while the details are open', () => {
    const wrapper = mount(CollapseIcon, { props: { visible: true } })
    expect(wrapper.find('svg').classes()).toEqual(['text-body', 'h2'])
  })

  it('points down while they are closed', () => {
    const wrapper = mount(CollapseIcon, { props: { visible: false } })
    expect(wrapper.find('svg').classes()).toEqual(['text-muted', 'h2'])
  })

  // Black would vanish on the dark page; the colour of the words follows the mode (#212529 in the
  // light one, a hair off the black of before).
  it('the arrow takes the body colour', () => {
    const svg = mount(CollapseIcon, { props: { visible: true } }).find('svg')
    expect(svg.classes()).toContain('text-body')
    expect(svg.classes()).not.toContain('text-black')
  })
})
