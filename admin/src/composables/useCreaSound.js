// A short "BaDong" chime played when Crea's evaluation arrives, so the moderator
// does not miss it. "Ba" is 324 Hz (a perfect fourth below), "Dong" is 432 Hz (the
// tonic the fourth resolves up into), which gently fades out. Pure sine tones,
// synthesised live via the Web Audio API -- no audio asset is shipped.

let audioContext = null

function getContext() {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!audioContext) {
    audioContext = new Ctx()
  }
  return audioContext
}

// Prime the context from within the user gesture that starts an evaluation, so the
// tone may play when the asynchronous result returns a moment later. Browsers block
// audio that is not tied to a gesture; once resumed the context keeps running.
export function primeCreaSound() {
  const ctx = getContext()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume()
  }
}

// One sine tone with a soft attack and a gentle exponential fade, finished with a
// short linear ramp to silence so it never clicks.
function playTone(ctx, freq, startAt, { attack, hold, tail, peak }) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, startAt)

  const g = gain.gain
  const fadeStart = startAt + attack + hold
  const end = fadeStart + tail
  g.setValueAtTime(0.0001, startAt)
  g.exponentialRampToValueAtTime(peak, startAt + attack)
  g.exponentialRampToValueAtTime(peak * 0.04, fadeStart + tail * 0.85)
  g.linearRampToValueAtTime(0.0001, end)

  osc.connect(gain).connect(ctx.destination)
  osc.start(startAt)
  osc.stop(end + 0.03)
}

export function playCreaSound() {
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
  const t0 = ctx.currentTime + 0.02
  // "Ba" -- 324 Hz, short.
  playTone(ctx, 324, t0, { attack: 0.008, hold: 0.08, tail: 0.055, peak: 0.32 })
  // "Dong" -- 432 Hz, gentle fade-out.
  playTone(ctx, 432, t0 + 0.155, { attack: 0.006, hold: 0.05, tail: 0.7, peak: 0.34 })
}
