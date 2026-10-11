// AI-GENERATED — not an architecture reference

import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import { asksForNewEntry, ENTRIES_TO_ARRIVE, NEW_MATCHING_ENTRY } from './newMatchingEntry'

// The record the wallet's own routes carry for the three tabs (routes/routes.js).
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/matching/karte', component: { template: '<div />' } },
    { path: '/matching/:tab', component: { template: '<div />' } },
  ],
})
const at = (address) => router.resolve(address)

describe('the way to a new matching entry', () => {
  it('leads to the entries tab, with the wish in the address', () => {
    expect(at(NEW_MATCHING_ENTRY).fullPath).toBe('/matching/entries?new=entry')
  })

  // The two ends of one handover: what the tile links to is what the page takes for the wish.
  it('is read as the wish by the page it leads to', () => {
    expect(asksForNewEntry(at(NEW_MATCHING_ENTRY))).toBe(true)
  })

  it('is not read into the tab without it', () => {
    expect(asksForNewEntry(at('/matching/entries'))).toBe(false)
  })

  // The query goes with the tab.
  it.each([
    '/matching/about?new=entry',
    '/matching/position?new=entry',
    '/matching/karte?new=entry',
  ])('is not a wish at %s', (address) => {
    expect(asksForNewEntry(at(address))).toBe(false)
  })

  it.each([
    '/matching/entries?new=yes',
    '/matching/entries?new=',
    '/matching/entries?new',
    '/matching/entries?new=entry&new=entry',
    '/matching/entries?entry=new',
    '/matching/entries?findable=yes',
  ])('does not take %s for the wish', (address) => {
    expect(asksForNewEntry(at(address))).toBe(false)
  })

  it.each([null, undefined, {}, { params: {} }, { query: { new: 'entry' } }])(
    'says no to %p, which is no place at all',
    (route) => {
      expect(asksForNewEntry(route)).toBe(false)
    },
  )

  // The invitation names three things: what you look for, what you give, what you love.
  it('counts a member as arrived with three entries', () => {
    expect(ENTRIES_TO_ARRIVE).toBe(3)
  })
})
