// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { distanceKm } from '@/composables/useMatches'
import {
  CHAT_HELLO_NEAR_KM,
  chatHelloDistance,
  chatHelloSignature,
  chatHelloText,
} from './chatHelloText'

// Künzelsau, and points to the north of it: one degree of latitude is 111.19 km on the sphere
// the wallet measures on, so a distance can be set to the metre.
const HOME = { lat: 49.28, lng: 9.69 }
const KM_PER_DEGREE = distanceKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })
const north = (km) => ({ lat: HOME.lat + km / KM_PER_DEGREE, lng: HOME.lng })

describe('chatHelloDistance', () => {
  it('stands on a sphere whose degree is 111.19 km (the measure of this file)', () => {
    expect(KM_PER_DEGREE).toBeCloseTo(111.195, 2)
    expect(distanceKm(HOME, north(9))).toBeCloseTo(9, 6)
  })

  it('names whole kilometres from five on, within the reach', () => {
    expect(chatHelloDistance({ home: HOME, theirs: north(9), reachKm: 25 })).toEqual({ km: 9 })
    expect(chatHelloDistance({ home: HOME, theirs: north(9.4), reachKm: 25 })).toEqual({ km: 9 })
    expect(chatHelloDistance({ home: HOME, theirs: north(9.6), reachKm: 25 })).toEqual({ km: 10 })
  })

  it('names no figure below five kilometres', () => {
    expect(CHAT_HELLO_NEAR_KM).toBe(5)
    expect(chatHelloDistance({ home: HOME, theirs: north(0.3), reachKm: 25 })).toEqual({
      near: true,
    })
    expect(chatHelloDistance({ home: HOME, theirs: north(4.99), reachKm: 25 })).toEqual({
      near: true,
    })
    // The same place: two members of one household.
    expect(chatHelloDistance({ home: HOME, theirs: { ...HOME }, reachKm: 25 })).toEqual({
      near: true,
    })
  })

  it('begins to name a figure at five kilometres exactly', () => {
    expect(chatHelloDistance({ home: HOME, theirs: north(5.01), reachKm: 25 })).toEqual({ km: 5 })
    expect(chatHelloDistance({ home: HOME, theirs: north(5.4), reachKm: 25 })).toEqual({ km: 5 })
  })

  it('says nothing beyond the reach, and still something right at it', () => {
    expect(chatHelloDistance({ home: HOME, theirs: north(24.9), reachKm: 25 })).toEqual({ km: 25 })
    expect(chatHelloDistance({ home: HOME, theirs: north(25.1), reachKm: 25 })).toBeNull()
    expect(chatHelloDistance({ home: HOME, theirs: north(600), reachKm: 25 })).toBeNull()
    // A wider reach of the member's own choosing is theirs to choose.
    expect(chatHelloDistance({ home: HOME, theirs: north(80), reachKm: 100 })).toEqual({ km: 80 })
  })

  it('says nothing beyond the reach even where the place is near: a reach under five', () => {
    expect(chatHelloDistance({ home: HOME, theirs: north(3), reachKm: 2 })).toBeNull()
    expect(chatHelloDistance({ home: HOME, theirs: north(1), reachKm: 2 })).toEqual({ near: true })
  })

  it('says nothing where one of the two places, or the reach, is not known', () => {
    const theirs = north(9)
    expect(chatHelloDistance({ home: null, theirs, reachKm: 25 })).toBeNull()
    expect(chatHelloDistance({ home: HOME, theirs: null, reachKm: 25 })).toBeNull()
    expect(chatHelloDistance({ home: {}, theirs, reachKm: 25 })).toBeNull()
    expect(chatHelloDistance({ home: HOME, theirs: { lat: 'x', lng: 9 }, reachKm: 25 })).toBeNull()
    expect(chatHelloDistance({ home: HOME, theirs, reachKm: undefined })).toBeNull()
    expect(chatHelloDistance({ home: HOME, theirs, reachKm: Number.NaN })).toBeNull()
    // No reach at all (the prop's default): nothing lies within it.
    expect(chatHelloDistance({ home: HOME, theirs, reachKm: 0 })).toBeNull()
  })
})

describe('chatHelloSignature', () => {
  it('is the user name', () => {
    expect(chatHelloSignature('Maren')).toBe('Maren')
  })

  it('is empty without one: nobody signs with an id, and no first name is put in', () => {
    expect(chatHelloSignature('')).toBe('')
    expect(chatHelloSignature(null)).toBe('')
    expect(chatHelloSignature(undefined)).toBe('')
    // Shorter than a user name can be: not one.
    expect(chatHelloSignature('ab')).toBe('')
    expect(chatHelloSignature('   ')).toBe('')
  })
})

describe('chatHelloText', () => {
  // The keys as they come, with what was handed in: the joining is what is measured here, the
  // words themselves in locales/chatHello.spec.js.
  const t = (key, named) => (named ? `${key}${JSON.stringify(named)}` : key)

  it('joins found, how far, the question and the signature, each once, by one space', () => {
    expect(
      chatHelloText(t, { name: 'Jens', signature: 'Maren', distance: { km: 9 }, locale: 'de' }),
    ).toBe('chatHello.found{"name":"Jens"} chatHello.distanceKm{"n":"9"} chatHello.question Maren')
  })

  it('says "not far" where no figure is named', () => {
    expect(chatHelloText(t, { name: 'Jens', signature: 'Maren', distance: { near: true } })).toBe(
      'chatHello.found{"name":"Jens"} chatHello.distanceNear chatHello.question Maren',
    )
  })

  it('leaves the distance out where there is none to say', () => {
    expect(chatHelloText(t, { name: 'Jens', signature: 'Maren', distance: null })).toBe(
      'chatHello.found{"name":"Jens"} chatHello.question Maren',
    )
    expect(chatHelloText(t, { name: 'Jens', signature: 'Maren' })).toBe(
      'chatHello.found{"name":"Jens"} chatHello.question Maren',
    )
  })

  it('ends with the question where there is no signature, without a space after it', () => {
    expect(chatHelloText(t, { name: 'Jens', distance: { km: 9 }, locale: 'de' })).toBe(
      'chatHello.found{"name":"Jens"} chatHello.distanceKm{"n":"9"} chatHello.question',
    )
    expect(chatHelloText(t, { name: 'Jens', signature: '', distance: null })).toBe(
      'chatHello.found{"name":"Jens"} chatHello.question',
    )
  })

  it("writes a large figure the way the wallet's language writes numbers", () => {
    const figure = (locale) =>
      chatHelloText((key, named) => named?.n ?? '', { name: '', distance: { km: 1234 }, locale })
        .trim()
        .replace(/\s+/g, ' ')
    expect(figure('de')).toBe('1.234')
    expect(figure('en')).toBe('1,234')
  })
})
