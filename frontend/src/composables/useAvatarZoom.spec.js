// AI-GENERATED — not an architecture reference

import { describe, it, expect, afterEach } from 'vitest'
import {
  avatarZoomBindings,
  avatarZoomState,
  closeAvatarZoom,
  openAvatarZoom,
} from './useAvatarZoom'

const MEMBER = { gradidoID: 'g-napoli', communityUuid: 'c-home' }
const ORIGIN = { top: 120, left: 40, width: 42, height: 42 }
const SRC = 'data:image/jpeg;base64,PICTURE'

describe('useAvatarZoom', () => {
  afterEach(() => {
    closeAvatarZoom()
  })

  describe('opening', () => {
    it('carries the member, the picture and the rectangle that was tapped', () => {
      openAvatarZoom({ member: MEMBER, src: SRC, origin: ORIGIN, label: 'Napoli' })

      expect(avatarZoomState.value).toEqual({
        member: { gradidoID: 'g-napoli', communityUuid: 'c-home' },
        src: SRC,
        label: 'Napoli',
        origin: ORIGIN,
      })
    })

    // A DOMRect carries more than these four, and the overlay must not come to depend on
    // the rest -- it is handed a plain object by every test and a real rect in the wallet.
    it('keeps only the four numbers the animation needs', () => {
      openAvatarZoom({
        member: MEMBER,
        src: SRC,
        origin: { ...ORIGIN, bottom: 162, right: 82, x: 40, y: 120 },
      })

      expect(Object.keys(avatarZoomState.value.origin).sort()).toEqual([
        'height',
        'left',
        'top',
        'width',
      ])
    })

    // A member registered before the home community had a uuid has none, and that has to
    // survive as null rather than as undefined: it is half the key the wallet stores
    // pictures under, and `undefined` and `null` build different keys.
    it('turns a missing community into an explicit null', () => {
      openAvatarZoom({ member: { gradidoID: 'g-old' }, src: SRC, origin: ORIGIN })
      expect(avatarZoomState.value.member.communityUuid).toBeNull()
    })

    /**
     * ⛔ Each of these is a state the wallet can genuinely be in, and each would produce a
     * broken overlay rather than an error: no picture means nothing to grow, no rectangle
     * means it appears from nowhere, no member means the fetch has nobody to ask about.
     *
     * Asserted one at a time, and every case differs from the working call above in
     * exactly ONE field -- a single "rejects rubbish" test would stay green if two of the
     * three guards died.
     */
    it.each([
      ['without a picture', { member: MEMBER, src: '', origin: ORIGIN }],
      ['without a rectangle', { member: MEMBER, src: SRC, origin: null }],
      ['without a member', { member: null, src: SRC, origin: ORIGIN }],
      ['without a gradido id', { member: { communityUuid: 'c' }, src: SRC, origin: ORIGIN }],
    ])('does not open %s', (_name, options) => {
      openAvatarZoom(options)
      expect(avatarZoomState.value).toBeNull()
    })
  })

  it('lets go again', () => {
    openAvatarZoom({ member: MEMBER, src: SRC, origin: ORIGIN })
    expect(avatarZoomState.value).not.toBeNull()

    closeAvatarZoom()
    expect(avatarZoomState.value).toBeNull()
  })

  describe('what a call site binds', () => {
    // The positive case first, so the empty ones below are demonstrably about the ONE
    // field that differs and not about the helper never returning anything.
    it('hands back a zoomable avatar for a member with a picture', () => {
      const bindings = avatarZoomBindings(MEMBER, { src: SRC }, 'Napoli')

      expect(bindings.zoomable).toBe(true)
      expect(typeof bindings.onZoom).toBe('function')
      // The label the BUTTON announces, from the same argument the overlay is opened with.
      // Two call-site expressions is how the two come to name different people.
      expect(bindings.zoomLabel).toBe('Napoli')
    })

    // The heart of it: a circle showing letters must not offer to enlarge them. This is
    // why no call site needs a `v-if` of its own -- an empty object binds nothing.
    it('hands back nothing at all for a member without a picture', () => {
      expect(avatarZoomBindings(MEMBER, { src: '' }, 'Napoli')).toEqual({})
    })

    it('hands back nothing for a member the booking could not resolve', () => {
      expect(avatarZoomBindings(null, { src: SRC }, '')).toEqual({})
      expect(avatarZoomBindings({ communityUuid: 'c' }, { src: SRC }, '')).toEqual({})
    })

    // The wiring, end to end: what the avatar emits has to arrive as an open. Without
    // this the two halves could each be right and still not meet.
    it('opens the overlay when the avatar reports where it is', () => {
      const { onZoom } = avatarZoomBindings(MEMBER, { src: SRC }, 'Napoli')
      onZoom(ORIGIN)

      expect(avatarZoomState.value.member.gradidoID).toBe('g-napoli')
      expect(avatarZoomState.value.src).toBe(SRC)
      expect(avatarZoomState.value.label).toBe('Napoli')
      expect(avatarZoomState.value.origin).toEqual(ORIGIN)
    })
  })
})
