// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import { hasRightSide, rightSideSlot } from './rightSide'

describe('rightSideSlot', () => {
  it('gives the booking list to the overview', () => {
    expect(rightSideSlot('/overview')).toBe('transactions')
  })

  it('answers for a section by its first segment', () => {
    expect(rightSideSlot('/contributions/contribute')).toBe('contributions')
    expect(rightSideSlot('/matching/entries')).toBe('matching')
    expect(rightSideSlot('/settings/gradido-card')).toBe('empty')
  })

  /**
   * ⛔ The list used to be the DEFAULT, so it stood beside every page that had no panel of
   * its own. The two code pages and the scanner are why this is a rule rather than a
   * tidy-up: they are held out to another person, and the member's last bookings were in
   * that person's field of view. (Bernd, 27.08.2026)
   */
  it.each([
    '/my-gradido-card',
    '/my-thank-you-card',
    '/scan',
    '/calculator',
    '/send',
    '/send/gradido.net/eva',
    '/transactions',
    '/gdt',
    '/information',
    '/usersearch',
  ])('leaves %s without one', (path) => {
    expect(rightSideSlot(path)).toBe('empty')
  })

  /**
   * ⚠️ A path a router really hands over: `/overview/` matches the `/overview` record. The
   * pattern this spec was first written against missed it and answered `empty` -- invisible
   * while the booking list was the DEFAULT, and the overview's column the moment it was not.
   */
  it.each(['/overview/', '/contributions/', '/matching/'])('reads %s as its section', (path) => {
    expect(rightSideSlot(path)).toBe(rightSideSlot(path.slice(0, -1)))
    expect(rightSideSlot(path)).not.toBe('empty')
  })

  // What a route cannot produce it still has to survive, because the layout asks on every
  // change.
  it('survives a path that names no section', () => {
    expect(rightSideSlot('/')).toBe('empty')
    expect(rightSideSlot('')).toBe('empty')
    expect(rightSideSlot(null)).toBe('empty')
    expect(rightSideSlot(undefined)).toBe('empty')
  })
})

describe('hasRightSide', () => {
  it('is the same answer, read as a yes or no', () => {
    expect(hasRightSide('/overview')).toBe(true)
    expect(hasRightSide('/matching/entries')).toBe(true)
    expect(hasRightSide('/transactions')).toBe(false)
    expect(hasRightSide('/settings')).toBe(false)
  })
})
