// AI-GENERATED — not an architecture reference
/**
 * Glow map — display core.
 *
 * Pure functions turning a match score into what the eye sees. No DOM, no Vue.
 *
 * Two things stay apart on purpose: the score is continuous (it sorts), while the
 * display snaps to four discrete steps (the eye cannot separate more than that on
 * a glow field). The snapping happens here, at the edge, so ranking loses nothing.
 *
 * The numbers below are calibrated against the seed corpus and confirmed by eye on
 * the living glow field. Do not tune them without re-running that check.
 */

export const CHANNELS = ['interesse', 'angebot', 'gesuch']

/**
 * The same three things carry two names, and mixing them up is silent.
 *
 * The server speaks `interest | offer | need`; everything the member sees is keyed
 * by `interesse | angebot | gesuch` — the locale block `matching.type.*`, the label
 * colours, the channel filters. A stored entry arrives in the server's words, so it
 * has to be translated before it may touch a locale key or a colour table.
 *
 * Getting this wrong does not throw: a locale lookup renders the raw key at the
 * member, and a colour lookup falls through to its default, so every dot turns the
 * same colour. Both happened. That is why the translation lives here, once, next to
 * the tables it feeds, instead of being written out again at each place that needs it.
 */
const ENTRY_TO_DISPLAY = { interest: 'interesse', offer: 'angebot', need: 'gesuch' }
const DISPLAY_TO_ENTRY = { interesse: 'interest', angebot: 'offer', gesuch: 'need' }

/** Server word -> display word. Passes a display word through unharmed. */
export function displayType(matchingType) {
  if (CHANNELS.includes(matchingType)) return matchingType
  return ENTRY_TO_DISPLAY[matchingType] ?? 'interesse'
}

/** Display word -> server word. */
export function entryType(type) {
  return DISPLAY_TO_ENTRY[type] ?? 'interest'
}

/**
 * What the search is currently pointed at, checked rather than trusted.
 *
 * The map remembers this between visits, which means the value outlives releases and
 * sits in storage a member can edit. Anything that is not a shape this code still
 * understands becomes "all my entries" - the one state that always works. A malformed
 * selection would otherwise reach the search, the menu and the keep offer at once,
 * and each of them would fail differently.
 *
 * Lives here rather than in the page because it is pure and because it is the part
 * that has to be provable: a page can be looked at, a fallback for a shape nobody
 * writes on purpose cannot.
 */
export function sanitizeSelection(stored) {
  if (stored?.kind === 'entry' && typeof stored.uuid === 'string' && stored.uuid) {
    return { kind: 'entry', uuid: stored.uuid }
  }
  if (
    stored?.kind === 'typed' &&
    typeof stored.text === 'string' &&
    stored.text.trim() &&
    CHANNELS.includes(stored.matchingType)
  ) {
    return {
      kind: 'typed',
      text: stored.text,
      details: typeof stored.details === 'string' ? stored.details : '',
      matchingType: stored.matchingType,
    }
  }
  return { kind: 'all' }
}

/**
 * Canonical peak colours. The mix is additive and means the same in every map
 * appearance: red + green = yellow, all three = white (the whole person).
 * Green sits at 204 and blue is lifted to 70/90 so the channels read equally
 * bright to the eye.
 */
export const CANON = {
  interesse: [255, 0, 0],
  angebot: [0, 204, 0],
  gesuch: [70, 90, 255],
  ganz: [255, 255, 255],
}

/**
 * Label colours — for the filter legend swatches and the profile dots, NOT the
 * glow markers. Red and blue stay the vibrant glow primaries: they were never
 * the problem, and Bernd likes them strong. Only the green is pulled towards
 * emerald — a touch of blue in it — so it parts clearly from the red for
 * red-green colour vision, which cannot tell pure red from pure green apart.
 * The markers keep CANON, because only clean R/G/B primaries mix additively
 * (red + green = yellow). Chosen by eye against both a dark and a light ground.
 */
export const LABEL_COLORS = {
  interesse: '#ff0000',
  angebot: '#10b981',
  gesuch: '#4658ff',
}

export const DEFAULTS = {
  // Below the cut a person shows as a grey presence ring, not as a match.
  cut: 0.17,
  // The three thresholds splitting the four steps.
  thresholds: [0.4, 0.52, 0.62],
  // Share of the peak colour per step. Step 1 starts high because anything
  // below roughly 0.3 is invisible against a dark ground.
  stageBright: [0.46, 0.64, 0.82, 1.0],
}

/** Score → step 0..4. Step 0 means "below the cut": no glow. */
export function scoreToStage(score, cfg = DEFAULTS) {
  const [t1, t2, t3] = cfg.thresholds
  // Every comparison below is false for NaN or a non-number, which would fall
  // through to the brightest step - a malformed strength would then read as a
  // perfect match. Unreadable means no glow, which is the honest direction.
  if (typeof score !== 'number' || Number.isNaN(score)) return 0
  if (score < cfg.cut) return 0
  if (score < t1) return 1
  if (score < t2) return 2
  if (score < t3) return 3
  return 4
}

/**
 * Breadth amplifier: +1 step per additional need answered, counting only needs
 * that reach step 2. A step-1 flicker does not count — otherwise someone who
 * barely grazes four needs would glow as bright as a perfect single match.
 */
export function applyBreite(baseStage, extraNeeds) {
  if (baseStage < 1) return 0
  return Math.min(4, baseStage + Math.max(0, extraNeeds))
}

export function stageBrightness(stage, cfg = DEFAULTS) {
  return stage <= 0 ? 0 : cfg.stageBright[stage - 1]
}

/**
 * One channel of one person → its step.
 *
 * `scores` holds one score per *own* entry this person answers on this channel.
 * The base is the best of them; breadth lifts it from there.
 */
export function channelStage(scores, cfg = DEFAULTS, breiteOn = false) {
  if (!scores || !scores.length) return 0
  const stages = scores.map((score) => scoreToStage(score, cfg))
  const base = Math.max(...stages)
  if (base < 1) return 0
  const atTwoPlus = stages.filter((stage) => stage >= 2).length
  return applyBreite(base, breiteOn ? Math.max(0, atTwoPlus - 1) : 0)
}

/** Steps per channel → the marker's colour, mixed additively. */
export function markerColor(channelStages, cfg = DEFAULTS) {
  let r = 0
  let g = 0
  let b = 0
  for (const channel of CHANNELS) {
    const stage = channelStages[channel] || 0
    if (stage > 0) {
      const share = stageBrightness(stage, cfg)
      r += CANON[channel][0] * share
      g += CANON[channel][1] * share
      b += CANON[channel][2] * share
    }
  }
  return [Math.min(255, Math.round(r)), Math.min(255, Math.round(g)), Math.min(255, Math.round(b))]
}

/** The strongest channel — drives the marker's size. */
export function peakStage(channelStages) {
  return Math.max(
    channelStages.interesse || 0,
    channelStages.angebot || 0,
    channelStages.gesuch || 0,
  )
}

/** Steps per channel for one person, honouring the channel filter. */
/**
 * The strengths a person shows per channel, read off their entries.
 *
 * Lives here rather than beside the data because it is display logic, and because
 * two callers need the same answer: whoever builds a match, and the focus lens,
 * which narrows a person's entries to the one question asked and must then let the
 * brightness follow. Were the lens to keep the old scores, a person would glow for
 * an entry the member just filtered away.
 */
export function scoresOf(channels) {
  const scores = {}
  for (const channel of CHANNELS) {
    const strengths = (channels?.[channel] || [])
      .map((entry) => entry.strength)
      .filter((strength) => strength !== null && strength !== undefined)
    if (strengths.length) scores[channel] = strengths
  }
  return scores
}

export function stagesOf(match, cfg = DEFAULTS, breiteOn = false, visible = null) {
  const stages = {}
  for (const channel of CHANNELS) {
    stages[channel] =
      visible && !visible[channel] ? 0 : channelStage(match.scores?.[channel], cfg, breiteOn)
  }
  return stages
}

// --- the list view --------------------------------------------------------
// The map renders the same information as light; a screen reader reads it as a
// line. These functions carry the score into text and order without ever naming
// a number, and speak a distance no more precisely than the person let themselves
// be found. Pure, like the rest of this file.

/**
 * Eight compass points as stable keys — the component maps each to a spoken word.
 * Kept to eight on purpose: that is the granularity a spoken bearing can honestly
 * carry, and the one that lets two people in the same direction cluster by ear.
 */
export const COMPASS8 = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']

/** Initial bearing from `from` to `to`, snapped to one of the eight points. */
export function bearing8(from, to) {
  const lat1 = (from.lat * Math.PI) / 180
  const lat2 = (to.lat * Math.PI) / 180
  const dLng = ((to.lng - from.lng) * Math.PI) / 180
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  const deg = (Math.atan2(y, x) * 180) / Math.PI
  const norm = ((deg % 360) + 360) % 360
  return COMPASS8[Math.round(norm / 45) % 8]
}

/**
 * How to speak a distance, honestly. The blur is a displacement the person chose,
 * already baked into the point we hold — so "near"/"etwa" is the disc in words,
 * and its coarseness follows the coarser of the two ends. Both ends precise → the
 * exact figure and a bearing from the start; otherwise a band, with a direction
 * only once it is far enough out to be trustworthy.
 *
 * @param {number} km  great-circle distance to the (published) point
 * @param {{ mine?: string, theirs?: string }} tiers  each 'genau' | 'ungefaehr'
 * @returns {{ band: 'exact'|'near'|'approx'|'far', km: number|null,
 *             showDirection: boolean, etwa: boolean }}
 */
export function describeDistance(km, tiers = {}) {
  const bothExact = tiers.mine === 'genau' && tiers.theirs === 'genau'
  if (bothExact) {
    const rounded = km < 10 ? Math.round(km * 10) / 10 : Math.round(km)
    return { band: 'exact', km: rounded, showDirection: true, etwa: false }
  }
  if (km < 5) return { band: 'near', km: null, showDirection: false, etwa: false }
  if (km < 10) return { band: 'approx', km: Math.round(km), showDirection: true, etwa: true }
  return { band: 'far', km: Math.round(km), showDirection: true, etwa: false }
}

/**
 * The list's sort intensity for one person — the same discrete peak the map glows
 * by, but with breadth counted only when the list is sorted by breadth, so picking
 * a list sort never quietly flips the map's amplifier.
 */
export function listPeak(match, sortMode = 'passung', visible = null) {
  return peakStage(stagesOf(match, DEFAULTS, sortMode === 'breite', visible))
}

/**
 * The strongest continuous score across the visible channels — a tiebreaker,
 * since the peak is only 0..4 and would otherwise leave many people level.
 */
export function topScore(match, visible = null) {
  let top = 0
  for (const channel of CHANNELS) {
    if (visible && !visible[channel]) continue
    for (const score of match.scores?.[channel] || []) {
      if (score > top) top = score
    }
  }
  return top
}
