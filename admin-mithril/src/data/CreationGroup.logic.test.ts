// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { adoptionState, adoptionTotal, tagFromName } from './CreationGroup.logic'

const group = (hashtagsAdoptedAt: string | null, hashtagsAdoptedCount: number | null) => ({
  id: 1,
  tag: 'tag',
  name: null,
  hashtagsAdoptedAt,
  hashtagsAdoptedCount,
})

describe('tagFromName', () => {
  it('keeps letters with their accents and digits, lowercased', () => {
    expect(tagFromName('Größe Ålesund 42')).toBe('größe-ålesund-42')
  })

  it('makes one hyphen of a run of spaces and hyphens, none at the ends', () => {
    expect(tagFromName('  - Garden  -  Club -  ')).toBe('garden-club')
  })

  it('drops everything else', () => {
    expect(tagFromName('Fire & Rescue!')).toBe('fire-rescue')
  })
})

describe('adoptionState', () => {
  it('is unchecked where nobody looked', () => {
    expect(adoptionState(group(null, null))).toEqual({
      key: 'creationGroupsAdmin.adoption.stateUnchecked',
    })
  })

  it('tells how many were taken over, and when', () => {
    expect(adoptionState(group('2026-10-01T10:00:00.000Z', 3))).toEqual({
      key: 'creationGroupsAdmin.adoption.stateAdopted',
      date: new Date('2026-10-01T10:00:00.000Z'),
      count: 3,
    })
  })

  it('tells that none was found', () => {
    expect(adoptionState(group('2026-10-01T10:00:00.000Z', 0)).key).toBe(
      'creationGroupsAdmin.adoption.stateNothing',
    )
  })
})

describe('adoptionTotal', () => {
  it('counts the loose ones only where chosen', () => {
    expect(adoptionTotal({ exact: 2, loose: 1 }, true)).toBe(3)
    expect(adoptionTotal({ exact: 2, loose: 1 }, false)).toBe(2)
  })
})
