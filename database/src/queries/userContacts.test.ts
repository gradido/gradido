// AI-GENERATED — not an architecture reference
import { OptInType, UserContactType } from 'shared'
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
  dbFindUserContactByEmail,
  dbFindUserIdsByEmailLike,
  dbInsertPendingEmailChange,
  dbMarkUserContactPending,
  dbPurgeExpiredEmailChanges,
  dbReleasePendingEmailChange,
  dbReleaseUnconfirmedEmailChangeFor,
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

    it('names a member for any of their addresses, and names them once', async () => {
      expect(await dbFindUserIdsByEmailLike('bibi-new')).toEqual([bibi.id])
      // Both of bibi's rows match - one id, not two.
      expect(await dbFindUserIdsByEmailLike('bloxberg')).toEqual([bibi.id])
      expect(await dbFindUserIdsByEmailLike('lustig')).toEqual([peter.id])
      expect(await dbFindUserIdsByEmailLike('nobody')).toEqual([])
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
      // The same cutoff as before: the fresh pending row is younger than it and stays.
      const olderThan = new Date(Date.now() - 24 * HOUR_MS)
      expect(await dbPurgeExpiredEmailChanges(olderThan)).toBe(0)
      expect(await dbEmailTaken('peter@lustig.de')).toBe(true)
    })
  })

  /**
   * Going back to an address one held before. `email` is unique, so there is no second row
   * to insert - the member's own row is borrowed, and it must come out of that unharmed
   * whichever way the change ends.
   */
  describe('taking an earlier address back', () => {
    let earlier: DbUserContact

    beforeAll(async () => {
      await DbUserContact.delete({ userId: bibi.id, emailChecked: false })
      // What a completed change leaves behind: a confirmed address that is no longer the
      // one in force.
      earlier = DbUserContact.create({
        userId: bibi.id,
        email: 'bibi-earlier@bloxberg.de',
        type: UserContactType.USER_CONTACT_EMAIL,
        emailChecked: true,
        emailOptInTypeId: OptInType.EMAIL_OPT_IN_REGISTER,
        emailVerificationCode: '9001',
      })
      await DbUserContact.save(earlier)
    })

    it('is found as belonging to this member, and to no other', async () => {
      // One question, one visibility. Whose the address is follows from the row, so the
      // caller can no longer get "not yours" and "already taken" out of two lookups that
      // disagree - the way a member used to be told their OWN earlier address was in use.
      const row = await dbFindUserContactByEmail('bibi-earlier@bloxberg.de')
      expect(row?.id).toBe(earlier.id)
      expect(row?.userId).toBe(bibi.id)
      // ⛔ The other half of the title needs a row that is somebody ELSE's, and asked for
      // by ITS address. Until the review of 27.08.2026 this line read
      // `expect(row?.userId).not.toBe(peter.id)` on the row above - which the assertion two
      // lines up had already settled, so it could not fail on any input and the "no other"
      // half was carried by nothing.
      const petersRow = await dbFindUserContactByEmail('peter@lustig.de')
      expect(petersRow?.userId).toBe(peter.id)
      expect(petersRow?.userId).not.toBe(bibi.id)
      // ...while the plain question still says the address is spoken for - which is what
      // keeps a stranger from taking it.
      expect(await dbEmailTaken('bibi-earlier@bloxberg.de')).toBe(true)
    })

    it('becomes the pending change without losing that it was confirmed', async () => {
      await dbMarkUserContactPending(earlier, { verificationCode: '9002', vetoCode: '9003' })

      const pending = await dbFindPendingEmailChange(bibi.id)
      expect(pending?.id).toBe(earlier.id)
      expect(pending?.emailChecked).toBe(true)
      expect((await dbFindPendingEmailChangeByCode('9002'))?.id).toBe(earlier.id)
      expect((await dbFindPendingEmailChangeByVetoCode('9003'))?.id).toBe(earlier.id)
    })

    // ⛔ The bulk purge works by SQL and cannot tell whose row it is - so it must never
    // touch a confirmed one, however long the change has been lying around.
    it('survives the purge that clears out forgotten changes', async () => {
      await ageRow(earlier.id, 25)
      expect(await dbPurgeExpiredEmailChanges(new Date(Date.now() - 24 * HOUR_MS))).toBe(0)
      expect(await DbUserContact.findOneBy({ id: earlier.id })).not.toBeNull()
    })

    it('is restored, never deleted, when the change is called off', async () => {
      const outcome = await dbReleasePendingEmailChange(earlier, '9004')

      expect(outcome).toBe('restored')
      const row = await DbUserContact.findOneByOrFail({ id: earlier.id })
      expect(row.emailOptInTypeId).toBe(OptInType.EMAIL_OPT_IN_REGISTER)
      expect(row.changeVetoCode).toBeNull()
      expect(row.emailChecked).toBe(true)
      // The mailed code has to die with the change: a restored row is of the REGISTER type
      // again, and `setPassword` accepts codes of that kind.
      expect(row.emailVerificationCode).toBe('9004')
      expect(await dbFindPendingEmailChange(bibi.id)).toBeNull()
    })

    it('deletes a fresh row instead - that address was never theirs', async () => {
      const inserted = await dbInsertPendingEmailChange({
        userId: bibi.id,
        email: 'bibi-never-had@bloxberg.de',
        verificationCode: '9005',
        vetoCode: '9006',
      })
      if (!inserted.success) {
        throw inserted.error
      }

      expect(await dbReleasePendingEmailChange(inserted.value, '9007')).toBe('deleted')
      expect(await dbEmailTaken('bibi-never-had@bloxberg.de')).toBe(false)
    })
  })

  /**
   * A change that only ever TYPED an address in must not keep it from somebody who is
   * registering with it - not once it is expired, and not while it is still running. The
   * expiry purge answers a different question and cannot do this one.
   */
  describe('giving up a never-confirmed hold on an address', () => {
    let held: DbUserContact

    beforeAll(async () => {
      const inserted = await dbInsertPendingEmailChange({
        userId: bibi.id,
        email: 'wanted@example.org',
        verificationCode: '9101',
        vetoCode: '9102',
      })
      if (!inserted.success) {
        throw inserted.error
      }
      held = inserted.value
      // The fixture has to be real, and young: the whole point is that age does not matter.
      expect(await dbEmailTaken('wanted@example.org')).toBe(true)
      expect(await dbPurgeExpiredEmailChanges(new Date(Date.now() - 24 * HOUR_MS))).toBe(0)
    })

    afterAll(async () => {
      await DbUserContact.delete({ email: 'wanted@example.org' })
    })

    it('gives up a change that is still well inside its window', async () => {
      expect(await dbReleaseUnconfirmedEmailChangeFor('wanted@example.org')).toBe(1)
      expect(await dbEmailTaken('wanted@example.org')).toBe(false)
      expect(await dbFindPendingEmailChange(bibi.id)).toBeNull()
      expect(await DbUserContact.findOne({ where: { id: held.id }, withDeleted: true })).toBeNull()
    })

    it('leaves every other address alone', async () => {
      const registration = await DbUserContact.findOneOrFail({
        where: { email: 'peter@lustig.de' },
      })
      expect(await dbReleaseUnconfirmedEmailChangeFor('peter@lustig.de')).toBe(0)
      expect(await dbEmailTaken('peter@lustig.de')).toBe(true)
      expect((await DbUserContact.findOneOrFail({ where: { id: registration.id } })).id).toBe(
        registration.id,
      )
    })

    // The take-back borrows a row the member PROVED. Giving that up would hand somebody
    // else an address its owner is on their way back to - and would shrink the history the
    // Elopage webhook and the GDT server read.
    it('never gives up a take-back, because that address was proven', async () => {
      const earlierBack = await DbUserContact.findOneOrFail({
        where: { email: 'bibi-earlier@bloxberg.de' },
      })
      await dbMarkUserContactPending(
        earlierBack,
        { verificationCode: '9103', vetoCode: '9104' },
        undefined,
      )

      expect(await dbReleaseUnconfirmedEmailChangeFor('bibi-earlier@bloxberg.de')).toBe(0)
      expect(await dbEmailTaken('bibi-earlier@bloxberg.de')).toBe(true)
      expect((await dbFindPendingEmailChange(bibi.id))?.id).toBe(earlierBack.id)

      await dbReleasePendingEmailChange(earlierBack, '9105')
    })
  })
})
