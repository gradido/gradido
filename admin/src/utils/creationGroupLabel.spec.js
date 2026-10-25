import { describe, expect, it } from 'vitest'
import { creationGroupLabel, creationGroupLabels, creationGroupOption } from './creationGroupLabel'

// The admin writes a group as the wallet does, by its name alone (Bernd, 25.10.2026: the
// hashtags in the menus "können ersatzlos wegfallen"); the tag only where there is no name.
describe('creationGroupLabel', () => {
  it('writes a group by its name alone', () => {
    expect(creationGroupLabel({ tag: 'music', name: 'Musik' })).toBe('Musik')
  })

  // An old inline hashtag adopted into a group can have no name yet.
  it('falls back to the bare tag when there is no name', () => {
    expect(creationGroupLabel({ tag: 'sports', name: null })).toBe('#sports')
    expect(creationGroupLabel({ tag: 'sports', name: '' })).toBe('#sports')
  })
})

describe('creationGroupLabels', () => {
  it('lists several groups one after another', () => {
    expect(
      creationGroupLabels([
        { tag: 'music', name: 'Musik' },
        { tag: 'sports', name: null },
      ]),
    ).toBe('Musik, #sports')
  })

  it('survives an empty or missing list', () => {
    expect(creationGroupLabels([])).toBe('')
    expect(creationGroupLabels(null)).toBe('')
    expect(creationGroupLabels(undefined)).toBe('')
  })
})

describe('creationGroupOption', () => {
  // ⚠️ The value is the TAG, never the id. The whole feature keys on the canonical tag
  // string, so an option carrying an id would fail only once someone picks it.
  it('offers the tag as the value and the name as the text', () => {
    expect(creationGroupOption({ id: 7, tag: 'music', name: 'Musik' })).toEqual({
      value: 'music',
      text: 'Musik',
    })
  })
})
