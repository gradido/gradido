// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach } from 'vitest'
import AppAvatar from '@/components/AppAvatar.vue'
import {
  avatarZoomBindings,
  avatarZoomEpoch,
  avatarZoomState,
  closeAvatarZoom,
  openAvatarZoom,
} from './useAvatarZoom'

// ⚠️ Carries an alias. The labels are built from it, and a fixture without one exercises
// only the name-free fallback -- which is a real case, and gets its own test below, but is
// not the ordinary one.
const MEMBER = { gradidoID: 'g-napoli', communityUuid: 'c-home', alias: 'napoli' }
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

  /**
   * ⛔ The counter a late answer is checked against. It has to move on a CLOSE as well as on
   * an open, or "closed" and "never opened" look the same to an answer that arrives after
   * the fact -- and it has to live in this module rather than in the overlay's setup(),
   * because a logout unmounts the overlay and an instance counter would then be frozen at
   * exactly the moment it matters. That mistake is written up in DashboardLayout.
   */
  describe('the counter that dates an answer', () => {
    it('moves when a face is opened', () => {
      const before = avatarZoomEpoch()
      openAvatarZoom({ member: MEMBER, src: SRC, origin: ORIGIN })
      expect(avatarZoomEpoch()).not.toBe(before)
    })

    it('moves when it is closed again', () => {
      openAvatarZoom({ member: MEMBER, src: SRC, origin: ORIGIN })
      const whileOpen = avatarZoomEpoch()
      closeAvatarZoom()
      expect(avatarZoomEpoch()).not.toBe(whileOpen)
    })
  })

  /**
   * ⛔ The overlay does not take focus away from the circle it grew out of by itself, so a
   * keyboard member's second Enter lands here. Re-opening would restart the animation and
   * pay for the 512 crop a second time; the counter would move, which is what invalidates
   * the first answer.
   */
  it('does nothing when the face it is asked for is already open', () => {
    openAvatarZoom({ member: MEMBER, src: SRC, origin: ORIGIN })
    const first = avatarZoomState.value
    const epoch = avatarZoomEpoch()

    openAvatarZoom({ member: { ...MEMBER }, src: SRC, origin: { ...ORIGIN, top: 999 } })

    expect(avatarZoomState.value).toBe(first)
    expect(avatarZoomEpoch()).toBe(epoch)
  })

  // ...but a DIFFERENT member does open, or tapping a second face would do nothing.
  it('swaps to another member while one is open', () => {
    openAvatarZoom({ member: MEMBER, src: SRC, origin: ORIGIN })
    openAvatarZoom({
      member: { gradidoID: 'g-other', communityUuid: 'c-home', alias: 'other' },
      src: SRC,
      origin: ORIGIN,
    })

    expect(avatarZoomState.value.member.gradidoID).toBe('g-other')
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
      const bindings = avatarZoomBindings(MEMBER, { src: SRC })

      expect(bindings.zoomable).toBe(true)
      expect(typeof bindings.onZoom).toBe('function')
      // The BUTTON's label, built here rather than at the call site — that is the whole
      // reason this helper takes the member and not a finished string.
      expect(bindings.zoomLabel).toContain('napoli')
    })

    /**
     * ⛔ The button and the opened picture need DIFFERENT words. The button carries a
     * command, the dialog and the image carry a description; one string for both makes a
     * screen reader offer to enlarge a picture that is already enlarged.
     *
     * Asserted as "not the same", because asserting the exact wording would only repeat
     * the locale file back at itself.
     */
    it("gives the opened picture its own words, not the button's", () => {
      const { zoomLabel, onZoom } = avatarZoomBindings(MEMBER, { src: SRC })
      onZoom(ORIGIN)

      expect(avatarZoomState.value.label).toContain('napoli')
      expect(avatarZoomState.value.label).not.toBe(zoomLabel)
    })

    /**
     * ⛔ `memberAlias` falls back to the gradidoID for an alias under three characters, and
     * legacy one- and two-character usernames are a live state. On the row that fallback is
     * fine — the same word is printed beside the circle — but read aloud it is a uuid, so
     * the label drops the name instead of announcing an identifier.
     */
    it('announces no name at all rather than a gradido id', () => {
      const legacy = { gradidoID: 'g-legacy', communityUuid: null, alias: 'ab' }
      const { zoomLabel, onZoom } = avatarZoomBindings(legacy, { src: SRC })
      onZoom(ORIGIN)

      expect(zoomLabel).not.toContain('g-legacy')
      expect(avatarZoomState.value.label).not.toContain('g-legacy')
      // ...and it still says something, rather than nothing at all.
      expect(zoomLabel.length).toBeGreaterThan(0)
    })

    // The heart of it: a circle showing letters must not offer to enlarge them. This is
    // why no call site needs a `v-if` of its own -- an empty object binds nothing.
    it('hands back nothing at all for a member without a picture', () => {
      expect(avatarZoomBindings(MEMBER, { src: '' })).toEqual({})
    })

    it('hands back nothing for a member the booking could not resolve', () => {
      expect(avatarZoomBindings(null, { src: SRC })).toEqual({})
      expect(avatarZoomBindings({ communityUuid: 'c' }, { src: SRC })).toEqual({})
    })

    /**
     * ⛔ Through a REAL AppAvatar, because the seam is a NAME: `onZoom` is a key in a bound
     * object, `zoom` is a declared emit, and nothing but a matching spelling links them.
     * Calling `onZoom` by hand -- which is what the test below does, and what this one was
     * captioned as before -- jumps exactly the join that can break.
     */
    it('opens when a real avatar is clicked', async () => {
      const wrapper = mount(AppAvatar, {
        props: { initials: 'NA', src: SRC, ...avatarZoomBindings(MEMBER, { src: SRC }) },
      })
      await wrapper.find('.app-avatar').trigger('click')

      expect(avatarZoomState.value).not.toBeNull()
      expect(avatarZoomState.value.member.gradidoID).toBe('g-napoli')
      wrapper.unmount()
    })

    // The same wiring without the component, for what the helper hands back on its own.
    it('opens the overlay when the avatar reports where it is', () => {
      const { onZoom } = avatarZoomBindings(MEMBER, { src: SRC })
      onZoom(ORIGIN)

      expect(avatarZoomState.value.member.gradidoID).toBe('g-napoli')
      expect(avatarZoomState.value.src).toBe(SRC)
      expect(avatarZoomState.value.origin).toEqual(ORIGIN)
    })
  })
})
