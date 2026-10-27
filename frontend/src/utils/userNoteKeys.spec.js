// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import { noteKeyOfEntry, noteKeyOfGroup, noteKeyOfMember } from './userNoteKeys'

describe('userNoteKeys', () => {
  it('names a person and the entry of the note on them alike, whatever the spelling', () => {
    const fromRow = noteKeyOfMember({ communityUuid: 'Home-Uuid', gradidoID: 'Anna-ID' }, 'x')
    const fromEntry = noteKeyOfEntry(
      { communityUuid: 'home-uuid', gradidoID: 'anna-id', groupUuid: null },
      'x',
    )
    expect(fromRow).toBe('member:home-uuid/anna-id')
    expect(fromEntry).toBe(fromRow)
  })

  it('takes a member without a community for one of this community', () => {
    expect(noteKeyOfMember({ gradidoID: 'anna-id' }, 'HOME-UUID')).toBe('member:home-uuid/anna-id')
  })

  it('names a group and the entry of the note on it alike', () => {
    expect(noteKeyOfGroup('CAFE-UUID')).toBe('group:cafe-uuid')
    expect(
      noteKeyOfEntry({ communityUuid: null, gradidoID: null, groupUuid: 'cafe-uuid' }, 'x'),
    ).toBe('group:cafe-uuid')
  })

  it('never takes a person for a group of the same uuid', () => {
    expect(noteKeyOfMember({ communityUuid: 'c', gradidoID: 'same' }, 'c')).not.toBe(
      noteKeyOfGroup('same'),
    )
  })
})
