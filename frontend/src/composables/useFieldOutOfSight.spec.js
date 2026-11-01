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
// Where a finger touches down, and how far a swipe takes it. A tap stays within a browser's limit.
const FINGER_AT = 400
const SWIPE_PX = 130
const TAP_WOBBLE_PX = 6

describe('useFieldOutOfSight', () => {
  let viewport
  let wrapper
  let field
  let around
  let bar
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
  // The keyboard arrives: the browser reports the visible part's new height.
  const keyboardArrives = () => {
    viewport.height = WITH_KEYBOARD
    viewport.dispatchEvent(new Event('resize'))
  }
  const touch = (type, fingers, screenY = FINGER_AT) => {
    const event = new Event(type, { bubbles: true })
    event.touches = Array.from({ length: fingers }, () => ({ screenY }))
    event.changedTouches = [{ screenY }]
    document.body.dispatchEvent(event)
  }
  const swipe = (offsetTop) => {
    touch('touchstart', 1)
    moveVisiblePart(offsetTop)
    touch('touchend', 0, FINGER_AT + SWIPE_PX)
  }
  const atRest = () => vi.advanceTimersByTime(WELL_PAST_REST)

  const mountField = ({ inWindow = true } = {}) => {
    const Host = defineComponent({
      setup() {
        const element = ref(null)
        const barElement = ref(null)
        composable = useFieldOutOfSight(element, barElement)
        const textarea = () =>
          h('div', { ref: barElement, class: 'bar' }, [
            h('textarea', { ref: element, onFocus: composable.start, onBlur: composable.stop }),
          ])
        return () =>
          inWindow ? h('div', { class: 'window', tabindex: -1 }, [textarea()]) : textarea()
      },
    })
    wrapper = mount(Host, { attachTo: document.body })
    field = wrapper.find('textarea').element
    around = inWindow ? wrapper.find('.window').element : null
    bar = wrapper.find('.bar').element
    bar.scrollIntoView = vi.fn()
    field.getBoundingClientRect = () => ({ top: FIELD_TOP, bottom: FIELD_BOTTOM })
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

    it('hands the focus to the window once a swipe has taken the field out of sight', () => {
      const focus = vi.spyOn(around, 'focus')
      swipe(150)
      atRest()
      expect(document.activeElement).toBe(around)
      expect(focus).toHaveBeenCalledWith({ preventScroll: true })
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
      swipe(middle - WITH_KEYBOARD - 1)
      atRest()
      expect(document.activeElement).toBe(around)
    })

    it('leaves the field when it went out of sight over the top as well', () => {
      field.getBoundingClientRect = () => ({ top: 10, bottom: 48 })
      swipe(150)
      atRest()
      expect(document.activeElement).toBe(around)
    })

    it('waits for the visible part to rest', () => {
      swipe(250)
      vi.advanceTimersByTime(300)
      moveVisiblePart(200)
      vi.advanceTimersByTime(300)
      moveVisiblePart(150)
      vi.advanceTimersByTime(300)
      expect(document.activeElement).toBe(field)
      atRest()
      expect(document.activeElement).toBe(around)
    })

    it('waits for the last finger to leave the screen', () => {
      touch('touchstart', 1)
      touch('touchstart', 2)
      moveVisiblePart(150)
      touch('touchend', 1, FINGER_AT + SWIPE_PX)
      atRest()
      expect(document.activeElement).toBe(field)
      touch('touchend', 0, FINGER_AT + SWIPE_PX)
      atRest()
      expect(document.activeElement).toBe(around)
    })

    it('keeps counting from the first finger when a second one lands during the swipe', () => {
      touch('touchstart', 1)
      moveVisiblePart(150)
      touch('touchstart', 2, FINGER_AT + SWIPE_PX)
      touch('touchend', 1, FINGER_AT + SWIPE_PX)
      touch('touchend', 0, FINGER_AT + SWIPE_PX)
      atRest()
      expect(document.activeElement).toBe(around)
    })

    it('waits while a new finger holds the visible part still, and counts from the first', () => {
      swipe(150)
      vi.advanceTimersByTime(100)
      touch('touchstart', 1)
      atRest()
      expect(document.activeElement).toBe(field)
      touch('touchend', 0)
      atRest()
      expect(document.activeElement).toBe(around)
    })

    it('counts a swipe the screen broke off, as one the finger ended', () => {
      touch('touchstart', 1)
      moveVisiblePart(150)
      touch('touchcancel', 0, FINGER_AT + SWIPE_PX)
      atRest()
      expect(document.activeElement).toBe(around)
    })

    it('leaves a field alone that the browser moved, with no finger on the screen', () => {
      moveVisiblePart(150)
      atRest()
      expect(document.activeElement).toBe(field)
    })

    it('leaves a field alone after a tap, however the visible part stands', () => {
      moveVisiblePart(150)
      atRest()
      touch('touchstart', 1)
      touch('touchend', 0)
      atRest()
      expect(document.activeElement).toBe(field)
    })

    it('leaves a covered field alone when a finger only rolled the thread', () => {
      // The keyboard opened and the browser did not bring the field up: covered before the finger.
      moveVisiblePart(0)
      atRest()
      touch('touchstart', 1)
      touch('touchend', 0, FINGER_AT + SWIPE_PX)
      atRest()
      expect(document.activeElement).toBe(field)
      expect(bar.scrollIntoView).not.toHaveBeenCalled()
    })

    it('ignores a move of less than a pixel on the screen', () => {
      moveVisiblePart(0)
      atRest()
      touch('touchstart', 1)
      moveVisiblePart(0.5)
      touch('touchend', 0, FINGER_AT + SWIPE_PX)
      atRest()
      expect(document.activeElement).toBe(field)
    })

    it('keeps a field that a tap moved: a finger that did not travel takes nothing away', () => {
      // Brave 1.80 (Chromium 138): the bars at the bottom go, and the field moves with the window.
      field.getBoundingClientRect = () => ({ top: 598, bottom: 636 })
      moveVisiblePart(0)
      atRest()
      touch('touchstart', 1)
      field.getBoundingClientRect = () => ({ top: FIELD_TOP, bottom: FIELD_BOTTOM })
      touch('touchend', 0, FINGER_AT + TAP_WOBBLE_PX)
      atRest()
      expect(document.activeElement).toBe(field)
    })

    it('counts a travel from where this finger came down, not from the finger before', () => {
      touch('touchstart', 1, FINGER_AT)
      touch('touchend', 0, FINGER_AT)
      touch('touchstart', 1, FINGER_AT + SWIPE_PX)
      moveVisiblePart(150)
      touch('touchend', 0, FINGER_AT + SWIPE_PX)
      atRest()
      expect(document.activeElement).toBe(field)
    })

    it('forgets a finger that only rolled the thread when the next one taps and the field moves', () => {
      // A roll, and within the rest a tap: the bars at the bottom go, the field moves with the window.
      moveVisiblePart(0)
      atRest()
      touch('touchstart', 1)
      touch('touchend', 0, FINGER_AT + SWIPE_PX)
      vi.advanceTimersByTime(100)
      touch('touchstart', 1)
      touch('touchend', 0)
      field.getBoundingClientRect = () => ({ top: FIELD_TOP + 96, bottom: FIELD_BOTTOM + 96 })
      atRest()
      expect(document.activeElement).toBe(field)
    })

    it('forgets a swipe once it has looked, so the browser moving later decides nothing', () => {
      swipe(299)
      atRest()
      moveVisiblePart(150)
      atRest()
      expect(document.activeElement).toBe(field)
    })

    it('leaves the field alone in a page zoomed by hand', () => {
      viewport.scale = 1.5
      swipe(150)
      atRest()
      expect(document.activeElement).toBe(field)
    })

    it('does not look any more once the field has given up the focus by itself', () => {
      swipe(150)
      field.blur()
      atRest()
      expect(document.activeElement).toBe(document.body)
    })

    it('takes back every listener when the bar goes with the field in focus', () => {
      const off = vi.spyOn(document, 'removeEventListener')
      wrapper.unmount()
      wrapper = null
      expect(off.mock.calls.filter(([type]) => type.startsWith('touch'))).toHaveLength(3)
    })
  })

  describe('when the keyboard leaves the field covered', () => {
    beforeEach(() => {
      field.focus()
    })

    it('brings the bar up once the visible part rests, and the focus stays', () => {
      keyboardArrives()
      vi.advanceTimersByTime(300)
      expect(bar.scrollIntoView).not.toHaveBeenCalled()
      atRest()
      expect(bar.scrollIntoView).toHaveBeenCalledTimes(1)
      expect(bar.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
      expect(document.activeElement).toBe(field)
    })

    it('does the same after a tap into a field already in focus, which the bars move', () => {
      // As measured in Brave 1.80: under the tap the field stands at 598, the keyboard takes it to 695.
      field.getBoundingClientRect = () => ({ top: 598, bottom: 636 })
      touch('touchstart', 1)
      touch('touchend', 0, FINGER_AT + TAP_WOBBLE_PX)
      field.getBoundingClientRect = () => ({ top: FIELD_TOP, bottom: FIELD_BOTTOM })
      keyboardArrives()
      atRest()
      expect(bar.scrollIntoView).toHaveBeenCalledTimes(1)
      expect(document.activeElement).toBe(field)
    })

    it('counts the lower edge here: a tall field with its middle in sight still gets brought up', () => {
      const edge = WITH_KEYBOARD
      field.getBoundingClientRect = () => ({ top: edge - 90, bottom: edge + 60 })
      keyboardArrives()
      atRest()
      expect(bar.scrollIntoView).toHaveBeenCalledTimes(1)
    })

    it('leaves a field alone whose lower edge just stands in sight', () => {
      field.getBoundingClientRect = () => ({ top: WITH_KEYBOARD - 38, bottom: WITH_KEYBOARD })
      keyboardArrives()
      atRest()
      expect(bar.scrollIntoView).not.toHaveBeenCalled()
    })

    it('leaves a browser alone that brings the field up itself', () => {
      keyboardArrives()
      vi.advanceTimersByTime(200)
      moveVisiblePart(PAGE - WITH_KEYBOARD)
      atRest()
      expect(bar.scrollIntoView).not.toHaveBeenCalled()
    })

    it('gives a browser on its way the time to arrive', () => {
      keyboardArrives()
      vi.advanceTimersByTime(300)
      moveVisiblePart(100)
      vi.advanceTimersByTime(300)
      expect(bar.scrollIntoView).not.toHaveBeenCalled()
      moveVisiblePart(PAGE - WITH_KEYBOARD)
      atRest()
      expect(bar.scrollIntoView).not.toHaveBeenCalled()
    })

    it('waits for a finger that is still on the screen', () => {
      touch('touchstart', 1)
      keyboardArrives()
      atRest()
      expect(bar.scrollIntoView).not.toHaveBeenCalled()
      touch('touchend', 0)
      atRest()
      expect(bar.scrollIntoView).toHaveBeenCalledTimes(1)
    })

    it('leaves the field rather than bringing it up when a swipe took it away', () => {
      openKeyboard()
      keyboardArrives()
      swipe(150)
      atRest()
      expect(document.activeElement).toBe(around)
      expect(bar.scrollIntoView).not.toHaveBeenCalled()
    })

    it('does nothing when the keyboard goes, wherever the field stands', () => {
      field.getBoundingClientRect = () => ({ top: PAGE + 100, bottom: PAGE + 140 })
      viewport.height = PAGE
      viewport.dispatchEvent(new Event('resize'))
      atRest()
      expect(bar.scrollIntoView).not.toHaveBeenCalled()
    })

    it('brings it up once: a later move of the visible part stays as it is', () => {
      keyboardArrives()
      atRest()
      moveVisiblePart(0)
      atRest()
      expect(bar.scrollIntoView).toHaveBeenCalledTimes(1)
    })

    it('forgets a keyboard when the field gives up the focus before the rest', () => {
      keyboardArrives()
      field.blur()
      atRest()
      expect(bar.scrollIntoView).not.toHaveBeenCalled()
      field.focus()
      moveVisiblePart(0)
      atRest()
      expect(bar.scrollIntoView).not.toHaveBeenCalled()
    })

    it('leaves a page alone that is zoomed by hand', () => {
      viewport.scale = 1.5
      keyboardArrives()
      atRest()
      expect(bar.scrollIntoView).not.toHaveBeenCalled()
    })
  })

  it('just gives up the focus where there is no window around the field', () => {
    wrapper.unmount()
    mountField({ inWindow: false })
    field.focus()
    openKeyboard()
    swipe(150)
    atRest()
    expect(document.activeElement).toBe(document.body)
  })

  it('leaves the field alone with no keyboard open (closed with the back key)', () => {
    field.focus()
    closeKeyboard()
    field.getBoundingClientRect = () => ({ top: 900, bottom: 940 })
    swipe(30)
    atRest()
    expect(document.activeElement).toBe(field)
  })

  it('hears no finger before the field holds the focus', () => {
    openKeyboard()
    const focus = vi.spyOn(around, 'focus')
    swipe(150)
    atRest()
    expect(focus).not.toHaveBeenCalled()
  })

  it('takes back every listener when the field gives up the focus', () => {
    const inputs = (spy) => spy.mock.calls.filter(([type]) => /^(touch|scroll|resize)/.test(type))
    const onDocument = vi.spyOn(document, 'addEventListener')
    const offDocument = vi.spyOn(document, 'removeEventListener')
    const onViewport = vi.spyOn(viewport, 'addEventListener')
    const offViewport = vi.spyOn(viewport, 'removeEventListener')
    field.focus()
    expect(
      inputs(onDocument)
        .map(([type]) => type)
        .sort(),
    ).toEqual(['touchcancel', 'touchend', 'touchstart'])
    expect(inputs(onViewport).map(([type]) => type)).toEqual(['scroll', 'resize'])
    field.blur()
    expect(inputs(offDocument)).toEqual(expect.arrayContaining(inputs(onDocument)))
    expect(inputs(offDocument)).toHaveLength(inputs(onDocument).length)
    expect(inputs(offViewport)).toEqual(inputs(onViewport))
  })

  it('starts afresh on every focus: a finger never heard lifting holds nothing back', () => {
    field.focus()
    touch('touchstart', 1)
    field.blur()
    field.focus()
    keyboardArrives()
    atRest()
    expect(bar.scrollIntoView).toHaveBeenCalledTimes(1)
  })

  it('starts afresh on every focus: a swipe already counted does not stay', () => {
    field.focus()
    openKeyboard()
    swipe(150)
    touch('touchstart', 1)
    field.blur()
    field.focus()
    moveVisiblePart(150)
    atRest()
    expect(document.activeElement).toBe(field)
  })

  it('starts afresh on every focus: a swipe from before does not count', () => {
    field.focus()
    openKeyboard()
    swipe(150)
    field.blur()
    field.focus()
    moveVisiblePart(150)
    atRest()
    expect(document.activeElement).toBe(field)
  })

  it('starts afresh on every focus: a finger from before does not count', () => {
    field.focus()
    openKeyboard()
    touch('touchstart', 1)
    field.blur()
    field.focus()
    moveVisiblePart(150)
    touch('touchend', 0, FINGER_AT + SWIPE_PX)
    atRest()
    expect(document.activeElement).toBe(field)
  })

  it.each([
    ['Safari on the iPhone', IPHONE_SAFARI],
    ['Chrome on the iPhone', IPHONE_CHROME],
  ])('changes nothing for %s: it does not even listen', (_name, agent) => {
    userAgent = agent
    const listening = vi.spyOn(viewport, 'addEventListener')
    const onDocument = vi.spyOn(document, 'addEventListener')
    field.focus()
    keyboardArrives()
    swipe(150)
    atRest()
    expect(document.activeElement).toBe(field)
    expect(bar.scrollIntoView).not.toHaveBeenCalled()
    expect(listening).not.toHaveBeenCalled()
    expect(onDocument.mock.calls.filter(([type]) => type.startsWith('touch'))).toEqual([])
  })

  it('works without a visual viewport, by doing nothing', () => {
    vi.stubGlobal('visualViewport', undefined)
    expect(() => composable.start()).not.toThrow()
    expect(() => composable.stop()).not.toThrow()
  })
})
