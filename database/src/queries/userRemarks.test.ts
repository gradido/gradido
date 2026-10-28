// AI-GENERATED — not an architecture reference
import { MySql2Database } from 'drizzle-orm/mysql2'
import { User as DbUser } from '..'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { userRemarksTable } from '../schemas'
import { createCommunity } from '../seeds/community'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { peterLustig } from '../seeds/users/peter-lustig'
import { dbDeleteAllRowsExceptMigrations } from './informationSchemaTables'
import {
  dbDeleteUserRemark,
  dbSelectUserRemark,
  dbSelectUserRemarkWithMemberNames,
  dbUpsertUserRemark,
} from './userRemarks'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// Two moderators who write, and two members the remarks are about. The members need no row of
// their own (the table carries no foreign key on purpose); the moderators do, for their names.
let bibi: DbUser
let peter: DbUser
const LEONI = 101
const MARTA = 102
const AT = new Date('2026-10-28T09:40:12.345Z')
const LATER = new Date('2026-10-28T10:05:00.000Z')

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await dbDeleteAllRowsExceptMigrations()
  await createCommunity(false)
  bibi = await userFactory(bibiBloxberg)
  peter = await userFactory(peterLustig)
})
afterAll(async () => {
  await dbDeleteAllRowsExceptMigrations()
  await appDB.destroy()
})
afterEach(async () => {
  await db.delete(userRemarksTable)
})

describe('userRemarks query test', () => {
  it('answers null where the moderation keeps no remark on the member', async () => {
    expect(await dbSelectUserRemark(LEONI)).toBeNull()
  })

  it('keeps a remark, with when and by whom it was written', async () => {
    await dbUpsertUserRemark(LEONI, 'Bürgermeisterin von Lieblingsstadt', bibi.id, AT)
    expect(await dbSelectUserRemark(LEONI)).toEqual({
      remark: 'Bürgermeisterin von Lieblingsstadt',
      updatedAt: AT,
      updatedByName: 'Bibi Bloxberg',
    })
  })

  it('keeps ONE remark per member: another moderator writes on the same row', async () => {
    await dbUpsertUserRemark(LEONI, 'Bürgermeisterin von Lieblingsstadt', bibi.id, AT)
    await dbUpsertUserRemark(LEONI, 'Bürgermeisterin, Tochter von Ramona', peter.id, LATER)
    expect(await dbSelectUserRemark(LEONI)).toEqual({
      remark: 'Bürgermeisterin, Tochter von Ramona',
      updatedAt: LATER,
      updatedByName: 'Peter Lustig',
    })
    expect(await db.select().from(userRemarksTable)).toHaveLength(1)
  })

  it('keeps the members apart', async () => {
    await dbUpsertUserRemark(LEONI, 'on Leoni', bibi.id, AT)
    await dbUpsertUserRemark(MARTA, 'on Marta', peter.id, AT)
    expect((await dbSelectUserRemark(LEONI))?.remark).toBe('on Leoni')
    expect((await dbSelectUserRemark(MARTA))?.remark).toBe('on Marta')
  })

  it('names nobody where the moderator who wrote it last was deleted, and keeps the words', async () => {
    await dbUpsertUserRemark(LEONI, 'Rentner seit Januar 25', peter.id, AT)
    await DbUser.update({ id: peter.id }, { deletedAt: new Date() })
    try {
      expect(await dbSelectUserRemark(LEONI)).toEqual({
        remark: 'Rentner seit Januar 25',
        updatedAt: AT,
        updatedByName: null,
      })
    } finally {
      await DbUser.update({ id: peter.id }, { deletedAt: null })
    }
  })

  it('takes the remark away, and taking it away again is no failure', async () => {
    await dbUpsertUserRemark(LEONI, 'soon gone', bibi.id, AT)
    await dbUpsertUserRemark(MARTA, 'stays', bibi.id, AT)
    await dbDeleteUserRemark(LEONI)
    expect(await dbSelectUserRemark(LEONI)).toBeNull()
    expect((await dbSelectUserRemark(MARTA))?.remark).toBe('stays')
    await dbDeleteUserRemark(LEONI)
    expect(await dbSelectUserRemark(LEONI)).toBeNull()
  })

  it('keeps a remark as long as the server takes one, in letters that take four bytes each', async () => {
    // USER_REMARK_MAX_CHARS (2000) as MaxLength counts them -- validator.js counts an emoji as one
    // character: 2000 emoji, some 8,000 bytes in the `text` column.
    const heavy = '🌱'.repeat(2000)
    await dbUpsertUserRemark(LEONI, heavy, bibi.id, AT)
    expect((await dbSelectUserRemark(LEONI))?.remark).toBe(heavy)
  })
})

describe("the remark with the member's names, for Crea", () => {
  it('answers null where the moderation keeps no remark on the member', async () => {
    expect(await dbSelectUserRemarkWithMemberNames(bibi.id)).toBeNull()
  })

  it('brings the names of the member the remark is about, not of the moderator who wrote it', async () => {
    // peter wrote it, the remark is about bibi.
    await dbUpsertUserRemark(bibi.id, 'Rentnerin seit Januar 2025', peter.id, AT)
    expect(await dbSelectUserRemarkWithMemberNames(bibi.id)).toEqual({
      remark: 'Rentnerin seit Januar 2025',
      memberNames: ['Bibi', 'Bloxberg', 'BBB'],
    })
  })

  it('brings no names where the member has no account here', async () => {
    await dbUpsertUserRemark(LEONI, 'Tochter von Ramona', bibi.id, AT)
    expect(await dbSelectUserRemarkWithMemberNames(LEONI)).toEqual({
      remark: 'Tochter von Ramona',
      memberNames: [],
    })
  })
})
