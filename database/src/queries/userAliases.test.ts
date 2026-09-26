import {
  ALIAS_ORIGIN_ADOPTED,
  ALIAS_ORIGIN_ASSIGNED,
  ALIAS_ORIGIN_CHOSEN,
  type AliasOrigin,
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
  dbCountChosenAliasesSince,
  dbFindAliasOwner,
  dbFindOldestChosenAliasSince,
  dbFindOwnAlias,
  dbInsertUserAlias,
  dbMarkAliasAdopted,
} from './userAliases'

// The id of the new row: inserting is not what these tests are about.
async function insertAlias(userId: number, alias: string, origin: AliasOrigin): Promise<number> {
  const result = await dbInsertUserAlias({ userId, alias, origin })
  if (!result.success) {
    throw result.error
  }
  return result.value
}

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
  let bibi: DbUser
  let peter: DbUser

  beforeAll(async () => {
    await DbUserAlias.clear()
    await DbUser.clear()
    await DbUserContact.clear()
    await DbCommunity.clear()

    await createCommunity(false)
    bibi = await userFactory(bibiBloxberg)
    peter = await userFactory(peterLustig)
  })

  beforeEach(async () => {
    await DbUserAlias.clear()
  })

  describe('dbFindOwnAlias', () => {
    it('finds a name the member owns', async () => {
      await insertAlias(bibi.id, 'bibi-one', ALIAS_ORIGIN_CHOSEN)
      const found = await dbFindOwnAlias(bibi.id, 'bibi-one')
      expect(found?.alias).toBe('bibi-one')
    })

    // This is the whole of "reclaiming is free": the resolver asks whether the name is
    // already the member's before it counts anything.
    it('does not find a name that belongs to somebody else', async () => {
      await insertAlias(peter.id, 'peter-one', ALIAS_ORIGIN_CHOSEN)
      expect(await dbFindOwnAlias(bibi.id, 'peter-one')).toBeNull()
    })
  })

  describe('dbFindAliasOwner', () => {
    it('names who owns a name, which is what makes a printed card keep working', async () => {
      await insertAlias(bibi.id, 'bibi-old', ALIAS_ORIGIN_CHOSEN)
      const owner = await dbFindAliasOwner('bibi-old')
      expect(owner?.userId).toBe(bibi.id)
    })

    it('returns null for a name nobody ever held', async () => {
      expect(await dbFindAliasOwner('never-used')).toBeNull()
    })
  })

  describe('dbCountChosenAliasesSince', () => {
    it('counts the names the member picked', async () => {
      await insertAlias(bibi.id, 'pick-one', ALIAS_ORIGIN_CHOSEN)
      await insertAlias(bibi.id, 'pick-two', ALIAS_ORIGIN_CHOSEN)
      const since = new Date(Date.now() - 365 * DAY_MS)
      expect(await dbCountChosenAliasesSince(bibi.id, since)).toBe(2)
    })

    // A name the system handed out is a proposal until it is adopted, so it must not
    // eat one of the four picks.
    it('does not count a name the system handed out', async () => {
      await insertAlias(bibi.id, 'given-one', ALIAS_ORIGIN_ASSIGNED)
      const since = new Date(Date.now() - 365 * DAY_MS)
      expect(await dbCountChosenAliasesSince(bibi.id, since)).toBe(0)
    })

    it('does not count a name the member merely kept', async () => {
      // Keeping the built name answers the question but is not a pick, so it must not
      // eat one of the four. This is the whole reason `adopted` exists next to `chosen`.
      const rowId = await insertAlias(bibi.id, 'bibi-kept', ALIAS_ORIGIN_ASSIGNED)
      await dbMarkAliasAdopted(rowId)
      expect(await dbCountChosenAliasesSince(bibi.id, new Date(Date.now() - DAY_MS))).toBe(0)
    })

    it('does not count another member´s picks', async () => {
      await insertAlias(peter.id, 'pick-one', ALIAS_ORIGIN_CHOSEN)
      const since = new Date(Date.now() - 365 * DAY_MS)
      expect(await dbCountChosenAliasesSince(bibi.id, since)).toBe(0)
    })

    // The window rolls: a pick from more than a year ago has fallen out of it and its
    // slot is free again.
    it('does not count a pick that has left the window', async () => {
      const oldId = await insertAlias(bibi.id, 'pick-old', ALIAS_ORIGIN_CHOSEN)
      await ageRow(oldId, 400)
      const since = new Date(Date.now() - 365 * DAY_MS)
      expect(await dbCountChosenAliasesSince(bibi.id, since)).toBe(0)
    })
  })

  describe('dbFindOldestChosenAliasSince', () => {
    // What frees the next slot is this row turning a year old - which is why the page
    // can name a date rather than say "in a year".
    it('returns the earliest pick still inside the window', async () => {
      const olderId = await insertAlias(bibi.id, 'pick-a', ALIAS_ORIGIN_CHOSEN)
      await ageRow(olderId, 300)
      const newerId = await insertAlias(bibi.id, 'pick-b', ALIAS_ORIGIN_CHOSEN)
      await ageRow(newerId, 100)

      const since = new Date(Date.now() - 365 * DAY_MS)
      const oldest = await dbFindOldestChosenAliasSince(bibi.id, since)
      expect(oldest?.alias).toBe('pick-a')
    })

    it('returns null when the member has picked nothing inside it', async () => {
      const since = new Date(Date.now() - 365 * DAY_MS)
      expect(await dbFindOldestChosenAliasSince(bibi.id, since)).toBeNull()
    })
  })

  describe('dbMarkAliasAdopted', () => {
    it('marks the row as kept, not as picked', async () => {
      const rowId = await insertAlias(bibi.id, 'bibi-keep', ALIAS_ORIGIN_ASSIGNED)
      await dbMarkAliasAdopted(rowId)
      const after = await dbFindOwnAlias(bibi.id, 'bibi-keep')
      expect(after?.origin).toBe(ALIAS_ORIGIN_ADOPTED)
    })

    it('leaves created_at alone, so the row still says when they got the name', async () => {
      const rowId = await insertAlias(bibi.id, 'bibi-old', ALIAS_ORIGIN_ASSIGNED)
      await ageRow(rowId, 400)
      const before = await dbFindOwnAlias(bibi.id, 'bibi-old')
      await dbMarkAliasAdopted(rowId)
      const after = await dbFindOwnAlias(bibi.id, 'bibi-old')
      expect(after?.createdAt.getTime()).toBe(before?.createdAt.getTime())
    })
  })

  describe('the column ignores case, and the code above it must agree', () => {
    // Not a nicety: `users.alias` is written from what the member typed, while the row
    // here is found by the database. If the two disagree about capitalisation, a member
    // who only changes `Bernd` to `BERND` keeps a row nothing in TypeScript can match -
    // which is what locked them in front of the window at first login.
    it('finds the member´s own name whatever the capitalisation', async () => {
      await insertAlias(bibi.id, 'Bibi-Case', ALIAS_ORIGIN_CHOSEN)
      expect(await dbFindOwnAlias(bibi.id, 'BIBI-CASE')).not.toBeNull()
      expect(await dbFindOwnAlias(bibi.id, 'bibi-case')).not.toBeNull()
    })
  })
})
