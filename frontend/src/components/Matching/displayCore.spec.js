// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import {
  CANON,
  DEFAULTS,
  LABEL_COLORS,
  applyBreite,
  bearing8,
  channelStage,
  describeDistance,
  displayType,
  entryType,
  listPeak,
  markerColor,
  peakStage,
  sanitizeSelection,
  scoreToStage,
  scoresOf,
  stagesOf,
  topScore,
} from './displayCore'

// These tests pin the calibration. They are not here to prove the arithmetic —
// they are here so a later tweak to a threshold fails loudly instead of quietly
// changing what every user sees on the map.
describe('displayCore', () => {
  describe('scoreToStage', () => {
    it('leaves anything below the cut dark', () => {
      expect(scoreToStage(0.16, DEFAULTS)).toBe(0)
    })

    it('starts glowing at the cut', () => {
      expect(scoreToStage(0.17, DEFAULTS)).toBe(1)
    })

    it('splits the four steps at 0.40 / 0.52 / 0.62', () => {
      expect(scoreToStage(0.399, DEFAULTS)).toBe(1)
      expect(scoreToStage(0.4, DEFAULTS)).toBe(2)
      expect(scoreToStage(0.52, DEFAULTS)).toBe(3)
      expect(scoreToStage(0.62, DEFAULTS)).toBe(4)
    })

    it('gives an outstanding single match the full glow', () => {
      expect(scoreToStage(0.8903, DEFAULTS)).toBe(4)
    })
  })

  describe('applyBreite', () => {
    it('lifts one step per additional need', () => {
      expect(applyBreite(2, 1)).toBe(3)
      expect(applyBreite(2, 2)).toBe(4)
    })

    it('caps at the top step', () => {
      expect(applyBreite(3, 5)).toBe(4)
    })

    it('never lifts someone who is below the cut', () => {
      expect(applyBreite(0, 3)).toBe(0)
    })
  })

  describe('channelStage', () => {
    it('takes the best match as the base', () => {
      expect(channelStage([0.2, 0.55], DEFAULTS, false)).toBe(3)
    })

    it('lets breadth lift three middling needs to the top', () => {
      expect(channelStage([0.41, 0.45, 0.49], DEFAULTS, true)).toBe(4)
    })

    it('leaves them at their base when breadth is off', () => {
      expect(channelStage([0.41, 0.45, 0.49], DEFAULTS, false)).toBe(2)
    })

    it('does not let a step-1 flicker count as breadth', () => {
      expect(channelStage([0.2, 0.19], DEFAULTS, true)).toBe(1)
    })

    it('leaves a perfect single match at the top rather than overflowing', () => {
      expect(channelStage([0.89], DEFAULTS, true)).toBe(4)
    })

    it('treats no scores as no match', () => {
      expect(channelStage([], DEFAULTS, true)).toBe(0)
      expect(channelStage(undefined, DEFAULTS, true)).toBe(0)
    })
  })

  describe('markerColor', () => {
    it('shows a single channel in its own colour', () => {
      expect(markerColor({ angebot: 4 }, DEFAULTS)).toEqual(CANON.angebot)
    })

    it('mixes two channels additively into a second colour', () => {
      expect(markerColor({ interesse: 4, angebot: 4 }, DEFAULTS)).toEqual([255, 204, 0])
    })

    it('turns the whole person white', () => {
      expect(markerColor({ interesse: 4, angebot: 4, gesuch: 4 }, DEFAULTS)).toEqual(CANON.ganz)
    })

    it('dims a weaker step without changing its hue', () => {
      const [r, g, b] = markerColor({ angebot: 1 }, DEFAULTS)
      expect(r).toBe(0)
      expect(b).toBe(0)
      expect(g).toBeGreaterThan(0)
      expect(g).toBeLessThan(CANON.angebot[1])
    })

    it('shows nothing when no channel matches', () => {
      expect(markerColor({}, DEFAULTS)).toEqual([0, 0, 0])
    })
  })

  describe('peakStage', () => {
    it('follows the strongest channel', () => {
      expect(peakStage({ interesse: 1, angebot: 3, gesuch: 2 })).toBe(3)
      expect(peakStage({})).toBe(0)
    })
  })

  describe('stagesOf', () => {
    const match = { scores: { angebot: [0.55], interesse: [0.2] } }

    it('reads every channel of a person', () => {
      expect(stagesOf(match, DEFAULTS, false)).toEqual({ interesse: 1, angebot: 3, gesuch: 0 })
    })

    it('drops a channel the filter hides', () => {
      const visible = { interesse: false, angebot: true, gesuch: true }
      expect(stagesOf(match, DEFAULTS, false, visible)).toEqual({
        interesse: 0,
        angebot: 3,
        gesuch: 0,
      })
    })
  })

  // The list view. Same score, read as text and order instead of shown as light.
  describe('bearing8', () => {
    const here = { lat: 0, lng: 0 }

    it('snaps the four cardinals', () => {
      expect(bearing8(here, { lat: 1, lng: 0 })).toBe('n')
      expect(bearing8(here, { lat: 0, lng: 1 })).toBe('e')
      expect(bearing8(here, { lat: -1, lng: 0 })).toBe('s')
      expect(bearing8(here, { lat: 0, lng: -1 })).toBe('w')
    })

    it('snaps a diagonal to its eighth', () => {
      expect(bearing8(here, { lat: 1, lng: 1 })).toBe('ne')
      expect(bearing8(here, { lat: -1, lng: -1 })).toBe('sw')
    })
  })

  describe('describeDistance', () => {
    const approx = { mine: 'genau', theirs: 'ungefaehr' }
    const exact = { mine: 'genau', theirs: 'genau' }

    it('keeps the near band silent and directionless when a side is blurred', () => {
      expect(describeDistance(4.9, approx)).toEqual({
        band: 'near',
        km: null,
        showDirection: false,
        etwa: false,
      })
    })

    it('adds "etwa" and a direction from five kilometres out', () => {
      expect(describeDistance(6.4, approx)).toEqual({
        band: 'approx',
        km: 6,
        showDirection: true,
        etwa: true,
      })
    })

    it('drops the "etwa" from ten kilometres, where two off change nothing', () => {
      expect(describeDistance(12.6, approx)).toEqual({
        band: 'far',
        km: 13,
        showDirection: true,
        etwa: false,
      })
    })

    it('speaks the exact figure and a bearing when both sides are precise', () => {
      expect(describeDistance(1.53, exact)).toEqual({
        band: 'exact',
        km: 1.5,
        showDirection: true,
        etwa: false,
      })
    })

    it('rounds an exact figure to whole kilometres once it is far', () => {
      expect(describeDistance(42.3, exact).km).toBe(42)
    })
  })

  describe('listPeak', () => {
    const twoNeeds = { scores: { angebot: [0.41, 0.45] } }

    it('ranks by the same peak the map glows by', () => {
      expect(listPeak({ scores: { angebot: [0.55] } }, 'passung')).toBe(3)
    })

    it('counts breadth only when the sort asks for it', () => {
      expect(listPeak(twoNeeds, 'passung')).toBe(2)
      expect(listPeak(twoNeeds, 'breite')).toBe(3)
    })
  })

  describe('topScore', () => {
    const match = { scores: { angebot: [0.4, 0.55], interesse: [0.2] } }

    it('takes the strongest score across the visible channels', () => {
      expect(topScore(match)).toBeCloseTo(0.55)
    })

    it('ignores a channel the filter hides', () => {
      expect(topScore(match, { interesse: true, angebot: false, gesuch: true })).toBeCloseTo(0.2)
    })
  })

  describe('scoresOf', () => {
    // The focus lens narrows a person to the entries answering ONE question and
    // then rebuilds their scores from what is left. If this ever read anything but
    // the entries handed to it, a person would keep glowing for an entry the member
    // just filtered away.
    it('reads one strength per matched entry, per channel', () => {
      const channels = {
        angebot: [{ strength: 0.4 }, { strength: 0.55 }],
        interesse: [{ strength: 0.2 }],
      }

      expect(scoresOf(channels)).toEqual({ angebot: [0.4, 0.55], interesse: [0.2] })
    })

    it('leaves out the entries that answer nothing', () => {
      // A profile carries every entry a person published; only the matched ones
      // carry a strength, and only those may reach the brightness.
      const channels = { angebot: [{ strength: 0.4 }, { strength: null }, {}] }

      expect(scoresOf(channels)).toEqual({ angebot: [0.4] })
    })

    it('drops a channel with nothing matched, rather than reporting it empty', () => {
      expect(scoresOf({ angebot: [{ strength: null }] })).toEqual({})
    })

    it('answers an empty object for nothing at all', () => {
      expect(scoresOf({})).toEqual({})
      expect(scoresOf(null)).toEqual({})
    })
  })

  // The two vocabularies are the quiet kind of mistake: nothing throws, a locale key
  // renders as itself and a colour falls through to its default. These pin the
  // translation so a stored entry can always reach a locale key and a colour table.
  describe('the two words for one channel', () => {
    it('turns the server is words into the words the member sees', () => {
      expect(displayType('interest')).toBe('interesse')
      expect(displayType('offer')).toBe('angebot')
      expect(displayType('need')).toBe('gesuch')
    })

    it('turns them back for the server', () => {
      expect(entryType('interesse')).toBe('interest')
      expect(entryType('angebot')).toBe('offer')
      expect(entryType('gesuch')).toBe('need')
    })

    it('lets a display word through unharmed, so a double translation cannot bite', () => {
      expect(displayType('gesuch')).toBe('gesuch')
      expect(displayType(displayType('need'))).toBe('gesuch')
    })

    it('lands on a real colour for every server word', () => {
      // The failure this guards is exactly the one that shipped: an untranslated
      // word misses the table and every dot comes out the same colour.
      const colours = ['interest', 'offer', 'need'].map((t) => LABEL_COLORS[displayType(t)])

      expect(colours.every(Boolean)).toBe(true)
      expect(new Set(colours).size).toBe(3)
    })
  })

  // The map remembers what the search is pointed at, so this value survives releases
  // and sits where a member could edit it. Every rejected shape here is one that would
  // otherwise reach the search, the menu and the keep offer at once.
  describe('a remembered selection', () => {
    it('keeps a typed question whole', () => {
      expect(
        sanitizeSelection({
          kind: 'typed',
          text: 'ein Fahrrad',
          details: 'gebraucht',
          matchingType: 'gesuch',
        }),
      ).toEqual({
        kind: 'typed',
        text: 'ein Fahrrad',
        details: 'gebraucht',
        matchingType: 'gesuch',
      })
    })

    it('keeps a chosen entry of mine', () => {
      expect(sanitizeSelection({ kind: 'entry', uuid: 'abc' })).toEqual({
        kind: 'entry',
        uuid: 'abc',
      })
    })

    it('fills in particulars that were never stored', () => {
      // The field is younger than the stored shape, so a value written before it
      // existed has to arrive as an empty string rather than as undefined.
      expect(
        sanitizeSelection({ kind: 'typed', text: 'ein Fahrrad', matchingType: 'gesuch' }).details,
      ).toBe('')
    })

    it('falls back to everything when the shape is not one we still understand', () => {
      const bad = [
        null,
        undefined,
        'ein Fahrrad',
        { kind: 'typed', text: 'ein Fahrrad', matchingType: 'need' }, // server word, not ours
        { kind: 'typed', text: '   ', matchingType: 'gesuch' },
        { kind: 'typed', matchingType: 'gesuch' },
        { kind: 'entry' },
        { kind: 'entry', uuid: '' },
        { kind: 'somethingElse' },
      ]

      for (const stored of bad) {
        expect(sanitizeSelection(stored)).toEqual({ kind: 'all' })
      }
    })

    it('does not carry anything extra across', () => {
      // What comes out is built here, never passed through - so a key from an older
      // release, or one somebody added by hand, cannot ride along into the page.
      const out = sanitizeSelection({
        kind: 'entry',
        uuid: 'abc',
        seekerUserId: 42,
      })

      expect(out).not.toHaveProperty('seekerUserId')
    })
  })
})
