// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { CollapseIcon } from './CollapseIcon'

describe('CollapseIcon', () => {
  it('points up while the details are open', () => {
    const wrapper = mount(CollapseIcon, { props: { visible: true } })
    expect(wrapper.find('svg').classes()).toEqual(['text-black', 'h2'])
  })

  it('points down while they are closed', () => {
    const wrapper = mount(CollapseIcon, { props: { visible: false } })
    expect(wrapper.find('svg').classes()).toEqual(['text-muted', 'h2'])
  })
})
