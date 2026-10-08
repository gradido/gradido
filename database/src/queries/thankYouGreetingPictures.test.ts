// AI-GENERATED — not an architecture reference
import { inArray } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { DBDuplicateEntryError, DBNotFoundError } from '../errorTypes'
import {
  ThankYouGreetingPictureInsert,
  thankYouGreetingPicturesTable,
  thankYouGreetingsTable,
  transactionLinksTable,
  usersTable,
} from '../schemas'
import {
  dbDeleteThankYouGreetingPicturesByLinkCode,
  dbInsertThankYouGreetingPicture,
  dbSelectThankYouGreetingPictureImage,
  dbSelectThankYouGreetingPicturesByLinkCode,
  dbSelectThankYouGreetingPicturesByLinkId,
} from './thankYouGreetingPictures'
import {
  dbInsertThankYouGreeting,
  dbSelectThankYouGreetingsByLinkCodes,
  dbSelectThankYouGreetingsByLinkIds,
} from './thankYouGreetings'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// Links with ids far from any other test's, and codes as createTransactionLink makes them: 24
// hex characters, with letters in them.
const SARAH_LINK = { id: 881001, code: 'a1f9c2d41b7e19981fa0d001' }
const SMALL_ONLY_LINK = { id: 881002, code: 'b2e0d5a2996c19981fa0d002' }
const MOTIF_LINK = { id: 881003, code: 'c3d1e6b3447d19981fa0d003' }
const DELETED_LINK = { id: 881004, code: 'd4c2f7c4558e19981fa0d004' }
const ACCEPTED_LINK = { id: 881005, code: 'e5b3a8d5669f19981fa0d005' }
// Two links of one code: the column carries no unique key.
const TWIN_LINK = { id: 881006, code: 'f6a4b9e6770a19981fa0d006' }
const OTHER_TWIN_LINK = { id: 881007, code: TWIN_LINK.code }
// An open link of a member whose account was deleted, and one whose maker has no row at all.
const GONE_MAKER_LINK = { id: 881008, code: 'a9d7e2b9aa3d19981fa0d009' }
const NO_MAKER_LINK = { id: 881009, code: 'bae8f3cabb4e19981fa0d00a' }
const LINKS = [
  SARAH_LINK,
  SMALL_ONLY_LINK,
  MOTIF_LINK,
  DELETED_LINK,
  ACCEPTED_LINK,
  TWIN_LINK,
  OTHER_TWIN_LINK,
  GONE_MAKER_LINK,
  NO_MAKER_LINK,
]
const NO_SUCH_LINK = 881099
// A picture whose link was never saved (createTransactionLink files the picture first).
const ORPHAN_CODE = 'a7b5c0f7881b19981fa0d007'
const UNKNOWN_CODE = 'b8c6d1a8992c19981fa0d008'
const CODES = [...LINKS.map((link) => link.code), ORPHAN_CODE]

const MAKER = 881011
const ACCEPTED_BY = 881012
// A member whose account a moderator deleted, and an id no member has.
const GONE_MAKER = 881013
const NO_MAKER = 881019
const MAKER_DELETED_AT = new Date('2026-10-06T08:00:00.000Z')
const HOME_COMMUNITY = '11111111-1111-4111-8111-111111111111'
const gid = (id: number) => `00000000-0000-4000-8000-000000${id}`
const makerOf = (link: { id: number }) =>
  link === GONE_MAKER_LINK ? GONE_MAKER : link === NO_MAKER_LINK ? NO_MAKER : MAKER
const VALID_UNTIL = new Date('2026-10-17T14:00:00.000Z')
const ACCEPTED_AT = new Date('2026-10-04T09:30:00.000Z')
const DELETED_AT = new Date('2026-10-05T10:15:00.000Z')

// Two pictures that differ, so a query that hands back the wrong one cannot pass.
const JPEG_SMALL = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0xff, 0xd9])
const JPEG_LARGE = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10, 0x45, 0x78, 0x69, 0xff, 0xd9])

const small = (
  transactionLinkCode: string,
  rest: Partial<ThankYouGreetingPictureInsert> = {},
): ThankYouGreetingPictureInsert => ({
  transactionLinkCode,
  rendition: 'small',
  width: 831,
  height: 577,
  image: JPEG_SMALL,
  mimeType: 'image/jpeg',
  ...rest,
})

const large = (
  transactionLinkCode: string,
  rest: Partial<ThankYouGreetingPictureInsert> = {},
): ThankYouGreetingPictureInsert => ({
  transactionLinkCode,
  rendition: 'large',
  width: 1080,
  height: 750,
  image: JPEG_LARGE,
  mimeType: 'image/jpeg',
  ...rest,
})

const renditionsOf = (
  found: Awaited<ReturnType<typeof dbSelectThankYouGreetingPicturesByLinkCode>>,
) => (found?.pictures ?? []).map((picture) => picture.rendition).sort()

/** The statements a function sends, as the pool gets them. */
const statementsOf = async (run: () => Promise<unknown>): Promise<string[]> => {
  const pool = (drizzleDb() as any).$client
  const original = pool.query
  const caught: string[] = []
  pool.query = function (query: any, ...rest: unknown[]) {
    caught.push(typeof query === 'string' ? query : query.sql)
    return original.call(this, query, ...rest)
  }
  try {
    await run()
  } finally {
    pool.query = original
  }
  return caught
}

const cleanUp = async (): Promise<void> => {
  await db.delete(transactionLinksTable).where(
    inArray(
      transactionLinksTable.id,
      LINKS.map((link) => link.id),
    ),
  )
  await db.delete(usersTable).where(inArray(usersTable.id, [MAKER, GONE_MAKER]))
  await db
    .delete(thankYouGreetingPicturesTable)
    .where(inArray(thankYouGreetingPicturesTable.transactionLinkCode, CODES))
  await db
    .delete(thankYouGreetingsTable)
    .where(inArray(thankYouGreetingsTable.transactionLinkCode, CODES))
}

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await cleanUp()
  // The readers name the member who made a link: a row for the one whose account stands, and
  // one for the member whose account is deleted. (Raw rows, with what the schema requires.)
  await db.insert(usersTable).values([
    { id: MAKER, gradidoId: gid(MAKER), communityUuid: HOME_COMMUNITY },
    {
      id: GONE_MAKER,
      gradidoId: gid(GONE_MAKER),
      communityUuid: HOME_COMMUNITY,
      deletedAt: MAKER_DELETED_AT,
    },
  ])
  await db.insert(transactionLinksTable).values(
    LINKS.map((link) => ({
      ...link,
      userId: makerOf(link),
      memo: 'Einfach so — weil es Dich gibt.',
      createdAt: new Date('2026-10-03T14:00:00Z'),
      validUntil: VALID_UNTIL,
      redeemedAt: link === ACCEPTED_LINK ? ACCEPTED_AT : null,
      redeemedBy: link === ACCEPTED_LINK ? ACCEPTED_BY : null,
      deletedAt: link === DELETED_LINK ? DELETED_AT : null,
    })),
  )
})
afterAll(async () => {
  await cleanUp()
  await appDB.destroy()
})

describe('thankYouGreetingPictures query test', () => {
  it('knows nothing of a link no picture is filed for', async () => {
    expect(await dbSelectThankYouGreetingPicturesByLinkCode(SARAH_LINK.code)).toBeNull()
    expect(await dbSelectThankYouGreetingPicturesByLinkId(SARAH_LINK.id)).toBeNull()
  })

  it('files the small rendition and the large one of a link', async () => {
    expect(await dbInsertThankYouGreetingPicture(small(SARAH_LINK.code))).toEqual({ success: true })
    expect(await dbInsertThankYouGreetingPicture(large(SARAH_LINK.code))).toEqual({ success: true })
    expect(await dbInsertThankYouGreetingPicture(small(SMALL_ONLY_LINK.code))).toEqual({
      success: true,
    })
  })

  it('says what is known about the pictures of a link by its code, and names the link', async () => {
    const found = await dbSelectThankYouGreetingPicturesByLinkCode(SARAH_LINK.code)

    expect(found?.link).toEqual({
      id: SARAH_LINK.id,
      code: SARAH_LINK.code,
      userId: MAKER,
      validUntil: VALID_UNTIL,
      redeemedAt: null,
      redeemedBy: null,
      deletedAt: null,
    })
    const pictures = [...(found?.pictures ?? [])].sort((a, b) =>
      a.rendition.localeCompare(b.rendition),
    )
    expect(pictures).toEqual([
      { id: expect.any(Number), rendition: 'large', width: 1080, height: 750 },
      { id: expect.any(Number), rendition: 'small', width: 831, height: 577 },
    ])
    // The picture itself is not among what is known about it.
    for (const picture of pictures) {
      expect(Object.keys(picture).sort()).toEqual(['height', 'id', 'rendition', 'width'])
    }
  })

  it('says the same by the id of the link', async () => {
    expect(await dbSelectThankYouGreetingPicturesByLinkId(SARAH_LINK.id)).toEqual(
      await dbSelectThankYouGreetingPicturesByLinkCode(SARAH_LINK.code),
    )
    expect(
      renditionsOf(await dbSelectThankYouGreetingPicturesByLinkId(SMALL_ONLY_LINK.id)),
    ).toEqual(['small'])
  })

  // The code is compared the way the column compares it, without regard to case -- as the page
  // of a link finds the link.
  it('finds the pictures of a code written in capitals', async () => {
    const found = await dbSelectThankYouGreetingPicturesByLinkCode(SARAH_LINK.code.toUpperCase())
    expect(/[a-f]/.test(SARAH_LINK.code)).toBe(true)
    expect(found?.link.id).toBe(SARAH_LINK.id)
  })

  it('hands out each rendition by the id of its row, and only that one', async () => {
    const found = await dbSelectThankYouGreetingPicturesByLinkCode(SARAH_LINK.code)
    const idOf = (rendition: string) =>
      found?.pictures.find((picture) => picture.rendition === rendition)?.id ?? 0

    expect(await dbSelectThankYouGreetingPictureImage(idOf('small'))).toEqual({
      success: true,
      value: JPEG_SMALL,
    })
    expect(await dbSelectThankYouGreetingPictureImage(idOf('large'))).toEqual({
      success: true,
      value: JPEG_LARGE,
    })
  })

  it('says not found for an id no picture has', async () => {
    const found = await dbSelectThankYouGreetingPictureImage(0)
    expect(found.success).toBe(false)
    if (!found.success) {
      expect(found.error).toBeInstanceOf(DBNotFoundError)
    }
  })

  it('refuses a second picture of the same rendition and leaves the first as it is', async () => {
    const again = await dbInsertThankYouGreetingPicture(
      large(SARAH_LINK.code, { width: 900, height: 625, image: JPEG_SMALL }),
    )

    expect(again.success).toBe(false)
    if (!again.success) {
      expect(again.error).toBeInstanceOf(DBDuplicateEntryError)
      // What the error says goes into a log: the code and the rendition, never the picture.
      expect(again.error.message).toContain(SARAH_LINK.code)
      expect(again.error.message).toContain('large')
      expect(JSON.stringify(again.error)).not.toContain(JPEG_SMALL.toString('base64'))
    }
    const found = await dbSelectThankYouGreetingPicturesByLinkCode(SARAH_LINK.code)
    expect(found?.pictures.find((picture) => picture.rendition === 'large')).toMatchObject({
      width: 1080,
      height: 750,
    })
  })

  it('knows nothing of a greeting with a motif, of an unknown code and of an unknown id', async () => {
    expect(
      await dbInsertThankYouGreeting({ transactionLinkCode: MOTIF_LINK.code, motif: 'bouquet' }),
    ).toEqual({ success: true })

    expect(await dbSelectThankYouGreetingPicturesByLinkCode(MOTIF_LINK.code)).toBeNull()
    expect(await dbSelectThankYouGreetingPicturesByLinkId(MOTIF_LINK.id)).toBeNull()
    expect(await dbSelectThankYouGreetingPicturesByLinkCode(UNKNOWN_CODE)).toBeNull()
    expect(await dbSelectThankYouGreetingPicturesByLinkId(NO_SUCH_LINK)).toBeNull()
  })

  it('knows nothing of a picture whose link was never saved', async () => {
    expect(await dbInsertThankYouGreetingPicture(small(ORPHAN_CODE))).toEqual({ success: true })

    expect(await dbSelectThankYouGreetingPicturesByLinkCode(ORPHAN_CODE)).toBeNull()
  })

  // The state is the caller's to judge (backend, ThankYouGreetingPicture.logic.ts): the readers
  // hand it on as the link's own columns say it, for a deleted link as well.
  it('names what became of the link: accepted by whom and when, deleted when', async () => {
    expect(await dbInsertThankYouGreetingPicture(small(ACCEPTED_LINK.code))).toEqual({
      success: true,
    })
    expect(await dbInsertThankYouGreetingPicture(small(DELETED_LINK.code))).toEqual({
      success: true,
    })

    const accepted = await dbSelectThankYouGreetingPicturesByLinkId(ACCEPTED_LINK.id)
    expect(accepted?.link).toMatchObject({
      userId: MAKER,
      redeemedBy: ACCEPTED_BY,
      redeemedAt: ACCEPTED_AT,
      deletedAt: null,
    })
    const deleted = await dbSelectThankYouGreetingPicturesByLinkCode(DELETED_LINK.code)
    expect(deleted?.link).toMatchObject({ redeemedBy: null, deletedAt: DELETED_AT })
  })

  /**
   * The member who made the link: whether their account stands is read with the link, for the
   * address that serves a picture to whoever holds the code. A column of this community's own
   * row of the member.
   */
  it('says that the account of the member who made the link stands', async () => {
    expect(
      (await dbSelectThankYouGreetingPicturesByLinkCode(SARAH_LINK.code))?.makerDeletedAt,
    ).toBeNull()
    expect(
      (await dbSelectThankYouGreetingPicturesByLinkId(SARAH_LINK.id))?.makerDeletedAt,
    ).toBeNull()
  })

  it('says when the account of the member who made the link was deleted', async () => {
    expect(await dbInsertThankYouGreetingPicture(small(GONE_MAKER_LINK.code))).toEqual({
      success: true,
    })

    const byCode = await dbSelectThankYouGreetingPicturesByLinkCode(GONE_MAKER_LINK.code)
    expect(byCode?.makerDeletedAt).toEqual(MAKER_DELETED_AT)
    // The link's own row still reads open: it is the member's row that says the account is gone.
    expect(byCode?.link).toMatchObject({ userId: GONE_MAKER, redeemedBy: null, deletedAt: null })
    expect(
      (await dbSelectThankYouGreetingPicturesByLinkId(GONE_MAKER_LINK.id))?.makerDeletedAt,
    ).toEqual(MAKER_DELETED_AT)
  })

  // No member, no link to show a picture for.
  it('knows nothing of the pictures of a link whose maker has no row', async () => {
    expect(await dbInsertThankYouGreetingPicture(small(NO_MAKER_LINK.code))).toEqual({
      success: true,
    })

    expect(await dbSelectThankYouGreetingPicturesByLinkCode(NO_MAKER_LINK.code)).toBeNull()
    expect(await dbSelectThankYouGreetingPicturesByLinkId(NO_MAKER_LINK.id)).toBeNull()
  })

  it('shows nothing where two links carry one code', async () => {
    expect(await dbInsertThankYouGreetingPicture(small(TWIN_LINK.code))).toEqual({ success: true })

    expect(await dbSelectThankYouGreetingPicturesByLinkCode(TWIN_LINK.code)).toBeNull()
    // By its id each of the two is one link.
    expect((await dbSelectThankYouGreetingPicturesByLinkId(TWIN_LINK.id))?.link.id).toBe(
      TWIN_LINK.id,
    )
    expect((await dbSelectThankYouGreetingPicturesByLinkId(OTHER_TWIN_LINK.id))?.link.id).toBe(
      OTHER_TWIN_LINK.id,
    )
  })

  it('takes the large rendition out and leaves the small one', async () => {
    expect(await dbDeleteThankYouGreetingPicturesByLinkCode(SARAH_LINK.code, 'large')).toBe(1)

    expect(renditionsOf(await dbSelectThankYouGreetingPicturesByLinkCode(SARAH_LINK.code))).toEqual(
      ['small'],
    )
    // Nothing of another link went with it.
    expect(
      renditionsOf(await dbSelectThankYouGreetingPicturesByLinkCode(SMALL_ONLY_LINK.code)),
    ).toEqual(['small'])
  })

  it('takes nothing out where there is nothing, and says so', async () => {
    expect(await dbDeleteThankYouGreetingPicturesByLinkCode(SARAH_LINK.code, 'large')).toBe(0)
    expect(await dbDeleteThankYouGreetingPicturesByLinkCode(MOTIF_LINK.code)).toBe(0)
    expect(await dbDeleteThankYouGreetingPicturesByLinkCode(UNKNOWN_CODE)).toBe(0)
  })

  it('takes the large rendition again once it is gone', async () => {
    expect(await dbInsertThankYouGreetingPicture(large(SARAH_LINK.code))).toEqual({ success: true })
  })

  it('takes both renditions of a link out at once, and no other link is touched', async () => {
    expect(await dbDeleteThankYouGreetingPicturesByLinkCode(SARAH_LINK.code)).toBe(2)

    expect(await dbSelectThankYouGreetingPicturesByLinkCode(SARAH_LINK.code)).toBeNull()
    expect(
      renditionsOf(await dbSelectThankYouGreetingPicturesByLinkCode(SMALL_ONLY_LINK.code)),
    ).toEqual(['small'])
  })
})

/**
 * ⛔ No query that serves a list reads a picture. Held on the statements as the pool gets them:
 * the lists of links and of bookings read the greetings' table and never name the pictures';
 * the two readers of this file name it without its `image`; one statement alone reads `image`.
 */
describe('which statement reads a picture', () => {
  const namesThePicturesTable = (sql: string) => sql.includes('thank_you_greeting_pictures')
  const readsTheImage = (sql: string) => /`image`/.test(sql)

  it('the greetings of a page of links are read without the pictures table', async () => {
    const statements = await statementsOf(async () => {
      await dbSelectThankYouGreetingsByLinkCodes([SMALL_ONLY_LINK.code, MOTIF_LINK.code])
      await dbSelectThankYouGreetingsByLinkIds([SMALL_ONLY_LINK.id, MOTIF_LINK.id])
    })

    expect(statements).toHaveLength(2)
    expect(statements.filter(namesThePicturesTable)).toEqual([])
    expect(statements.filter(readsTheImage)).toEqual([])
  })

  it('what is known about the pictures of a link is read without the picture', async () => {
    const statements = await statementsOf(async () => {
      await dbSelectThankYouGreetingPicturesByLinkCode(SMALL_ONLY_LINK.code)
      await dbSelectThankYouGreetingPicturesByLinkId(SMALL_ONLY_LINK.id)
    })

    expect(statements).toHaveLength(2)
    expect(statements.filter(namesThePicturesTable)).toHaveLength(2)
    expect(statements.filter(readsTheImage)).toEqual([])
  })

  it('the picture is read by the one statement that is asked for one picture', async () => {
    const found = await dbSelectThankYouGreetingPicturesByLinkCode(SMALL_ONLY_LINK.code)
    const statements = await statementsOf(() =>
      dbSelectThankYouGreetingPictureImage(found?.pictures[0]?.id ?? 0),
    )

    expect(statements).toHaveLength(1)
    expect(readsTheImage(statements[0])).toBe(true)
    expect(statements[0]).toContain('limit')
  })
})
