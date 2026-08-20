// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref } from 'vue'
import { useCalculatorSound } from './useCalculatorSound'

/**
 * The sounds, and the two things about them that matter at a counter: a refused key must be
 * audible, and switching the sound off must be complete.
 *
 * ⚠️ jsdom has no Web Audio, so the device is stood in for here. That stand-in can say
 * nothing about how a tone SOUNDS -- what it can say is which branch asked for one, and that
 * is what every case below is about.
 */

let created
let gains
let currentTime

const makeContext = () => ({
  state: 'running',
  get currentTime() {
    return currentTime
  },
  createOscillator: () => {
    const oscillator = {
      type: '',
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }
    created.push(oscillator)
    return oscillator
  },
  createGain: () => {
    const gain = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }
    gains.push(gain)
    return gain
  },
  destination: {},
  resume: vi.fn(() => Promise.resolve()),
  close: vi.fn(),
})

describe('useCalculatorSound', () => {
  beforeEach(() => {
    created = []
    gains = []
    currentTime = 100
    window.AudioContext = vi.fn(makeContext)
  })

  afterEach(() => {
    delete window.AudioContext
    vi.restoreAllMocks()
  })

  it.each([['digit'], ['function'], ['equals']])('plays one tone for %s', (kind) => {
    useCalculatorSound(ref(true)).play(kind)
    expect(created).toHaveLength(1)
  })

  it('plays the warning as three pulses, so it cannot be mistaken for a key', () => {
    useCalculatorSound(ref(true)).play('warn')
    expect(created).toHaveLength(3)
  })

  it('stays silent when the sound is switched off', () => {
    const enabled = ref(false)
    const { play } = useCalculatorSound(enabled)
    play('digit')
    play('warn')
    expect(created).toHaveLength(0)
  })

  /** Held down keys must not stack three pulses on three pulses. */
  it('does not repeat the warning within the gap', () => {
    const { play } = useCalculatorSound(ref(true))
    play('warn')
    currentTime += 0.1
    play('warn')
    expect(created).toHaveLength(3)
  })

  it('warns again once the gap has passed', () => {
    const { play } = useCalculatorSound(ref(true))
    play('warn')
    currentTime += 1
    play('warn')
    expect(created).toHaveLength(6)
  })

  /**
   * ⛔ The throttle is measured against `currentTime`, and a fresh context starts that clock
   * at zero. Without the reset in `stop()`, the old stamp sits in the FUTURE of the new
   * clock and every refused key falls silent from then on -- the one signal somebody at a
   * till needs to hear without looking. (coderabbit, PR #3771)
   */
  it('can still warn after the device was let go and taken up again', () => {
    const { play, stop } = useCalculatorSound(ref(true))
    play('warn')
    expect(created).toHaveLength(3)

    stop()
    currentTime = 0
    play('warn')
    expect(created).toHaveLength(6)
  })

  /**
   * ⚠️ WebKit parks the device on the non-standard state 'interrupted' after a phone call
   * or Siri. A check for 'suspended' alone left it there -- no tone, no error, silent until
   * logging out and back in. That was the till's "sometimes no sound" in the wallet and the
   * PWA alike.
   */
  it('nudges a context iOS has interrupted', () => {
    const { play } = useCalculatorSound(ref(true))
    play('digit')
    const ctx = window.AudioContext.mock.results[0].value
    expect(ctx.resume).not.toHaveBeenCalled()

    ctx.state = 'interrupted'
    play('digit')
    expect(ctx.resume).toHaveBeenCalledTimes(1)
  })

  /**
   * ⛔ A context that reached 'closed' is dead for good -- iOS does that to a frozen tab.
   * Revival attempts change nothing; only a fresh device brings the sound back.
   */
  it('replaces a context that was closed under it', () => {
    const { play } = useCalculatorSound(ref(true))
    play('digit')
    expect(window.AudioContext).toHaveBeenCalledTimes(1)

    window.AudioContext.mock.results[0].value.state = 'closed'
    play('digit')
    expect(window.AudioContext).toHaveBeenCalledTimes(2)
    expect(created).toHaveLength(2)
  })

  /** The tone lets go of the output when it is over, or a shift's key presses pile up. */
  it('disconnects a finished tone', () => {
    useCalculatorSound(ref(true)).play('digit')
    expect(created[0].onended).toBeTypeOf('function')

    created[0].onended()
    expect(gains[0].disconnect).toHaveBeenCalled()
  })

  /** The warning is three tones but one device: resolved once, not four times. */
  it('resolves the device once for a whole warning', () => {
    window.AudioContext = vi.fn(() => ({ ...makeContext(), state: 'suspended' }))
    const { play } = useCalculatorSound(ref(true))
    play('warn')
    const ctx = window.AudioContext.mock.results[0].value
    expect(ctx.resume).toHaveBeenCalledTimes(1)
  })

  /**
   * ⛔ Old WebKit answers `resume()` and `close()` with NOTHING, where the standard answers
   * with a promise. Calling `.catch` on nothing throws, the guard around the audio device
   * reads that as "this browser has no sound", and the calculator goes silent for the rest
   * of the session -- on exactly the old iPhones a market stall is most likely to be using.
   */
  it('keeps its voice on a browser whose resume answers with nothing', () => {
    window.AudioContext = vi.fn(() => ({
      ...makeContext(),
      state: 'suspended',
      resume: () => undefined,
    }))
    const { play } = useCalculatorSound(ref(true))
    play('digit')
    play('digit')
    expect(created).toHaveLength(2)
  })

  /**
   * ⛔ `close` REJECTS on a context that is already closed -- it does not throw -- so the
   * try/catch around it never sees the rejection and it lands on the page unhandled. That
   * the answer is CAUGHT is the whole assertion here: a test that only checked `stop` does
   * not throw would stay green whatever happens, because the try/catch swallows the one
   * thing that could throw. (Measured: it did.)
   */
  it('catches what a closing device answers with, instead of letting it escape', () => {
    const answer = { catch: vi.fn() }
    window.AudioContext = vi.fn(() => ({ ...makeContext(), close: () => answer }))
    const { play, stop } = useCalculatorSound(ref(true))
    play('digit')
    stop()

    expect(answer.catch).toHaveBeenCalled()
  })

  /** …and a device that answers with nothing at all must not take the page down either. */
  it('lets go of a device whose close answers with nothing', () => {
    window.AudioContext = vi.fn(() => ({ ...makeContext(), close: () => undefined }))
    const { play, stop } = useCalculatorSound(ref(true))
    play('digit')
    expect(() => stop()).not.toThrow()
  })

  it('costs the calculation nothing when the browser has no audio at all', () => {
    delete window.AudioContext
    const { play, stop } = useCalculatorSound(ref(true))
    expect(() => play('digit')).not.toThrow()
    expect(() => stop()).not.toThrow()
  })
})
