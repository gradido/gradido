// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import { pageWithSearch } from './wayBackPage'

describe('pageWithSearch', () => {
  it('is the bare page where there is no search', () => {
    expect(pageWithSearch('/user', 'search', '')).toBe('/user')
  })

  it('names the search in the address, as the page reads it back', () => {
    const address = pageWithSearch('/creation-confirm', 'query', 'bibi@bloxberg.de')
    expect(address).toBe('/creation-confirm?query=bibi%40bloxberg.de')
    expect(new URL(address, 'https://admin.example').searchParams.get('query')).toBe(
      'bibi@bloxberg.de',
    )
  })

  // The way back checks the page for a space or a backslash (router/guards.ts): none may slip in.
  it('keeps a search whole, whatever it is made of, and puts no space in the address', () => {
    const search = 'a&b=c d#e+f'
    const address = pageWithSearch('/user', 'search', search)
    expect(address).not.toMatch(/[\s\\]/)
    expect(new URL(address, 'https://admin.example').searchParams.get('search')).toBe(search)
  })
})
