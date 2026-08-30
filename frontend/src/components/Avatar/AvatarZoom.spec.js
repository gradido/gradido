// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import AvatarZoom from './AvatarZoom.vue'
import { avatarZoomState, closeAvatarZoom, openAvatarZoom } from '@/composables/useAvatarZoom'
import {
  forgetAllMemberAvatars,
  forgetWithdrawnMemberAvatars,
} from '@/composables/useMemberAvatars'

const mockQuery = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { query: (...args) => mockQuery(...args) } }),
}))

// Reactive, not a plain object: the component watches the path, and a mock that cannot
// change would make the "closes when the page underneath changes" case unwritable.
const mockRoute = reactive({ path: '/transactions' })
vi.mock('vue-router', () => ({ useRoute: () => mockRoute }))

const SMALL = 'data:image/jpeg;base64,SMALL'
const FULL_BASE64 = 'FULLPICTURE'
const MEMBER = { gradidoID: 'g-napoli', communityUuid: 'c-home' }
const ORIGIN = { top: 120, left: 40, width: 42, height: 42 }

/**
 * jsdom reports 1024 x 768, so the centred square is 500 (the cap, not the viewport) and
 * lands at left 262 / top 134. Written out rather than recomputed in the assertion: a test
 * that repeats the implementation's arithmetic passes whatever that arithmetic does.
 */
const FINAL_SIZE = 500
const FINAL_LEFT = 262
const FINAL_TOP = 134

// Two real frames, because that is what the component waits for -- the browser has to
// paint the starting rectangle before the finishing one is applied, or there is no growth
// to see. Stubbing rAF to run at once would make the starting state untestable.
const twoFrames = async () => {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  await nextTick()
}

// ⚠️ Real timers, not fake ones. The component's lifecycle is rAF AND setTimeout together,
// and faking only one half leaves the other running against a clock that never moves --
// which is how the teardown came to be executed by no test at all.
const TEARDOWN_MS = 320
const settle = async (ms = TEARDOWN_MS + 40) => {
  await new Promise((resolve) => setTimeout(resolve, ms))
  await nextTick()
}

describe('AvatarZoom', () => {
  let wrapper

  // ⚠️ Queried on the DOCUMENT, not on the wrapper. The overlay is a `<Teleport to="body">`,
  // so its nodes are not inside the component's element and `wrapper.find` sees nothing --
  // which reads exactly like "the overlay never opened".
  const frameStyle = () => document.querySelector('.avatar-zoom-frame')?.getAttribute('style') ?? ''
  const images = () => [...document.querySelectorAll('.avatar-zoom-image')]
  const overlay = () => document.querySelector('.avatar-zoom')
  const fullImage = () => document.querySelector('.avatar-zoom-image-full')

  const openWith = async (overrides = {}) => {
    openAvatarZoom({ member: MEMBER, src: SMALL, origin: ORIGIN, label: 'Napoli', ...overrides })
    await nextTick()
  }

  // Grown, and PROVEN grown. Every close assertion below rests on this: the shrunk state
  // and the never-grew state are the same 42px rectangle, so a close test that does not
  // pin the size first is green for an overlay that never opened properly.
  const openGrown = async (overrides = {}) => {
    await openWith(overrides)
    await twoFrames()
    expect(frameStyle()).toContain(`width: ${FINAL_SIZE}px`)
  }

  beforeEach(() => {
    mockQuery.mockReset()
    mockQuery.mockResolvedValue({ data: { memberAvatarFull: FULL_BASE64 } })
    mockRoute.path = '/transactions'
    wrapper = mount(AvatarZoom, {
      global: {
        mocks: { $t: (key) => key },
        stubs: { VariantIcon: { props: ['icon'], template: '<i :data-icon="icon" />' } },
      },
    })
  })

  afterEach(() => {
    closeAvatarZoom()
    forgetAllMemberAvatars()
    wrapper?.unmount()
  })

  it('shows nothing at all while nothing is open', () => {
    expect(document.querySelector('.avatar-zoom')).toBeNull()
  })

  describe('growing out of the circle that was tapped', () => {
    // ⛔ The starting rectangle IS the feature. If the overlay opened at its final size the
    // picture would appear somewhere else on screen and the member would have to find the
    // face again -- which is the whole reason the click hands up a rectangle.
    it('starts exactly where the small picture was', async () => {
      await openWith()

      expect(frameStyle()).toContain('top: 120px')
      expect(frameStyle()).toContain('left: 40px')
      expect(frameStyle()).toContain('width: 42px')
      expect(frameStyle()).toContain('height: 42px')
    })

    it('ends centred at the full size', async () => {
      await openWith()
      await twoFrames()

      expect(frameStyle()).toContain(`width: ${FINAL_SIZE}px`)
      expect(frameStyle()).toContain(`height: ${FINAL_SIZE}px`)
      expect(frameStyle()).toContain(`left: ${FINAL_LEFT}px`)
      expect(frameStyle()).toContain(`top: ${FINAL_TOP}px`)
    })

    // The picture already on the device, showing from the first frame. Without it the
    // circle would grow empty and fill in when the network answers.
    it('shows the picture it already has, immediately', async () => {
      await openWith()

      expect(images()[0].getAttribute('src')).toBe(SMALL)
    })
  })

  describe('the full rendition', () => {
    it('asks for the member who was tapped, and does not keep the answer', async () => {
      await openWith()

      expect(mockQuery).toHaveBeenCalledTimes(1)
      const [options] = mockQuery.mock.calls[0]
      expect(options.variables).toEqual({
        ref: { gradidoID: 'g-napoli', communityUuid: 'c-home' },
      })
      // ⛔ Asserted, not assumed. A cached copy of somebody else's face outlives the moment
      // its owner withdraws it, for as long as the tab is open.
      expect(options.fetchPolicy).toBe('no-cache')
    })

    it('lays it over the small one once it arrives', async () => {
      await openWith()
      await nextTick()
      await nextTick()

      expect(fullImage()).not.toBeNull()
      expect(fullImage().getAttribute('src')).toBe(`data:image/jpeg;base64,${FULL_BASE64}`)
      // Both are in the DOM: the small one never leaves, so nothing blinks out while the
      // large one decodes.
      expect(images()).toHaveLength(2)
    })

    // Withdrawn between the booking list and the tap. Not an error, and not an empty
    // circle either -- the face that is already on screen stays.
    it('leaves the small one showing when there is nothing to add', async () => {
      mockQuery.mockResolvedValue({ data: { memberAvatarFull: null } })
      await openWith()
      await nextTick()
      await nextTick()

      expect(fullImage()).toBeNull()
      expect(images()[0].getAttribute('src')).toBe(SMALL)
    })

    // Same for a request that fails outright: somebody looking at a face does not need to
    // hear about the network.
    it('says nothing when the request fails', async () => {
      mockQuery.mockRejectedValue(new Error('offline'))
      await openWith()
      await nextTick()
      await nextTick()

      expect(fullImage()).toBeNull()
      expect(overlay()).not.toBeNull()
    })

    /**
     * ⛔ The one that cannot be reasoned away: a slow answer for the member who was open a
     * moment ago must not paint on the member who is open NOW. Without the epoch counter
     * this puts the WRONG PERSON'S FACE on screen, at full size, with nothing on the page
     * to say so.
     *
     * ⚠️ The obvious version of this test -- open, close, let the answer land -- proves
     * NOTHING, and an injection said so: with the overlay closed there is no `.avatar-zoom`
     * at all, so the assertion holds with the guard deleted. The dangerous state is the one
     * where the overlay is still open, showing somebody else.
     */
    it('does not paint a slow answer onto the face that is open now', async () => {
      let settleFirst
      mockQuery.mockReturnValueOnce(
        new Promise((resolve) => {
          settleFirst = () => resolve({ data: { memberAvatarFull: 'FIRSTFACE' } })
        }),
      )
      mockQuery.mockResolvedValueOnce({ data: { memberAvatarFull: 'SECONDFACE' } })

      await openWith()
      // The member taps a second face before the first answer is back.
      await openWith({
        member: { gradidoID: 'g-other', communityUuid: 'c-home' },
        src: 'data:image/jpeg;base64,OTHERSMALL',
        label: 'Other',
      })
      await nextTick()
      await nextTick()

      settleFirst()
      await nextTick()
      await nextTick()

      // Still the second member's picture, and demonstrably not the first one's.
      expect(fullImage()).not.toBeNull()
      expect(fullImage().getAttribute('src')).toBe('data:image/jpeg;base64,SECONDFACE')
      expect(fullImage().getAttribute('src')).not.toContain('FIRSTFACE')
    })
  })

  describe('letting go', () => {
    it('shrinks back into the circle and then leaves the screen', async () => {
      await openGrown()

      overlay().dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()
      expect(frameStyle()).toContain('width: 42px')

      // ⛔ The half nothing measured before: the overlay is `position: fixed; inset: 0`, so
      // a teardown that never runs leaves a full-screen click catcher over the wallet and
      // every other test still passes.
      await settle()
      expect(overlay()).toBeNull()
    })

    it('closes on Escape', async () => {
      await openGrown()

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await nextTick()
      expect(frameStyle()).toContain('width: 42px')

      await settle()
      expect(overlay()).toBeNull()
    })

    // ...and not on any other key, or the overlay would close under somebody tabbing to
    // the close button.
    it('stays open on another key', async () => {
      await openGrown()

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      await nextTick()

      expect(frameStyle()).toContain(`width: ${FINAL_SIZE}px`)
    })

    // ⛔ While it shrinks the overlay is still full-size and still on top. Without this it
    // goes on swallowing clicks for a quarter of a second after the member has decided to
    // close it, so their next tap -- a booking row, a second face -- does nothing at all.
    it('stops swallowing clicks while it shrinks', async () => {
      await openGrown()
      expect(overlay().className).not.toContain('is-closing')

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await nextTick()

      expect(overlay().className).toContain('is-closing')
    })

    /**
     * The browser's back button. Nothing inside the overlay can navigate -- it covers the
     * screen -- but the page underneath can change without it.
     *
     * ⛔ No shrink here, and that is the point: the rectangle it would shrink into belonged
     * to a page that has gone.
     */
    it('lets go at once when the page underneath changes', async () => {
      await openGrown()

      mockRoute.path = '/contributions'
      await nextTick()

      expect(overlay()).toBeNull()
    })

    /**
     * ⛔ The origin rectangle is viewport coordinates captured at the tap and never
     * re-measured, and there is deliberately no scroll lock. Once the page behind moves,
     * shrinking into that rectangle lands on empty space or on a different member's row --
     * so a scroll ends it outright.
     */
    it('lets go at once when the page behind scrolls', async () => {
      await openGrown()

      window.scrollY = 400
      window.dispatchEvent(new Event('scroll'))
      await nextTick()

      expect(overlay()).toBeNull()
      window.scrollY = 0
    })

    /**
     * ⛔ The withdrawal has to reach the face somebody is LOOKING at, not only the copies
     * lying in storage. A member who switches their picture off would otherwise stay on
     * that screen at 500 px until the viewer happened to tap it away.
     */
    it('lets go at once when the picture is withdrawn', async () => {
      await openGrown()

      // What a booking list reports for a member with nothing to show: no date at all.
      forgetWithdrawnMemberAvatars([
        { gradidoID: MEMBER.gradidoID, communityUuid: MEMBER.communityUuid, avatarUpdatedAt: null },
      ])
      await nextTick()

      expect(overlay()).toBeNull()
    })

    // ...and a member who is merely not on the current page has withdrawn nothing.
    it('stays open for a member the newest list simply does not mention', async () => {
      await openGrown()

      forgetWithdrawnMemberAvatars([
        { gradidoID: 'g-somebody-else', communityUuid: 'c-home', avatarUpdatedAt: null },
      ])
      await nextTick()

      expect(overlay()).not.toBeNull()
    })
  })

  describe('focus', () => {
    /**
     * ⛔ `aria-modal="true"` tells assistive tech the rest of the page is not there. Without
     * a focus move the cursor stays on the avatar button underneath, inside the part just
     * declared hidden -- and a second Enter on that still-live button re-opened the overlay
     * and paid for the picture again.
     */
    it('takes focus into the dialog', async () => {
      await openGrown()
      await twoFrames()

      expect(document.activeElement).toBe(document.querySelector('.avatar-zoom-close'))
    })

    it('hands focus back to where it came from', async () => {
      const opener = document.createElement('button')
      document.body.appendChild(opener)
      opener.focus()

      await openGrown()
      await twoFrames()
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await settle()

      expect(document.activeElement).toBe(opener)
      opener.remove()
    })

    /**
     * ⛔ `aria-modal="true"` is a claim about what assistive tech should ignore; it does
     * nothing to stop Tab. Without a trap the member is told the wallet behind is hidden and
     * can then tab into it and activate controls they cannot see.
     */
    it('keeps Tab inside the overlay', async () => {
      const behind = document.createElement('button')
      document.body.appendChild(behind)

      await openGrown()
      await twoFrames()

      const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true })
      window.dispatchEvent(event)
      await nextTick()

      expect(event.defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(document.querySelector('.avatar-zoom-close'))
      expect(document.activeElement).not.toBe(behind)
      behind.remove()
    })

    // ...but not to a node the page has since removed: `.focus()` on a detached element is
    // a silent no-op that drops focus to <body>, which is worse than leaving it where the
    // member has already put it.
    it('does not chase a node that is gone', async () => {
      const opener = document.createElement('button')
      document.body.appendChild(opener)
      opener.focus()

      await openGrown()
      await twoFrames()
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      opener.remove()
      await settle()

      // No throw, and nothing was focused in its place.
      expect(document.activeElement).not.toBe(opener)
    })
  })

  /**
   * ⛔ The state lives in a module that outlives every component, so an unmount with a face
   * open -- the idle-timeout logout is the realistic one, it fires precisely when somebody
   * is sitting still and looking -- used to leave another member's picture and id in memory
   * for the life of the tab.
   */
  it('lets go of the shared state when it is torn down mid-flight', async () => {
    await openGrown()
    wrapper.unmount()
    wrapper = null

    expect(avatarZoomState.value).toBeNull()
  })

  /**
   * ⛔ The narrow window the test above cannot reach: the watcher is not `immediate` and
   * flushes before render, so between `openAvatarZoom` and this component noticing, the
   * shared state holds a face while `shown` is still null. An unmount landing exactly there
   * -- and a logout is what unmounts this -- read the LOCAL state, found nothing, and left
   * the picture behind. No `await` between the two lines, deliberately; that gap is the
   * whole case.
   */
  it('lets go even when it is torn down before it has noticed', () => {
    openAvatarZoom({ member: MEMBER, src: SMALL, origin: ORIGIN, label: 'Napoli' })
    wrapper.unmount()
    wrapper = null

    expect(avatarZoomState.value).toBeNull()
  })
})
