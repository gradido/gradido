// AI-GENERATED — not an architecture reference
import { describe, expect, it, afterEach, vi } from 'vitest'
import { canMaskWithCss, pinInputType, PIN_MASK_CLASS } from './pinMasking'

/**
 * ⛔ The whole point is a field that is NOT a password field — and the one case where it
 * still has to be one. Both directions are here, because getting the fallback wrong shows a
 * PIN in the open at a counter, and nothing on the screen would say so.
 */
describe('pinMasking', () => {
  const withCssSupport = (answer) =>
    vi.stubGlobal('CSS', { supports: typeof answer === 'function' ? answer : () => answer })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('asks the browser whether it can hide characters', () => {
    const supports = vi.fn(() => true)
    withCssSupport(supports)

    expect(canMaskWithCss()).toBe(true)
    expect(supports).toHaveBeenCalledWith('-webkit-text-security', 'disc')
  })

  it('takes no for an answer', () => {
    withCssSupport(false)

    expect(canMaskWithCss()).toBe(false)
  })

  // Embedded webviews have been seen without it, and an exception here would take the whole
  // payment screen down.
  it('survives a browser without CSS.supports at all', () => {
    vi.stubGlobal('CSS', undefined)

    expect(canMaskWithCss()).toBe(false)
  })

  it('survives a CSS.supports that throws', () => {
    withCssSupport(() => {
      throw new Error('nope')
    })

    expect(canMaskWithCss()).toBe(false)
  })

  describe('pinInputType', () => {
    it('is a plain text field where CSS can hide it', () => {
      withCssSupport(true)

      expect(pinInputType()).toBe('text')
    })

    // ⛔ The fallback, and the reason the type is asked for rather than hard-coded: without
    // masking a text field would show the PIN at a counter. A password field is the lesser
    // evil there, password manager and all.
    it('falls back to a password field where CSS cannot', () => {
      withCssSupport(false)

      expect(pinInputType()).toBe('password')
    })

    it('is a text field when somebody asked to see the digits', () => {
      withCssSupport(false)

      expect(pinInputType(true)).toBe('text')
    })
  })

  it('names the class the stylesheet defines', () => {
    expect(PIN_MASK_CLASS).toBe('pin-masked')
  })
})
