// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach } from 'vitest'
import { MAP_PREF_ROOT, mapPrefPrefix, forgetLegacyMapPrefs } from './matchingPrefs'

/**
 * ⛔ The fault of 10.09.2026, found by Bernd at the device: fifteen map settings under one
 * flat prefix with no member in it, so they belonged to the BROWSER. A keep-offer switched
 * off once stayed off for every account after it; a search for "fahrrad" turned up for the
 * next member; and a second account carried the STREET NAME of the one before it, because
 * the map resolves its first search centre -- the member's own position -- to a place name.
 */
describe('matchingPrefs', () => {
  const ALICE = '76378cbb-6019-49e5-9c79-8a5be3f4a6fe'
  const BOB = '11112222-3333-4444-5555-666677778888'

  beforeEach(() => {
    window.localStorage.clear()
  })

  describe('mapPrefPrefix', () => {
    it('puts the member into the key', () => {
      expect(mapPrefPrefix(ALICE)).toBe(`${MAP_PREF_ROOT}${ALICE}.`)
    })

    it('gives two members two different homes', () => {
      expect(mapPrefPrefix(ALICE)).not.toBe(mapPrefPrefix(BOB))
    })

    // The whole fault, in one assertion: without a member there must be no key at all.
    // Falling back to the flat root would be the bug again, and at the worst moment --
    // when the store has not filled yet and nobody can say whose settings these are.
    it.each([[null], [undefined], ['']])('gives no prefix at all without a member (%s)', (id) => {
      expect(mapPrefPrefix(id)).toBeNull()
    })
  })

  describe('forgetLegacyMapPrefs', () => {
    const legacy = (name, value) => window.localStorage.setItem(MAP_PREF_ROOT + name, value)

    it('removes what the flat prefix left behind', () => {
      legacy('queryOfferNever', 'true')
      legacy('centerLabel', '"Gersdorfstrasse, Suedstadt"')
      legacy('query', '{"text":"fahrrad"}')

      expect(forgetLegacyMapPrefs()).toBe(3)

      expect(window.localStorage.getItem(`${MAP_PREF_ROOT}queryOfferNever`)).toBeNull()
      expect(window.localStorage.getItem(`${MAP_PREF_ROOT}centerLabel`)).toBeNull()
      expect(window.localStorage.getItem(`${MAP_PREF_ROOT}query`)).toBeNull()
    })

    // Both start with the same root; only what follows tells them apart. Sweeping the keyed
    // ones too would empty every member's map on every visit.
    it('leaves the keyed ones alone, whosever they are', () => {
      window.localStorage.setItem(`${mapPrefPrefix(ALICE)}look`, '"dunkel"')
      window.localStorage.setItem(`${mapPrefPrefix(BOB)}look`, '"hell"')
      legacy('look', '"normal"')

      expect(forgetLegacyMapPrefs()).toBe(1)

      expect(window.localStorage.getItem(`${mapPrefPrefix(ALICE)}look`)).toBe('"dunkel"')
      expect(window.localStorage.getItem(`${mapPrefPrefix(BOB)}look`)).toBe('"hell"')
    })

    it('touches nothing else in the browser -- the wallet and the admin share an origin', () => {
      window.localStorage.setItem('gradido-frontend', '{"token":"t"}')
      window.localStorage.setItem('calculator-parked-amount:' + ALICE, '12.5')
      legacy('radius', '50')

      expect(forgetLegacyMapPrefs()).toBe(1)

      expect(window.localStorage.getItem('gradido-frontend')).toBe('{"token":"t"}')
      expect(window.localStorage.getItem('calculator-parked-amount:' + ALICE)).toBe('12.5')
    })

    // Fifteen of them in the real page; the walk has to survive removing while it reads,
    // which is why the keys are collected first and removed after.
    it('removes all fifteen in one go', () => {
      const namen = [
        'breite',
        'center',
        'centerLabel',
        'cluster',
        'filters',
        'lens',
        'look',
        'mode',
        'profile',
        'query',
        'queryAnswered',
        'queryOfferNever',
        'radius',
        'sort',
        'view',
      ]
      for (const n of namen) legacy(n, '1')

      expect(forgetLegacyMapPrefs()).toBe(15)
      expect(Object.keys(window.localStorage).filter((k) => k.startsWith(MAP_PREF_ROOT))).toEqual(
        [],
      )
    })

    it('says nothing was there when nothing was', () => {
      expect(forgetLegacyMapPrefs()).toBe(0)
    })
  })
})
