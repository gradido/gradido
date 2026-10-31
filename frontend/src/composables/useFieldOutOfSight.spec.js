// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { useFieldOutOfSight } from './useFieldOutOfSight'

const ANDROID =
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36'
const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1'

// The heights of the emulator's phone: a page of 783 px, a keyboard of 312, the field at 695-733.
const PAGE = 783
const WITH_KEYBOARD = 471
const FIELD_TOP = 695
const FIELD_BOTTOM = 733
const WELL_PAST_REST = 400

describe('useFieldOutOfSight', () => {
  let viewport
  let wrapper
  let field
  let userAgent
  let composable

  const openKeyboard = () => {
    viewport.height = WITH_KEYBOARD
    viewport.offsetTop = PAGE - WITH_KEYBOARD
  }
  const closeKeyboard = () => {
    viewport.height = PAGE
    viewport.offsetTop = 0
  }
  const moveVisiblePart = (offsetTop) => {
    viewport.offsetTop = offsetTop
    viewport.dispatchEvent(new Event('scroll'))
  }
  const touch = (type, fingers) => {
    const event = new Event(type, { bubbles: true })
    event.touches = Array.from({ length: fingers }, () => ({}))
    document.body.dispatchEvent(event)
  }
  const swipe = (offsetTop) => {
    touch('touchstart', 1)
    touch('touchmove', 1)
    moveVisiblePart(offsetTop)
    touch('touchend', 0)
  }
  const atRest = () => vi.advanceTimersByTime(WELL_PAST_REST)

  const mountField = () => {
    const Host = defineComponent({
      setup() {
        const element = ref(null)
        composable = useFieldOutOfSight(element)
        return () =>
          h('textarea', { ref: element, onFocus: composable.start, onBlur: composable.stop })
      },
    })
    wrapper = mount(Host, { attachTo: document.body })
    field = wrapper.find('textarea').element
    field.getBoundingClientRect = () => ({ top: FIELD_TOP, bottom: FIELD_BOTTOM })
    vi.spyOn(field, 'blur')
  }

  beforeEach(() => {
    vi.useFakeTimers()
    userAgent = ANDROID
    vi.spyOn(window.navigator, 'userAgent', 'get').mockImplementation(() => userAgent)
    viewport = Object.assign(new EventTarget(), { height: PAGE, offsetTop: 0, scale: 1 })
    vi.stubGlobal('visualViewport', viewport)
    window.innerHeight = PAGE
    mountField()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('on Android, with the field in focus and the keyboard open', () => {
    beforeEach(() => {
      field.focus()
      openKeyboard()
    })

    it('leaves the field once a swipe has taken it out of sight', () => {
      swipe(150)
      atRest()
      expect(document.activeElement).not.toBe(field)
    })

    it('stays where a swipe leaves the field in sight', () => {
      swipe(299)
      atRest()
      expect(document.activeElement).toBe(field)
    })

    it('counts the middle of the field as the line, not its edge', () => {
      const middle = (FIELD_TOP + FIELD_BOTTOM) / 2
      swipe(middle - WITH_KEYBOARD + 1)
      atRest()
      expect(document.activeElement).toBe(field)
      field.focus()
      swipe(middle - WITH_KEYBOARD - 1)
      atRest()
      expect(document.activeElement).not.toBe(field)
    })

    it('leaves the field when it went out of sight over the top as well', () => {
      field.getBoundingClientRect = () => ({ top: 10, bottom: 48 })
      swipe(150)
      atRest()
      expect(document.activeElement).not.toBe(field)
    })

    it('waits for the visible part to rest', () => {
      swipe(250)
      vi.advanceTimersByTime(300)
      moveVisiblePart(200)
      vi.advanceTimersByTime(300)
      moveVisiblePart(150)
      vi.advanceTimersByTime(300)
      expect(field.blur).not.toHaveBeenCalled()
      atRest()
      expect(field.blur).toHaveBeenCalledTimes(1)
    })

    it('waits for the last finger to leave the screen', () => {
      touch('touchstart', 2)
      touch('touchmove', 2)
      moveVisiblePart(150)
      touch('touchend', 1)
      atRest()
      expect(field.blur).not.toHaveBeenCalled()
      touch('touchend', 0)
      atRest()
      expect(field.blur).toHaveBeenCalledTimes(1)
    })

    it('does not leave while a finger holds the visible part still', () => {
      swipe(150)
      vi.advanceTimersByTime(100)
      touch('touchstart', 1)
      atRest()
      expect(field.blur).not.toHaveBeenCalled()
    })

    it('counts a swipe the screen broke off, as one the finger ended', () => {
      touch('touchstart', 1)
      touch('touchmove', 1)
      moveVisiblePart(150)
      touch('touchcancel', 0)
      atRest()
      expect(field.blur).toHaveBeenCalledTimes(1)
    })

    it('leaves a field alone that the browser moved, with no finger moving', () => {
      moveVisiblePart(150)
      atRest()
      expect(field.blur).not.toHaveBeenCalled()
    })

    it('leaves a field alone after a tap, however the visible part stands', () => {
      moveVisiblePart(150)
      touch('touchstart', 1)
      touch('touchend', 0)
      atRest()
      expect(field.blur).not.toHaveBeenCalled()
    })

    it('forgets a swipe once it has looked, so the browser moving later decides nothing', () => {
      swipe(299)
      atRest()
      moveVisiblePart(150)
      atRest()
      expect(field.blur).not.toHaveBeenCalled()
    })

    it('leaves the field alone in a page zoomed by hand', () => {
      viewport.scale = 1.5
      swipe(150)
      atRest()
      expect(field.blur).not.toHaveBeenCalled()
    })

    it('does not look any more once the field has given up the focus by itself', () => {
      swipe(150)
      field.blur()
      vi.mocked(field.blur).mockClear()
      atRest()
      expect(field.blur).not.toHaveBeenCalled()
    })

    it('takes back every listener when the bar goes with the field in focus', () => {
      const off = vi.spyOn(document, 'removeEventListener')
      wrapper.unmount()
      wrapper = null
      expect(off.mock.calls.filter(([type]) => type.startsWith('touch'))).toHaveLength(4)
    })
  })

  it('leaves the field alone with no keyboard open (closed with the back key)', () => {
    field.focus()
    closeKeyboard()
    field.getBoundingClientRect = () => ({ top: 900, bottom: 940 })
    swipe(0)
    atRest()
    expect(field.blur).not.toHaveBeenCalled()
  })

  it('hears no finger before the field holds the focus', () => {
    openKeyboard()
    swipe(150)
    atRest()
    expect(field.blur).not.toHaveBeenCalled()
  })

  it('takes back every listener when the field gives up the focus', () => {
    const inputs = (spy) => spy.mock.calls.filter(([type]) => /^(touch|scroll)/.test(type))
    const onDocument = vi.spyOn(document, 'addEventListener')
    const offDocument = vi.spyOn(document, 'removeEventListener')
    const onViewport = vi.spyOn(viewport, 'addEventListener')
    const offViewport = vi.spyOn(viewport, 'removeEventListener')
    field.focus()
    expect(
      inputs(onDocument)
        .map(([type]) => type)
        .sort(),
    ).toEqual(['touchcancel', 'touchend', 'touchmove', 'touchstart'])
    expect(inputs(onViewport).map(([type]) => type)).toEqual(['scroll'])
    field.blur()
    expect(inputs(offDocument)).toEqual(expect.arrayContaining(inputs(onDocument)))
    expect(inputs(offDocument)).toHaveLength(inputs(onDocument).length)
    expect(inputs(offViewport)).toEqual(inputs(onViewport))
  })

  it('starts afresh on every focus: an old swipe does not count', () => {
    field.focus()
    openKeyboard()
    touch('touchstart', 1)
    touch('touchmove', 1)
    field.blur()
    vi.mocked(field.blur).mockClear()
    field.focus()
    moveVisiblePart(150)
    touch('touchend', 0)
    atRest()
    expect(field.blur).not.toHaveBeenCalled()
  })

  it.each([
    ['Safari on the iPhone', IPHONE_SAFARI],
    ['Chrome on the iPhone', IPHONE_CHROME],
  ])('changes nothing for %s: it does not even listen', (_name, agent) => {
    userAgent = agent
    const listening = vi.spyOn(viewport, 'addEventListener')
    const onDocument = vi.spyOn(document, 'addEventListener')
    field.focus()
    openKeyboard()
    swipe(150)
    atRest()
    expect(field.blur).not.toHaveBeenCalled()
    expect(listening).not.toHaveBeenCalled()
    expect(onDocument.mock.calls.filter(([type]) => type.startsWith('touch'))).toEqual([])
  })

  it('works without a visual viewport, by doing nothing', () => {
    vi.stubGlobal('visualViewport', undefined)
    expect(() => composable.start()).not.toThrow()
    expect(() => composable.stop()).not.toThrow()
  })
})
