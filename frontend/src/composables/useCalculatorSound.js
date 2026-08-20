// AI-GENERATED — not an architecture reference

import { ref } from 'vue'

/**
 * The calculator's sounds, carried over from the PWA unchanged.
 *
 * The palette is tuned to A=432 and says something different for each kind of key rather
 * than clicking the same way for all of them: a digit and a refused digit are the two things
 * somebody at a till needs to tell apart without looking.
 *
 *   digits and the separator   432 -> 288   gliding, ~90 ms
 *   operators and functions    648 -> 432   gliding, ~90 ms  (a fifth above)
 *   "=" (it worked)            648          steady, ~300 ms
 *   warning (key refused)      432          three steady pulses
 *
 * ⚠️ Nothing is generated up front and no audio file is loaded: the tones are made by Web
 * Audio at the moment they are needed, which is also why this cannot run before the first
 * gesture -- browsers keep the context suspended until somebody has touched the page.
 */

const WARNING_GAP_SECONDS = 0.45

/**
 * ⚠️ `resume()` and `close()` answer with a promise -- except on the old WebKit prefix,
 * where they answer with nothing at all. Calling `.catch` on that throws a TypeError, which
 * the guard around the audio context then reads as "this device has no sound" and switches
 * the calculator silent for the rest of the session.
 */
const swallowRejection = (answer) => {
  if (answer && typeof answer.catch === 'function') {
    answer.catch(() => {})
  }
}

export const useCalculatorSound = (enabled) => {
  let context = null
  let lastWarningAt = -1
  const failed = ref(false)

  const audioContext = () => {
    if (failed.value) {
      return null
    }
    try {
      const Constructor = window.AudioContext || window.webkitAudioContext
      if (!Constructor) {
        failed.value = true
        return null
      }
      if (!context || context.state === 'closed') {
        /**
         * ⛔ Replaced, never revived. iOS closes a context of its own accord -- a phone
         * call, the tab frozen in the background -- and a closed context stays closed. Kept
         * around, every later key press would ask a dead device and the calculator would be
         * silent until the page happens to be rebuilt; this was "no sound until logging out
         * and back in" at the till, in the wallet and in the PWA alike.
         */
        context = new Constructor()
      }
      if (context.state !== 'running') {
        /**
         * ⚠️ Not only 'suspended'. WebKit parks a context on the non-standard state
         * 'interrupted' after a call or Siri, and a check for 'suspended' alone leaves it
         * there -- silent, with no error anywhere. Anything that is not running gets one
         * nudge; a state that cannot be resumed simply stays as it is.
         *
         * The promise is caught rather than awaited: a browser that refuses to resume must
         * not put an unhandled rejection on the page, and waiting for it would delay the
         * key press behind a device we do not need an answer from.
         */
        swallowRejection(context.resume())
      }
      return context
    } catch {
      // A browser that will not give us audio must not cost the calculation.
      failed.value = true
      return null
    }
  }

  /**
   * One tone, gliding from `from` to `to`. Equal values mean a steady note.
   *
   * `sharedCtx` lets a caller that already resolved the device pass it down -- the warning
   * plays three tones, and resolving (state check, resume nudge) once instead of four times
   * is what it saves.
   */
  const tone = (from, to, seconds, startAt, sharedCtx) => {
    const ctx = sharedCtx ?? audioContext()
    if (!ctx) {
      return
    }
    const at = startAt ?? ctx.currentTime
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(from, at)
    if (to && to !== from) {
      oscillator.frequency.exponentialRampToValueAtTime(to, at + Math.min(seconds, 0.08))
    }
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.09, at + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    /**
     * ⚠️ Let go when the tone is over. Without this every key press leaves a gain node
     * wired to the output for the life of the context -- a till that plays a few hundred
     * keys per shift accumulates a few hundred of them.
     */
    oscillator.onended = () => {
      oscillator.disconnect()
      gain.disconnect()
    }
    oscillator.start(at)
    oscillator.stop(at + seconds + 0.02)
  }

  const warn = () => {
    const ctx = audioContext()
    if (!ctx) {
      return
    }
    // ⚠️ Repeated refused keys must not stack: three pulses on top of three pulses is noise,
    // and somebody holding a key down would never hear where one warning ends.
    const now = ctx.currentTime
    if (lastWarningAt >= 0 && now - lastWarningAt < WARNING_GAP_SECONDS) {
      return
    }
    lastWarningAt = now
    const length = 0.11
    const gap = 0.06
    for (let i = 0; i < 3; i += 1) {
      tone(432, 432, length, now + i * (length + gap), ctx)
    }
  }

  /**
   * Plays what a key press earned. The calculator returns this from every entry point, so
   * each branch keeps its own sound -- a refusal sounds like a refusal because the branch
   * that refused says so, not because a handler guessed.
   */
  const play = (kind) => {
    if (!kind || !enabled.value) {
      return
    }
    if (kind === 'digit') {
      tone(432, 288, 0.09)
    } else if (kind === 'function') {
      tone(648, 432, 0.09)
    } else if (kind === 'equals') {
      tone(648, 648, 0.3)
    } else if (kind === 'warn') {
      warn()
    }
  }

  /** Lets go of the audio device when the page is left. */
  const stop = () => {
    if (context) {
      try {
        // ⚠️ `close` REJECTS on a context that is already closed, it does not throw, so the
        // catch below never sees it and the rejection would land on the page unhandled.
        swallowRejection(context.close())
      } catch {
        // a constructor-less or otherwise broken context must not cost the page
      }
      context = null
      /**
       * ⛔ The throttle is measured against `currentTime`, and a fresh AudioContext starts
       * that clock at zero. Left standing, the old stamp would be in the future of the new
       * clock, `now - lastWarningAt` would be negative -- below the gap either way -- and
       * every refused key would fall silent from then on.
       *
       * Today the only caller is `onUnmounted`, and the closure dies with the component, so
       * the fault cannot be reached. It is reset anyway: the property belongs to the pair
       * `close`/`currentTime`, not to a particular caller, and the refusal sound is the one
       * thing somebody at a till hears without looking. (coderabbit, PR #3771)
       */
      lastWarningAt = -1
    }
  }

  return { play, stop }
}
