// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AppAvatar from './AppAvatar.vue'
import { AVATAR_COLOR_PALETTE, avatarPaletteEntry } from '@/utils/avatarColor'

const circleStyle = (wrapper) => wrapper.find('.app-avatar').attributes('style') ?? ''

// The DOM reports colours as rgb(), so the palette's hex has to be converted rather than
// matched literally -- a substring check against '#2B6CB0' passes for nothing at all and
// would have made every assertion below green by accident.
const asRgb = (hex) => {
  const [, r, g, b] = /^#(\w\w)(\w\w)(\w\w)$/.exec(hex)
  return `rgb(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)})`
}

describe('AppAvatar', () => {
  describe('the colour seed', () => {
    // ★ The condition under which adding this prop was harmless: a caller that does not
    // pass it sees exactly what it saw before. Every call site in the tree except the two
    // that show other members relies on this, and none of them is otherwise tested.
    it('colours from what it shows when no seed is given', () => {
      const wrapper = mount(AppAvatar, { props: { initials: 'BH', name: 'Bernd Hueckstaedt' } })
      expect(circleStyle(wrapper)).toContain(asRgb(avatarPaletteEntry('BH').bg))
    })

    // The point of the prop: letters and colour may come from different places, so that a
    // circle can read "BE" from the alias while keeping the colour "BH" always gave it.
    it('colours from the seed while showing something else', () => {
      const wrapper = mount(AppAvatar, { props: { initials: 'BE', colorSeed: 'BH' } })
      const style = circleStyle(wrapper)
      expect(wrapper.text()).toBe('BE')
      expect(style).toContain(asRgb(avatarPaletteEntry('BH').bg))
      // ...and demonstrably not the colour the letters alone would have produced, or the
      // assertion above could pass by coincidence.
      expect(avatarPaletteEntry('BE').bg).not.toBe(avatarPaletteEntry('BH').bg)
      expect(style).not.toContain(asRgb(avatarPaletteEntry('BE').bg))
    })
  })

  // The server-computed digit (NU-017), for members whose names this browser no longer
  // receives. It must win over the seed -- the seed cannot be built for those members --
  // and anything invalid must fall back to the seed path instead of inventing a colour.
  describe('the colour index from the server', () => {
    it('wins over the seed', () => {
      const wrapper = mount(AppAvatar, {
        props: { initials: 'BE', colorSeed: 'BH', colorIndex: 3 },
      })
      const style = circleStyle(wrapper)
      expect(style).toContain(asRgb(AVATAR_COLOR_PALETTE[3].bg))
      expect(AVATAR_COLOR_PALETTE[3].bg).not.toBe(avatarPaletteEntry('BH').bg)
      expect(style).not.toContain(asRgb(avatarPaletteEntry('BH').bg))
    })

    it('falls back to the seed when the index is not a palette index', () => {
      for (const colorIndex of [null, -1, 10, 3.5]) {
        const wrapper = mount(AppAvatar, {
          props: { initials: 'BE', colorSeed: 'BH', colorIndex },
        })
        expect(circleStyle(wrapper)).toContain(asRgb(avatarPaletteEntry('BH').bg))
      }
    })
  })

  describe('with a picture', () => {
    it('shows the picture instead of the letters', () => {
      const wrapper = mount(AppAvatar, {
        props: { initials: 'BE', src: 'data:image/jpeg;base64,AAAA' },
      })
      const image = wrapper.find('img.app-avatar-image')
      expect(image.exists()).toBe(true)
      expect(image.attributes('src')).toBe('data:image/jpeg;base64,AAAA')
      expect(wrapper.find('span').exists()).toBe(false)
    })

    // A photograph brings its own colours; a coloured disc behind it would only show at
    // the corners while the picture loads.
    it('drops the coloured disc behind it', () => {
      const wrapper = mount(AppAvatar, {
        props: { initials: 'BE', colorSeed: 'BH', src: 'data:image/jpeg;base64,AAAA' },
      })
      expect(circleStyle(wrapper)).not.toContain(asRgb(avatarPaletteEntry('BH').bg))
    })

    it('falls back to the letters when there is no picture', () => {
      const wrapper = mount(AppAvatar, { props: { initials: 'BE', src: '' } })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toBe('BE')
    })
  })

  it('takes the size it is given', () => {
    const wrapper = mount(AppAvatar, { props: { size: 64, initials: 'BE' } })
    expect(circleStyle(wrapper)).toContain('width: 64px')
    expect(circleStyle(wrapper)).toContain('height: 64px')
  })
})
