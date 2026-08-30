// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
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

  /**
   * ⛔ The crash that predates this delivery: a deleted author's message arrives with no
   * name at all, and `default: ''` does NOT catch that -- Vue fills a default only for an
   * ABSENT prop, never for an explicit null. Before the guard this reached `.split` on
   * null and took the whole contribution thread down with it.
   */
  describe('without a name', () => {
    it('draws an empty circle instead of throwing', () => {
      const wrapper = mount(AppAvatar, { props: { name: null } })

      expect(wrapper.find('.app-avatar').exists()).toBe(true)
      expect(wrapper.find('span').text()).toBe('')
    })

    it('still shows the letters it was handed directly', () => {
      const wrapper = mount(AppAvatar, { props: { name: null, initials: 'BE' } })

      expect(wrapper.find('span').text()).toBe('BE')
    })
  })

  it('takes the size it is given', () => {
    const wrapper = mount(AppAvatar, { props: { size: 64, initials: 'BE' } })
    expect(circleStyle(wrapper)).toContain('width: 64px')
    expect(circleStyle(wrapper)).toContain('height: 64px')
  })

  /**
   * The circle that opens the picture at full size (AS-018).
   *
   * ⚠️ jsdom lays nothing out, so every rectangle here is zeros. That is fine and is
   * exactly the boundary: what can be held is that the click MEASURES and reports, not
   * what it measured. The growing itself is a CSS transition and no test in this repo
   * can see one.
   */
  describe('opening the picture at full size', () => {
    const PICTURE = 'data:image/jpeg;base64,PICTURE'

    // Both cases first, together, because the whole promise of the prop is that a caller
    // which does not pass it keeps the element it always had. Two assertions, one line
    // apart, so nobody has to trust the default.
    it('is a button only where there is something to open', () => {
      expect(
        mount(AppAvatar, { props: { initials: 'BE' } })
          .find('button')
          .exists(),
      ).toBe(false)
      expect(
        mount(AppAvatar, { props: { initials: 'BE', src: PICTURE, zoomable: true } })
          .find('button')
          .exists(),
      ).toBe(true)
    })

    /**
     * ⛔ `zoomable` alone is not enough, and this is the case that says so. Nothing but
     * convention stops a caller setting it on a circle that is showing letters -- and such
     * a button would swallow the booking row's own click and then emit a zoom that
     * `openAvatarZoom` refuses for want of a picture. A tap that consumes itself and does
     * nothing is worse than the plain circle it replaced.
     */
    it('stays a plain circle when it is told to zoom but has no picture', async () => {
      const wrapper = mount(AppAvatar, { props: { initials: 'BE', zoomable: true } })

      expect(wrapper.find('button').exists()).toBe(false)
      await wrapper.find('.app-avatar').trigger('click')
      expect(wrapper.emitted('zoom')).toBeUndefined()
    })

    it('reports where it is when it is clicked', async () => {
      const wrapper = mount(AppAvatar, {
        props: { initials: 'BE', src: PICTURE, zoomable: true },
      })
      await wrapper.find('.app-avatar').trigger('click')

      expect(wrapper.emitted('zoom')).toHaveLength(1)
      // A rectangle, whatever jsdom made of it -- the four fields the overlay reads.
      const [rect] = wrapper.emitted('zoom')[0]
      expect(rect).toMatchObject({
        top: expect.any(Number),
        left: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number),
      })
    })

    // ⛔ The one that costs a bug report if it goes: the booking row this sits in opens its
    // own details on click. Without the stop, looking at a face also unfolds the row
    // underneath the overlay -- and there is nothing on screen to connect the two.
    it('does not let the click reach the row it sits in', async () => {
      const rowClicked = vi.fn()
      const wrapper = mount(
        {
          components: { AppAvatar },
          template: '<div @click="rowClicked"><AppAvatar v-bind="$attrs" /></div>',
          props: [],
          setup: () => ({ rowClicked }),
        },
        { attrs: { initials: 'BE', src: PICTURE, zoomable: true } },
      )
      await wrapper.find('.app-avatar').trigger('click')

      expect(rowClicked).not.toHaveBeenCalled()
    })

    // The other half of the same rule: a circle that is NOT zoomable must let the row have
    // its click, exactly as before this delivery.
    it('leaves the click alone where there is nothing to open', async () => {
      const rowClicked = vi.fn()
      const wrapper = mount(
        {
          components: { AppAvatar },
          template: '<div @click="rowClicked"><AppAvatar v-bind="$attrs" /></div>',
          setup: () => ({ rowClicked }),
        },
        { attrs: { initials: 'BE' } },
      )
      await wrapper.find('.app-avatar').trigger('click')

      expect(rowClicked).toHaveBeenCalledTimes(1)
    })

    it('says out loud whose picture is about to open', () => {
      const wrapper = mount(AppAvatar, {
        props: { initials: 'BE', src: PICTURE, zoomable: true, zoomLabel: 'Napoli' },
      })
      expect(wrapper.find('button').attributes('aria-label')).toBe('Napoli')
    })

    // No label, no lie: a button that announces nothing is better than one announcing an
    // internal identifier, and the plain circle carries no aria-label at all.
    it('puts no label on a circle that does not open', () => {
      const wrapper = mount(AppAvatar, { props: { initials: 'BE', zoomLabel: 'Napoli' } })
      expect(wrapper.find('.app-avatar').attributes('aria-label')).toBeUndefined()
    })
  })
})
