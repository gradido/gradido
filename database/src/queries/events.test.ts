// AI-GENERATED — not an architecture reference
import {
  Community as DbCommunity,
  Event as DbEvent,
  User as DbUser,
  UserContact as DbUserContact,
} from '..'
import { AppDatabase } from '../AppDatabase'
import { createCommunity } from '../seeds/community'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { peterLustig } from '../seeds/users/peter-lustig'
import { dbFindLatestEventForAffectedUser } from './events'

const db = AppDatabase.getInstance()

const HOUR_MS = 60 * 60 * 1000

/** The timestamp fills itself on insert, so an event that has to look old is aged by hand. */
async function recordEvent(
  type: string,
  affectedUserId: number,
  createdAt: Date,
): Promise<DbEvent> {
  const event = DbEvent.create({ type, affectedUserId, actingUserId: affectedUserId })
  await event.save()
  await db
    .getDataSource()
    .query('UPDATE events SET created_at = ? WHERE id = ?', [createdAt, event.id])
  return event
}

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

describe('events.queries', () => {
  describe('dbFindLatestEventForAffectedUser', () => {
    let bibi: DbUser
    let peter: DbUser
    let latest: DbEvent

    beforeAll(async () => {
      await DbEvent.clear()
      await DbUser.clear()
      await DbUserContact.clear()
      await DbCommunity.clear()

      await createCommunity(false)
      bibi = await userFactory(bibiBloxberg)
      peter = await userFactory(peterLustig)

      const now = Date.now()
      await recordEvent('EMAIL_CHANGE_REQUEST', bibi.id, new Date(now - 3 * HOUR_MS))
      latest = await recordEvent('EMAIL_CHANGE_REQUEST', bibi.id, new Date(now - HOUR_MS))
      // Younger, but of another type or about another member - neither may be picked.
      await recordEvent('EMAIL_CHANGE_CONFIRMED', bibi.id, new Date(now - 60 * 1000))
      await recordEvent('EMAIL_CHANGE_REQUEST', peter.id, new Date(now - 60 * 1000))
    })

    it('returns the youngest event of that type about that member', async () => {
      const found = await dbFindLatestEventForAffectedUser('EMAIL_CHANGE_REQUEST', bibi.id)
      expect(found?.id).toBe(latest.id)
    })

    it('returns null when nothing of that type was ever recorded for them', async () => {
      expect(await dbFindLatestEventForAffectedUser('NEVER_RECORDED', bibi.id)).toBeNull()
      expect(
        await dbFindLatestEventForAffectedUser('EMAIL_CHANGE_REQUEST', bibi.id + 1000),
      ).toBeNull()
    })
  })
})
