// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import AvatarZoom from './AvatarZoom.vue'
import { closeAvatarZoom, openAvatarZoom } from '@/composables/useAvatarZoom'

const mockQuery = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { query: (...args) => mockQuery(...args) } }),
}))

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

  beforeEach(() => {
    mockQuery.mockReset()
    mockQuery.mockResolvedValue({ data: { memberAvatarFull: FULL_BASE64 } })
    wrapper = mount(AvatarZoom, { global: { mocks: { $t: (key) => key } } })
  })

  afterEach(() => {
    closeAvatarZoom()
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
    it('closes when the picture is clicked', async () => {
      await openWith()
      await twoFrames()

      overlay().dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()

      // The overlay shrinks first and is torn down after; what is settled at once is that
      // it is no longer the open one, which is what a second tap has to find.
      expect(frameStyle()).toContain('width: 42px')
    })

    it('closes on Escape', async () => {
      await openWith()
      await twoFrames()

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await nextTick()

      expect(frameStyle()).toContain('width: 42px')
    })

    // ...and not on any other key, or the overlay would close under somebody tabbing to
    // the close button.
    it('stays open on another key', async () => {
      await openWith()
      await twoFrames()

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      await nextTick()

      expect(frameStyle()).toContain(`width: ${FINAL_SIZE}px`)
    })
  })
})
