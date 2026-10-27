// AI-GENERATED — not an architecture reference
import { isEmptyNote, userNoteEntryOf, userNoteSubjectOf } from './UserNote.logic'

const COMMUNITY = '11111111-1111-4111-8111-111111111111'
const ANNA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const CAFE = 'cafecafe-cafe-4afe-8afe-cafecafecafe'

describe('userNoteSubjectOf', () => {
  it('names a person by their community and gradido id', () => {
    expect(userNoteSubjectOf({ member: { gradidoID: ANNA } }, COMMUNITY)).toEqual({
      kind: 'member',
      communityUuid: COMMUNITY,
      uuid: ANNA,
    })
  })

  it('names a group by its uuid alone, whatever community it is handed', () => {
    expect(userNoteSubjectOf({ groupUuid: CAFE }, COMMUNITY)).toEqual({
      kind: 'group',
      communityUuid: '',
      uuid: CAFE,
    })
  })

  it('keeps every uuid in lower case, so that one subject is one row', () => {
    expect(
      userNoteSubjectOf({ member: { gradidoID: ANNA.toUpperCase() } }, COMMUNITY.toUpperCase()),
    ).toEqual({ kind: 'member', communityUuid: COMMUNITY, uuid: ANNA })
    expect(userNoteSubjectOf({ groupUuid: CAFE.toUpperCase() }, COMMUNITY)).toEqual({
      kind: 'group',
      communityUuid: '',
      uuid: CAFE,
    })
  })

  it('refuses an input that names neither a person nor a group', () => {
    expect(userNoteSubjectOf({}, COMMUNITY)).toBeNull()
    expect(userNoteSubjectOf({ member: null, groupUuid: '' }, COMMUNITY)).toBeNull()
  })

  it('refuses an input that names both', () => {
    expect(
      userNoteSubjectOf({ member: { gradidoID: ANNA }, groupUuid: CAFE }, COMMUNITY),
    ).toBeNull()
  })
})

describe('isEmptyNote', () => {
  it('takes a note of nothing but whitespace for empty', () => {
    expect(isEmptyNote('')).toBe(true)
    expect(isEmptyNote('  \n\t ')).toBe(true)
  })

  it('takes a note with words for a note', () => {
    expect(isEmptyNote(' Anna ')).toBe(false)
  })
})

describe('userNoteEntryOf', () => {
  const at = new Date('2026-10-27T10:00:00.000Z')

  it('names a person by the pair, and nothing of a group', () => {
    expect(
      userNoteEntryOf({
        userId: 1,
        subjectKind: 'member',
        subjectCommunityUuid: COMMUNITY,
        subjectUuid: ANNA,
        note: 'Anna Sonnenberg',
        createdAt: at,
        updatedAt: at,
      }),
    ).toEqual({
      communityUuid: COMMUNITY,
      gradidoID: ANNA,
      groupUuid: null,
      note: 'Anna Sonnenberg',
    })
  })

  it('names a group by its uuid, and nothing of a person', () => {
    expect(
      userNoteEntryOf({
        userId: 1,
        subjectKind: 'group',
        subjectCommunityUuid: '',
        subjectUuid: CAFE,
        note: 'Samstags',
        createdAt: at,
        updatedAt: at,
      }),
    ).toEqual({ communityUuid: null, gradidoID: null, groupUuid: CAFE, note: 'Samstags' })
  })
})
