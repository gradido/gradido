// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import ContactTiles from './ContactTiles.vue'

const LINK_STUB = { props: ['to'], template: '<a :href="to"><slot /></a>' }

const row = (n, extra = {}) => ({
  contact: { user: { communityUuid: 'home', gradidoID: `id-${n}`, alias: `Alias${n}` } },
  key: `home/id-${n}`,
  alias: `Alias${n}`,
  avatar: { initials: `A${n}`, ...extra },
})

const mountTiles = (props) =>
  mount(ContactTiles, {
    props: { rows: [row(1), row(2)], ...props },
    global: {
      mocks: { $t: (key) => key },
      stubs: {
        RouterLink: LINK_STUB,
        AppAvatar: {
          props: ['initials', 'zoomable'],
          template:
            '<i data-test="avatar" :data-initials="initials" :data-zoomable="String(!!zoomable)" />',
        },
      },
    },
  })

describe('ContactTiles', () => {
  it('draws one tile per row, with the name under the face', () => {
    const wrapper = mountTiles()
    const names = wrapper.findAll('.contact-tile-name').map((node) => node.text())

    expect(wrapper.findAll('[data-test^="contact-tile-id-"]')).toHaveLength(2)
    expect(names).toEqual(['Alias1', 'Alias2'])
    wrapper.unmount()
  })

  it('says which person was tapped', async () => {
    const wrapper = mountTiles()
    await wrapper.find('[data-test="contact-tile-id-2"]').trigger('click')

    expect(wrapper.emitted('open')).toHaveLength(1)
    expect(wrapper.emitted('open')[0][0].user.gradidoID).toBe('id-2')
    wrapper.unmount()
  })

  /**
   * ⛔ With the REAL AppAvatar, and that is the whole point of this test.
   *
   * A zoomable AppAvatar renders its own `<button>` and calls `stopPropagation`, so nested
   * in this tile -- which is itself a button -- it swallows the tap meant for the contact
   * window, and only for members who happen to have a portrait. The first version of this
   * guard stubbed AppAvatar as an `<i>`, so the button count could never rise however the
   * row was built: it passed while a caller was doing exactly the forbidden thing.
   *
   * Measured: the same tile renders 1 button without the zoom bindings and 2 with them.
   */
  it('is one control however the caller decorated the face', () => {
    const plain = mount(ContactTiles, {
      props: { rows: [row(1)] },
      global: { mocks: { $t: (key) => key }, stubs: { RouterLink: LINK_STUB } },
    })
    expect(plain.findAll('button')).toHaveLength(1)
    plain.unmount()

    const zoomable = mount(ContactTiles, {
      props: { rows: [row(1, { zoomable: true, src: 'data:image/png;base64,X' })] },
      global: { mocks: { $t: (key) => key }, stubs: { RouterLink: LINK_STUB } },
    })
    const nested = zoomable.findAll('button button').length
    zoomable.unmount()

    // The fixture proves itself: if the real avatar could not produce a nested button, this
    // number would be 0 for a reason that has nothing to do with the tile.
    expect(nested).toBe(1)
  })

  /**
   * ⛔ And the caller's half: the tile must be handed a face that cannot open a picture.
   * `contactDisplay` withholds the zoom bindings by default; both callers take that
   * default, and this is what says so.
   */
  it.each([
    ['the column', 'ContactsPanel.vue'],
    ['the phone strip', 'ContactsStrip.vue'],
  ])('is fed a face without the zoom bindings by %s', (unused, file) => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '..', 'Template', 'RightSide', file),
      'utf8',
    )
    const tiles = source.match(/const favorites = computed\([\s\S]*?\)\n/)

    expect(tiles, `${file} no longer builds a \`favorites\` list`).not.toBeNull()
    expect(tiles[0]).not.toContain('zoomable')
  })

  it('offers no way to the full list unless asked to', () => {
    const wrapper = mountTiles()
    expect(wrapper.find('[data-test="contact-tiles-all"]').exists()).toBe(false)
    wrapper.unmount()
  })

  /**
   * On the phone strip this tile is the ONLY route to the full list, so the strip renders
   * these tiles even when the row itself is empty.
   */
  it('ends with a way to the full list where one is asked for, even with nobody in the row', () => {
    const wrapper = mountTiles({ rows: [], withAllLink: true })
    const all = wrapper.find('[data-test="contact-tiles-all"]')

    expect(all.exists()).toBe(true)
    expect(all.attributes('href')).toBe('/contacts')
    wrapper.unmount()
  })
})
