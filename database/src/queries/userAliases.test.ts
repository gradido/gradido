import {
  ALIAS_ORIGIN_ASSIGNED,
  ALIAS_ORIGIN_CHOSEN,
  Community as DbCommunity,
  User as DbUser,
  UserAlias as DbUserAlias,
  UserContact as DbUserContact,
} from '..'
import { AppDatabase } from '../AppDatabase'
import { createCommunity } from '../seeds/community'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { peterLustig } from '../seeds/users/peter-lustig'
import {
  dbAliasHeldByOther,
  dbCountChosenAliasesSince,
  dbFindAliasOwner,
  dbFindOldestChosenAliasSince,
  dbFindOwnAlias,
  dbInsertUserAlias,
} from './userAliases'

const db = AppDatabase.getInstance()

const DAY_MS = 24 * 60 * 60 * 1000

/** `created_at` fills itself on insert, so a row that has to look old is aged by hand. */
async function ageRow(id: number, daysAgo: number): Promise<void> {
  await db
    .getDataSource()
    .query('UPDATE user_aliases SET created_at = ? WHERE id = ?', [
      new Date(Date.now() - daysAgo * DAY_MS),
      id,
    ])
}

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

describe('userAliases.queries', () => {
  let communityUuid: string
  let bibi: DbUser
  let peter: DbUser

  beforeAll(async () => {
    await DbUserAlias.clear()
    await DbUser.clear()
    await DbUserContact.clear()
    await DbCommunity.clear()

    const homeCom = await createCommunity(false)
    communityUuid = homeCom.communityUuid!
    bibi = await userFactory(bibiBloxberg)
    peter = await userFactory(peterLustig)
  })

  beforeEach(async () => {
    await DbUserAlias.clear()
  })

  describe('dbFindOwnAlias', () => {
    it('finds a name the member owns', async () => {
      await dbInsertUserAlias(bibi.id, 'bibi-one', communityUuid, ALIAS_ORIGIN_CHOSEN)
      const found = await dbFindOwnAlias(bibi.id, 'bibi-one', communityUuid)
      expect(found?.alias).toBe('bibi-one')
    })

    // This is the whole of "reclaiming is free": the resolver asks whether the name is
    // already the member's before it counts anything.
    it('does not find a name that belongs to somebody else', async () => {
      await dbInsertUserAlias(peter.id, 'peter-one', communityUuid, ALIAS_ORIGIN_CHOSEN)
      expect(await dbFindOwnAlias(bibi.id, 'peter-one', communityUuid)).toBeNull()
    })
  })

  describe('dbAliasHeldByOther', () => {
    beforeEach(async () => {
      await dbInsertUserAlias(peter.id, 'taken-name', communityUuid, ALIAS_ORIGIN_CHOSEN)
    })

    it('blocks a name somebody else left behind', async () => {
      expect(await dbAliasHeldByOther('taken-name', bibi.id)).toBe(true)
    })

    // A name of one's own must not block oneself - otherwise nobody could ever take an
    // earlier name back, which is the third of the four requirements from 2023.
    it('does not block the owner from their own earlier name', async () => {
      await dbInsertUserAlias(bibi.id, 'bibi-old', communityUuid, ALIAS_ORIGIN_CHOSEN)
      expect(await dbAliasHeldByOther('bibi-old', bibi.id)).toBe(false)
    })

    it('blocks it for anyone when no member is named', async () => {
      await dbInsertUserAlias(bibi.id, 'bibi-old', communityUuid, ALIAS_ORIGIN_CHOSEN)
      expect(await dbAliasHeldByOther('bibi-old')).toBe(true)
    })
  })

  describe('dbFindAliasOwner', () => {
    it('names who owns a name, which is what makes a printed card keep working', async () => {
      await dbInsertUserAlias(bibi.id, 'bibi-old', communityUuid, ALIAS_ORIGIN_CHOSEN)
      const owner = await dbFindAliasOwner('bibi-old')
      expect(owner?.userId).toBe(bibi.id)
    })

    it('returns null for a name nobody ever held', async () => {
      expect(await dbFindAliasOwner('never-used')).toBeNull()
    })
  })

  describe('dbCountChosenAliasesSince', () => {
    it('counts the names the member picked', async () => {
      await dbInsertUserAlias(bibi.id, 'pick-one', communityUuid, ALIAS_ORIGIN_CHOSEN)
      await dbInsertUserAlias(bibi.id, 'pick-two', communityUuid, ALIAS_ORIGIN_CHOSEN)
      const since = new Date(Date.now() - 365 * DAY_MS)
      expect(await dbCountChosenAliasesSince(bibi.id, since)).toBe(2)
    })

    // A name the system handed out is a proposal until it is adopted, so it must not
    // eat one of the four picks.
    it('does not count a name the system handed out', async () => {
      await dbInsertUserAlias(bibi.id, 'given-one', communityUuid, ALIAS_ORIGIN_ASSIGNED)
      const since = new Date(Date.now() - 365 * DAY_MS)
      expect(await dbCountChosenAliasesSince(bibi.id, since)).toBe(0)
    })

    it('does not count another member´s picks', async () => {
      await dbInsertUserAlias(peter.id, 'pick-one', communityUuid, ALIAS_ORIGIN_CHOSEN)
      const since = new Date(Date.now() - 365 * DAY_MS)
      expect(await dbCountChosenAliasesSince(bibi.id, since)).toBe(0)
    })

    // The window rolls: a pick from more than a year ago has fallen out of it and its
    // slot is free again.
    it('does not count a pick that has left the window', async () => {
      const old = await dbInsertUserAlias(bibi.id, 'pick-old', communityUuid, ALIAS_ORIGIN_CHOSEN)
      await ageRow(old.id, 400)
      const since = new Date(Date.now() - 365 * DAY_MS)
      expect(await dbCountChosenAliasesSince(bibi.id, since)).toBe(0)
    })
  })

  describe('dbFindOldestChosenAliasSince', () => {
    // What frees the next slot is this row turning a year old - which is why the page
    // can name a date rather than say "in a year".
    it('returns the earliest pick still inside the window', async () => {
      const older = await dbInsertUserAlias(bibi.id, 'pick-a', communityUuid, ALIAS_ORIGIN_CHOSEN)
      await ageRow(older.id, 300)
      const newer = await dbInsertUserAlias(bibi.id, 'pick-b', communityUuid, ALIAS_ORIGIN_CHOSEN)
      await ageRow(newer.id, 100)

      const since = new Date(Date.now() - 365 * DAY_MS)
      const oldest = await dbFindOldestChosenAliasSince(bibi.id, since)
      expect(oldest?.alias).toBe('pick-a')
    })

    it('returns null when the member has picked nothing inside it', async () => {
      const since = new Date(Date.now() - 365 * DAY_MS)
      expect(await dbFindOldestChosenAliasSince(bibi.id, since)).toBeNull()
    })
  })
})
