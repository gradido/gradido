// AI-GENERATED — not an architecture reference
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { userNotesTable } from '../schemas'
import {
  dbDeleteUserNote,
  dbSelectUserNote,
  dbSelectUserNotesByUserId,
  dbUpsertUserNote,
  UserNoteSubject,
} from './userNotes'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// Two members, a person both may write about and a group; the subjects are all that matters
// here, no users rows are needed (the table carries no foreign key on purpose).
const ME = 1
const SOMEBODY_ELSE = 2
const COMMUNITY = '11111111-1111-4111-8111-111111111111'
const ANNA: UserNoteSubject = {
  kind: 'member',
  communityUuid: COMMUNITY,
  uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
}
const CAFE: UserNoteSubject = {
  kind: 'group',
  communityUuid: '',
  uuid: 'cafecafe-cafe-4afe-8afe-cafecafecafe',
}

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(userNotesTable)
})
afterAll(async () => {
  await db.delete(userNotesTable)
  await appDB.destroy()
})
afterEach(async () => {
  await db.delete(userNotesTable)
})

describe('userNotes query test', () => {
  it('answers null where the member keeps no note', async () => {
    expect(await dbSelectUserNote(ME, ANNA)).toBeNull()
  })

  it('keeps a note and gives it back', async () => {
    await dbUpsertUserNote(ME, ANNA, 'Anna Sonnenberg, Imkerin aus Pankow.')
    expect(await dbSelectUserNote(ME, ANNA)).toBe('Anna Sonnenberg, Imkerin aus Pankow.')
  })

  it('replaces the note when it is written again, in one row', async () => {
    await dbUpsertUserNote(ME, ANNA, 'first words')
    await dbUpsertUserNote(ME, ANNA, 'second words')
    expect(await dbSelectUserNote(ME, ANNA)).toBe('second words')
    expect(await db.select().from(userNotesTable)).toHaveLength(1)
  })

  it("gives nobody else's note -- each member keeps their own on the same person", async () => {
    await dbUpsertUserNote(SOMEBODY_ELSE, ANNA, 'what somebody else knows of Anna')
    expect(await dbSelectUserNote(ME, ANNA)).toBeNull()
    await dbUpsertUserNote(ME, ANNA, 'mine')
    expect(await dbSelectUserNote(ME, ANNA)).toBe('mine')
    expect(await dbSelectUserNote(SOMEBODY_ELSE, ANNA)).toBe('what somebody else knows of Anna')
  })

  it('keeps a person and a group apart, even under the same uuid', async () => {
    const groupWithAnnasUuid: UserNoteSubject = {
      kind: 'group',
      communityUuid: '',
      uuid: ANNA.uuid,
    }
    await dbUpsertUserNote(ME, ANNA, 'on Anna')
    await dbUpsertUserNote(ME, groupWithAnnasUuid, 'on a group')
    expect(await dbSelectUserNote(ME, ANNA)).toBe('on Anna')
    expect(await dbSelectUserNote(ME, groupWithAnnasUuid)).toBe('on a group')
  })

  it('keeps a note on a group', async () => {
    await dbUpsertUserNote(ME, CAFE, 'Treffen jeden ersten Samstag')
    expect(await dbSelectUserNote(ME, CAFE)).toBe('Treffen jeden ersten Samstag')
  })

  it('takes the note away, and taking it away again is no failure', async () => {
    await dbUpsertUserNote(ME, ANNA, 'soon gone')
    await dbUpsertUserNote(ME, CAFE, 'stays')
    await dbDeleteUserNote(ME, ANNA)
    expect(await dbSelectUserNote(ME, ANNA)).toBeNull()
    expect(await dbSelectUserNote(ME, CAFE)).toBe('stays')
    await dbDeleteUserNote(ME, ANNA)
    expect(await dbSelectUserNote(ME, ANNA)).toBeNull()
  })

  it('keeps a note as long as the server takes one, in letters that take four bytes each', async () => {
    // MESSAGE_MAX_CHARS (5000) as MaxLength counts them -- validator.js counts an emoji as one
    // character, where the wallet's field counts two: 5000 emoji, some 20,000 bytes in the `text`.
    const heavy = '🌱'.repeat(5000)
    await dbUpsertUserNote(ME, ANNA, heavy)
    expect(await dbSelectUserNote(ME, ANNA)).toBe(heavy)
  })

  it('lists every note of the member, and nobody else’s', async () => {
    await dbUpsertUserNote(ME, CAFE, 'on the café')
    await dbUpsertUserNote(ME, ANNA, 'on Anna')
    await dbUpsertUserNote(SOMEBODY_ELSE, ANNA, 'what somebody else knows of Anna')
    const mine = await dbSelectUserNotesByUserId(ME)
    expect(
      mine.map(({ subjectKind, subjectCommunityUuid, subjectUuid, note }) => ({
        subjectKind,
        subjectCommunityUuid,
        subjectUuid,
        note,
      })),
    ).toEqual([
      {
        subjectKind: 'group',
        subjectCommunityUuid: '',
        subjectUuid: CAFE.uuid,
        note: 'on the café',
      },
      {
        subjectKind: 'member',
        subjectCommunityUuid: COMMUNITY,
        subjectUuid: ANNA.uuid,
        note: 'on Anna',
      },
    ])
    expect(await dbSelectUserNotesByUserId(3)).toEqual([])
  })
})
