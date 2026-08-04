import { describe, it, expect } from 'vitest'
import { groupTagLabel, groupTagLabels, groupTagOption } from './groupTagLabel'

// ⚠️ The admin's form differs from the wallet's on purpose: it keeps the tag, because the
// tag is what identifies a mistyped one on an old contribution. A test on both sides is the
// only thing stopping the two from being "unified" by someone who sees them side by side.
describe('groupTagLabel', () => {
  it('writes name and tag together', () => {
    expect(groupTagLabel({ tag: 'music', name: 'Musik' })).toBe('Musik (#music)')
  })

  // An old inline hashtag adopted into a group can have no name yet.
  it('falls back to the bare tag when there is no name', () => {
    expect(groupTagLabel({ tag: 'sports', name: null })).toBe('#sports')
    expect(groupTagLabel({ tag: 'sports', name: '' })).toBe('#sports')
  })
})

describe('groupTagLabels', () => {
  it('lists several groups one after another', () => {
    expect(
      groupTagLabels([
        { tag: 'music', name: 'Musik' },
        { tag: 'sports', name: null },
      ]),
    ).toBe('Musik (#music), #sports')
  })

  it('survives an empty or missing list', () => {
    expect(groupTagLabels([])).toBe('')
    expect(groupTagLabels(null)).toBe('')
    expect(groupTagLabels(undefined)).toBe('')
  })
})

describe('groupTagOption', () => {
  // ⚠️ The value is the TAG, never the id. The whole feature keys on the canonical tag
  // string, so an option carrying an id would fail only once someone picks it.
  it('offers the tag as the value and the full label as the text', () => {
    expect(groupTagOption({ id: 7, tag: 'music', name: 'Musik' })).toEqual({
      value: 'music',
      text: 'Musik (#music)',
    })
  })
})
