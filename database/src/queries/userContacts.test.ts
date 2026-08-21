// AI-GENERATED — not an architecture reference
import { Community as DbCommunity, User as DbUser, UserContact as DbUserContact } from '..'
import { AppDatabase } from '../AppDatabase'
import { DBDuplicateEntryError } from '../errorTypes'
import { createCommunity } from '../seeds/community'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { peterLustig } from '../seeds/users/peter-lustig'
import {
  dbDeleteUserContact,
  dbEmailTaken,
  dbFindConfirmedUserContactEmails,
  dbFindOldestUserContact,
  dbFindPendingEmailChange,
  dbFindPendingEmailChangeByCode,
  dbFindPendingEmailChangeByVetoCode,
  dbInsertPendingEmailChange,
  dbPurgeExpiredEmailChanges,
} from './userContacts'

const db = AppDatabase.getInstance()

const HOUR_MS = 60 * 60 * 1000

/** Timestamps fill themselves on insert, so a row that has to look old is aged by hand. */
async function ageRow(id: number, hoursAgo: number): Promise<void> {
  const then = new Date(Date.now() - hoursAgo * HOUR_MS)
  await db
    .getDataSource()
    .query('UPDATE user_contacts SET created_at = ?, updated_at = ? WHERE id = ?', [then, then, id])
}

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

describe('userContacts.queries', () => {
  let bibi: DbUser
  let peter: DbUser

  beforeAll(async () => {
    await DbUser.clear()
    await DbUserContact.clear()
    await DbCommunity.clear()

    await createCommunity(false)
    bibi = await userFactory(bibiBloxberg)
    peter = await userFactory(peterLustig)
  })

  describe('a pending change next to the registration address', () => {
    let pending: DbUserContact

    beforeAll(async () => {
      const inserted = await dbInsertPendingEmailChange({
        userId: bibi.id,
        email: 'bibi-new@bloxberg.de',
        verificationCode: '1111',
        vetoCode: '2222',
      })
      if (!inserted.success) {
        throw inserted.error
      }
      pending = inserted.value
    })

    it('keeps the registration address as the oldest row', async () => {
      const oldest = await dbFindOldestUserContact(bibi.id)
      expect(oldest?.email).toBe('bibi@bloxberg.de')
    })

    it('is found by user, by its own code and by its veto code', async () => {
      expect((await dbFindPendingEmailChange(bibi.id))?.id).toBe(pending.id)
      expect((await dbFindPendingEmailChangeByCode('1111'))?.id).toBe(pending.id)
      expect((await dbFindPendingEmailChangeByVetoCode('2222'))?.id).toBe(pending.id)
    })

    it('never lets one code stand in for the other', async () => {
      expect(await dbFindPendingEmailChangeByCode('2222')).toBeNull()
      expect(await dbFindPendingEmailChangeByVetoCode('1111')).toBeNull()
    })

    it('is not among the confirmed addresses while unconfirmed', async () => {
      expect(await dbFindConfirmedUserContactEmails(bibi.id)).toEqual(['bibi@bloxberg.de'])
    })

    it('holds the address against everybody else', async () => {
      expect(await dbEmailTaken('bibi-new@bloxberg.de')).toBe(true)
      const second = await dbInsertPendingEmailChange({
        userId: peter.id,
        email: 'bibi-new@bloxberg.de',
        verificationCode: '3333',
        vetoCode: '4444',
      })
      expect(second.success).toBe(false)
      if (!second.success) {
        expect(second.error).toBeInstanceOf(DBDuplicateEntryError)
      }
    })

    it('is a plain registration or reset code for nobody', async () => {
      // The registration row carries opt-in type 1; the change finder must not see it.
      const registration = await DbUserContact.findOneOrFail({
        where: { email: 'bibi@bloxberg.de' },
      })
      expect(await dbFindPendingEmailChangeByCode(registration.emailVerificationCode)).toBeNull()
    })

    it('frees the address once hard-deleted', async () => {
      const deleted = await dbDeleteUserContact(pending.id)
      expect(deleted.success).toBe(true)
      expect(await dbEmailTaken('bibi-new@bloxberg.de')).toBe(false)
      expect(await dbFindPendingEmailChange(bibi.id)).toBeNull()
    })

    it('reports a row that is not there', async () => {
      const again = await dbDeleteUserContact(pending.id)
      expect(again.success).toBe(false)
    })
  })

  describe('expiry', () => {
    let stale: DbUserContact
    let fresh: DbUserContact

    beforeAll(async () => {
      const staleInsert = await dbInsertPendingEmailChange({
        userId: peter.id,
        email: 'peter-stale@lustig.de',
        verificationCode: '5555',
        vetoCode: '6666',
      })
      const freshInsert = await dbInsertPendingEmailChange({
        userId: bibi.id,
        email: 'bibi-fresh@bloxberg.de',
        verificationCode: '7777',
        vetoCode: '8888',
      })
      if (!staleInsert.success || !freshInsert.success) {
        throw new Error('fixture insert failed')
      }
      stale = staleInsert.value
      fresh = freshInsert.value
      await ageRow(stale.id, 25)
    })

    it('purges what ran past the window and keeps what did not', async () => {
      const olderThan = new Date(Date.now() - 24 * HOUR_MS)
      expect(await dbPurgeExpiredEmailChanges(olderThan)).toBe(1)
      expect(await dbEmailTaken('peter-stale@lustig.de')).toBe(false)
      expect((await dbFindPendingEmailChange(bibi.id))?.id).toBe(fresh.id)
    })

    it('never touches a confirmed address, however old', async () => {
      const registration = await DbUserContact.findOneOrFail({
        where: { email: 'peter@lustig.de' },
      })
      await ageRow(registration.id, 24 * 400)
      expect(await dbPurgeExpiredEmailChanges(new Date())).toBe(0)
      expect(await dbEmailTaken('peter@lustig.de')).toBe(true)
    })
  })
})
