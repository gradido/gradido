// AI-GENERATED — not an architecture reference
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { userKeptPicturesTable } from '../schemas'
import {
  dbCountUserKeptPicturesBesides,
  dbDeleteUserKeptPicture,
  dbSelectUserKeptPictureFull,
  dbSelectUserKeptPicturesSmall,
  dbUpsertUserKeptPicture,
  UserKeptPictureSubject,
} from './userKeptPictures'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// Two members and the people they keep pictures of; the subjects are all that matters here, no
// users rows are needed (the table carries no foreign key on purpose).
const ME = 1
const SOMEBODY_ELSE = 2
const COMMUNITY = '11111111-1111-4111-8111-111111111111'
const ANNA: UserKeptPictureSubject = {
  communityUuid: COMMUNITY,
  gradidoId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
}
const BERT: UserKeptPictureSubject = {
  communityUuid: COMMUNITY,
  gradidoId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
}

const keep = (userId: number, subject: UserKeptPictureSubject, small: string, full: string) =>
  dbUpsertUserKeptPicture({
    userId,
    subjectCommunityUuid: subject.communityUuid,
    subjectGradidoId: subject.gradidoId,
    pictureSmall: Buffer.from(small),
    pictureFull: Buffer.from(full),
    mimeType: 'image/jpeg',
  })

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(userKeptPicturesTable)
})
afterAll(async () => {
  await db.delete(userKeptPicturesTable)
  await appDB.destroy()
})
afterEach(async () => {
  await db.delete(userKeptPicturesTable)
})

describe('userKeptPictures query test', () => {
  it('keeps a picture and gives back both renditions', async () => {
    await keep(ME, ANNA, 'small anna', 'full anna')
    expect(await dbSelectUserKeptPicturesSmall(ME)).toEqual([
      {
        subjectCommunityUuid: ANNA.communityUuid,
        subjectGradidoId: ANNA.gradidoId,
        pictureSmall: Buffer.from('small anna'),
      },
    ])
    expect(await dbSelectUserKeptPictureFull(ME, ANNA)).toEqual({
      success: true,
      value: Buffer.from('full anna'),
    })
  })

  it('answers not found for a person the member keeps no picture of', async () => {
    const full = await dbSelectUserKeptPictureFull(ME, ANNA)
    expect(full.success).toBe(false)
    expect(await dbSelectUserKeptPicturesSmall(ME)).toEqual([])
  })

  it('replaces the picture when it is set again, in one row, and moves its date', async () => {
    await keep(ME, ANNA, 'first small', 'first full')
    const [first] = await db.select().from(userKeptPicturesTable)
    await new Promise((resolve) => setTimeout(resolve, 20))
    await keep(ME, ANNA, 'second small', 'second full')
    const rows = await db.select().from(userKeptPicturesTable)
    expect(rows).toHaveLength(1)
    expect(rows[0].pictureSmall).toEqual(Buffer.from('second small'))
    expect(rows[0].pictureFull).toEqual(Buffer.from('second full'))
    expect(rows[0].updatedAt.getTime()).toBeGreaterThan(first.updatedAt.getTime())
  })

  it("gives nobody else's picture -- each member keeps their own of the same person", async () => {
    await keep(SOMEBODY_ELSE, ANNA, 'theirs small', 'theirs full')
    expect(await dbSelectUserKeptPicturesSmall(ME)).toEqual([])
    expect((await dbSelectUserKeptPictureFull(ME, ANNA)).success).toBe(false)
    await keep(ME, ANNA, 'mine small', 'mine full')
    expect((await dbSelectUserKeptPicturesSmall(ME)).map((row) => row.pictureSmall)).toEqual([
      Buffer.from('mine small'),
    ])
    expect(await dbSelectUserKeptPictureFull(SOMEBODY_ELSE, ANNA)).toEqual({
      success: true,
      value: Buffer.from('theirs full'),
    })
  })

  it('finds the row whatever the case of the pair (the columns compare without it)', async () => {
    await keep(ME, ANNA, 'small', 'full')
    const shouted = {
      communityUuid: ANNA.communityUuid.toUpperCase(),
      gradidoId: ANNA.gradidoId.toUpperCase(),
    }
    expect((await dbSelectUserKeptPictureFull(ME, shouted)).success).toBe(true)
  })

  it('counts the pictures of other people than the one asked about', async () => {
    expect(await dbCountUserKeptPicturesBesides(ME, ANNA)).toBe(0)
    await keep(ME, ANNA, 'a', 'a')
    await keep(ME, BERT, 'b', 'b')
    await keep(SOMEBODY_ELSE, ANNA, 'c', 'c')
    // Anna's own row does not count against a new picture of her, Bert's does.
    expect(await dbCountUserKeptPicturesBesides(ME, ANNA)).toBe(1)
    expect(await dbCountUserKeptPicturesBesides(ME, BERT)).toBe(1)
    expect(
      await dbCountUserKeptPicturesBesides(ME, {
        communityUuid: COMMUNITY,
        gradidoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      }),
    ).toBe(2)
  })

  it("takes the picture away, and only this member's of this person", async () => {
    await keep(ME, ANNA, 'a', 'a')
    await keep(ME, BERT, 'b', 'b')
    await keep(SOMEBODY_ELSE, ANNA, 'c', 'c')
    await dbDeleteUserKeptPicture(ME, ANNA)
    expect((await dbSelectUserKeptPicturesSmall(ME)).map((row) => row.subjectGradidoId)).toEqual([
      BERT.gradidoId,
    ])
    expect((await dbSelectUserKeptPictureFull(SOMEBODY_ELSE, ANNA)).success).toBe(true)
  })

  it('takes away nothing where there is nothing, without failing', async () => {
    await expect(dbDeleteUserKeptPicture(ME, ANNA)).resolves.toBeUndefined()
  })
})
