// AI-GENERATED — not an architecture reference

import { useFakeTimersForDrizzle } from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import {
  Community as DbCommunity,
  User as DbUser,
  dbClearGmsRegistration,
  dbFindUsersWithEmailContactByIds,
  dbMarkUsersGmsRegistered,
  dbSelectActiveMatchingEntriesByUserIds,
  getHomeCommunity,
  MatchingEntrySelect,
} from 'database'
import {
  deleteGmsMatchingEntry,
  deleteGmsUser,
  putGmsMatchingEntry,
  putGmsMatchingEntrySnapshots,
  upsertGmsUsers,
} from '@/apis/gms/GmsClient'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

import {
  removeDeletedUserFromGms,
  returnRestoredAccountToGms,
  returnRestoredUserToGms,
  syncMatchingEntryToGms,
} from './syncMatchingEntryToGms'

/**
 * What the GMS is told when the moderation deletes an account, and when it brings one back.
 * Without a database: the home community, the member's entries and the two statements that
 * note whether the GMS holds a member are answered here, and the client towards the GMS is
 * watched. That `deleteUser` and `unDeleteUser` call these two is held by the resolver's own
 * tests, which have a database.
 */
jest.mock('@/apis/gms/GmsClient')
jest.mock('database', () => {
  const actual = jest.requireActual('database')
  return {
    __esModule: true,
    ...actual,
    getHomeCommunity: jest.fn(),
    dbClearGmsRegistration: jest.fn(),
    dbFindUsersWithEmailContactByIds: jest.fn(),
    dbSelectActiveMatchingEntriesByUserIds: jest.fn(),
    dbMarkUsersGmsRegistered: jest.fn(),
  }
})

const deleteMock = deleteGmsUser as jest.Mock
const upsertMock = upsertGmsUsers as jest.Mock
const snapshotMock = putGmsMatchingEntrySnapshots as jest.Mock
const putEntryMock = putGmsMatchingEntry as jest.Mock
const deleteEntryMock = deleteGmsMatchingEntry as jest.Mock
const logger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.syncMatchingEntryToGms`,
)
const homeCommunityMock = getHomeCommunity as jest.Mock
const clearRegistrationMock = dbClearGmsRegistration as jest.Mock
const markRegisteredMock = dbMarkUsersGmsRegistered as jest.Mock
const selectEntriesMock = dbSelectActiveMatchingEntriesByUserIds as jest.Mock
// How the account stands when a hand-over ends: there (one row) or deleted (none).
const accountNowMock = dbFindUsersWithEmailContactByIds as jest.Mock

const API_KEY = 'gms-test-key'
const HOME_COM = { gmsApiKey: API_KEY } as DbCommunity
const MEMBER_UUID = '3a2f6f1e-6c1a-4e1a-9d3e-2f1b7c8d9e01'
const ENTRY_UUID = 'b6f0c1d2-3e4a-4b5c-8d9e-0f1a2b3c4d5e'

/** A member of this community who takes part, has a place pinned and stands in the GMS. */
const member = (changed: Partial<DbUser> = {}): DbUser =>
  ({
    id: 7,
    gradidoID: MEMBER_UUID,
    foreign: false,
    language: 'de',
    aboutMe: null,
    gmsAllowed: true,
    gmsRegistered: true,
    gmsRegisteredAt: new Date('2026-10-01T10:00:00.000Z'),
    alias: 'bibi',
    firstName: 'Bibi',
    lastName: 'Bloxberg',
    gmsPublishName: 0,
    gmsPublishLocation: 0,
    location: { type: 'Point', coordinates: [9.69, 49.28] },
    deletedAt: null,
    emailContact: { email: 'bibi@example.org', gmsPublishEmail: true },
    ...changed,
  }) as unknown as DbUser

const liveEntry = {
  userId: 7,
  uuid: ENTRY_UUID,
  matchingType: 'offer',
  summary: 'Lastenrad zum Ausleihen',
  details: null,
  remote: false,
  active: true,
} as unknown as MatchingEntrySelect

/**
 * Lets what waits on an answer go on: the steps of a retry between two turns of the clock, or
 * of a hand-over from the GMS's answer to its last line. Generously many -- a step too few
 * reads as "did not happen".
 */
const letItGoOn = async () => {
  for (let step = 0; step < 50; step++) {
    await Promise.resolve()
  }
}

describe('the GMS and an account the moderation deletes or brings back', () => {
  const gmsWasActive = CONFIG.GMS_ACTIVE
  const throwsWere = CONFIG.GMS_CREATE_USER_THROW_ERRORS

  beforeEach(() => {
    jest.clearAllMocks()
    CONFIG.GMS_ACTIVE = true
    CONFIG.GMS_CREATE_USER_THROW_ERRORS = false
    putEntryMock.mockResolvedValue(true)
    deleteEntryMock.mockResolvedValue(true)
    homeCommunityMock.mockResolvedValue(HOME_COM)
    deleteMock.mockResolvedValue(true)
    upsertMock.mockResolvedValue(true)
    snapshotMock.mockResolvedValue(true)
    clearRegistrationMock.mockResolvedValue({ success: true })
    markRegisteredMock.mockResolvedValue(undefined)
    selectEntriesMock.mockResolvedValue([liveEntry])
    accountNowMock.mockResolvedValue([member()])
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  afterAll(() => {
    CONFIG.GMS_ACTIVE = gmsWasActive
    CONFIG.GMS_CREATE_USER_THROW_ERRORS = throwsWere
  })

  describe('removeDeletedUserFromGms', () => {
    it('takes a member who takes part off the GMS, and notes that it holds them no longer', async () => {
      const deleted = member({ deletedAt: new Date() })
      await removeDeletedUserFromGms(deleted)

      expect(deleteMock).toHaveBeenCalledTimes(1)
      expect(deleteMock).toHaveBeenCalledWith(API_KEY, MEMBER_UUID)
      expect(clearRegistrationMock).toHaveBeenCalledTimes(1)
      expect(clearRegistrationMock).toHaveBeenCalledWith(7)
      expect(deleted.gmsRegistered).toBe(false)
      expect(upsertMock).not.toHaveBeenCalled()
    })

    // Their publish may have landed over there without being noted here.
    it('takes a member off who takes part and is not noted as held', async () => {
      await removeDeletedUserFromGms(member({ gmsRegistered: false }))
      expect(deleteMock).toHaveBeenCalledWith(API_KEY, MEMBER_UUID)
    })

    // A copy that never should have been made.
    it('takes a member off who is noted as held and does not take part', async () => {
      await removeDeletedUserFromGms(member({ gmsAllowed: false }))
      expect(deleteMock).toHaveBeenCalledWith(API_KEY, MEMBER_UUID)
    })

    // ⛔ The row can say "does not take part, not held" for a member who stands over there
    // all the same: a delete after a withdrawn consent that failed for good clears the note
    // here and leaves the copy there. So every deleted account is asked for, whatever its row
    // says -- the GMS answers for one it does not know as for one it took off.
    it('takes a member off whose row says they never were there', async () => {
      await removeDeletedUserFromGms(member({ gmsAllowed: false, gmsRegistered: false }))

      expect(deleteMock).toHaveBeenCalledTimes(1)
      expect(deleteMock).toHaveBeenCalledWith(API_KEY, MEMBER_UUID)
    })

    it('tells the GMS nothing on a server that does not use it', async () => {
      CONFIG.GMS_ACTIVE = false
      await removeDeletedUserFromGms(member())

      expect(homeCommunityMock).not.toHaveBeenCalled()
      expect(deleteMock).not.toHaveBeenCalled()
    })

    it('tells the GMS nothing where the community holds no key for it', async () => {
      homeCommunityMock.mockResolvedValue({ gmsApiKey: null })
      await removeDeletedUserFromGms(member())
      expect(deleteMock).not.toHaveBeenCalled()
    })

    // ⛔ The account is deleted by then. A GMS that cannot be reached must not turn the
    // moderator's deletion into an error -- and the delete is tried again by itself.
    it('does not fail where the GMS cannot be reached, and tries again later', async () => {
      useFakeTimersForDrizzle()
      deleteMock.mockRejectedValueOnce(new Error('connect ECONNREFUSED'))
      const deleted = member()

      await expect(removeDeletedUserFromGms(deleted)).resolves.toBeUndefined()
      expect(deleteMock).toHaveBeenCalledTimes(1)
      // From here on they count as gone: a later publish registers them anew.
      expect(deleted.gmsRegistered).toBe(false)

      jest.advanceTimersByTime(2000)
      await Promise.resolve()
      expect(deleteMock).toHaveBeenCalledTimes(2)
      expect(deleteMock).toHaveBeenLastCalledWith(API_KEY, MEMBER_UUID)
    })

    // ⛔ A try that came after the member was handed over again would take off the member
    // who was just handed over, entries and all -- and nothing would bring them back, they
    // are noted as held. So the hand-over ends the tries.
    it('gives the tries up where the member is handed over again meanwhile', async () => {
      useFakeTimersForDrizzle()
      deleteMock.mockRejectedValueOnce(new Error('connect ECONNREFUSED'))
      const account = member()

      await removeDeletedUserFromGms(account)
      await returnRestoredUserToGms(member())
      expect(upsertMock).toHaveBeenCalledTimes(1)

      for (const wait of [2000, 8000, 30000]) {
        jest.advanceTimersByTime(wait)
        await letItGoOn()
      }
      expect(deleteMock).toHaveBeenCalledTimes(1)
      expect(logger.info).toHaveBeenCalledWith(
        'deleting user 7 from the GMS is not wanted any more, not tried again',
      )
    })

    // The other side of it: a delete that fails AFTER the hand-over is tried again as ever,
    // while the tries of the one before it stay given up.
    it('tries a later delete again, and only that one', async () => {
      useFakeTimersForDrizzle()
      deleteMock
        .mockRejectedValueOnce(new Error('connect ECONNREFUSED'))
        .mockRejectedValueOnce(new Error('connect ECONNREFUSED'))

      await removeDeletedUserFromGms(member())
      await returnRestoredUserToGms(member())
      await removeDeletedUserFromGms(member())
      expect(deleteMock).toHaveBeenCalledTimes(2)

      jest.advanceTimersByTime(2000)
      await letItGoOn()
      expect(deleteMock).toHaveBeenCalledTimes(3)
    })

    // A deleted account has no next save behind it and cannot be deleted a second time: where
    // every try fails, the last line has to say WHOSE copy may still stand over there.
    it('says whose copy may remain where every try fails', async () => {
      useFakeTimersForDrizzle()
      deleteMock.mockRejectedValue(new Error('connect ECONNREFUSED'))

      await removeDeletedUserFromGms(member())
      for (const wait of [2000, 8000, 30000]) {
        jest.advanceTimersByTime(wait)
        await letItGoOn()
      }

      expect(deleteMock).toHaveBeenCalledTimes(4)
      expect(logger.error).toHaveBeenCalledWith(
        'deleting user 7 from the GMS still failing after 3 retries - GMS copy may remain',
      )
    })

    it('does not fail where the community cannot be read', async () => {
      homeCommunityMock.mockRejectedValue(new Error('Connection lost'))
      await expect(removeDeletedUserFromGms(member())).resolves.toBeUndefined()
      expect(deleteMock).not.toHaveBeenCalled()
    })
  })

  describe('returnRestoredUserToGms', () => {
    // The deletion took the member and everything of theirs off the GMS: what goes over is a
    // whole member, the live entries with them.
    it('hands a member who takes part over again, their live entries with them', async () => {
      await returnRestoredUserToGms(member({ gmsRegistered: false, gmsRegisteredAt: null }))

      expect(upsertMock).toHaveBeenCalledTimes(1)
      const [key, gmsUsers] = upsertMock.mock.calls[0]
      expect(key).toBe(API_KEY)
      expect(gmsUsers).toHaveLength(1)
      expect(gmsUsers[0].uuid).toBe(MEMBER_UUID)

      expect(selectEntriesMock).toHaveBeenCalledWith([7])
      expect(snapshotMock).toHaveBeenCalledTimes(1)
      const [snapshotKey, snapshots] = snapshotMock.mock.calls[0]
      expect(snapshotKey).toBe(API_KEY)
      expect(snapshots).toHaveLength(1)
      expect(snapshots[0].userUuid).toBe(MEMBER_UUID)
      expect(snapshots[0].entries.map((entry: { uuid: string }) => entry.uuid)).toEqual([
        ENTRY_UUID,
      ])

      expect(markRegisteredMock).toHaveBeenCalledWith([7])
      expect(deleteMock).not.toHaveBeenCalled()
    })

    it.each([
      ['who does not take part', { gmsAllowed: false }],
      ['without a place', { location: null }],
      ['whose place holds no coordinates', { location: { type: 'Point', coordinates: [] } }],
      ['of another community', { foreign: true }],
    ])('hands nobody over %s', async (_name, changed) => {
      await returnRestoredUserToGms(member(changed as unknown as Partial<DbUser>))

      expect(homeCommunityMock).not.toHaveBeenCalled()
      expect(upsertMock).not.toHaveBeenCalled()
      expect(snapshotMock).not.toHaveBeenCalled()
      expect(accountNowMock).not.toHaveBeenCalled()
    })

    it('hands nobody over on a server that does not use the GMS', async () => {
      CONFIG.GMS_ACTIVE = false
      await returnRestoredUserToGms(member())
      expect(upsertMock).not.toHaveBeenCalled()
    })

    it('hands nobody over where the community holds no key for it', async () => {
      homeCommunityMock.mockResolvedValue({ gmsApiKey: null })
      await returnRestoredUserToGms(member())
      expect(upsertMock).not.toHaveBeenCalled()
      // Nothing was handed over, so there is nothing to hold against the account.
      expect(accountNowMock).not.toHaveBeenCalled()
    })

    // ⛔ The moderation may delete the account again while the GMS is being asked to take the
    // member back, and the delete of that deletion may come ahead of what the GMS takes only
    // afterwards. So every hand-over ends with a look at the account as it stands then.
    describe('at the end of a hand-over', () => {
      it('looks at the account, and leaves a member whose account stands', async () => {
        await returnRestoredUserToGms(member())

        expect(accountNowMock).toHaveBeenCalledTimes(1)
        expect(accountNowMock).toHaveBeenCalledWith([7])
        expect(upsertMock.mock.invocationCallOrder[0]).toBeLessThan(
          accountNowMock.mock.invocationCallOrder[0],
        )
        expect(deleteMock).not.toHaveBeenCalled()
      })

      it('takes the member off once more where the account was deleted meanwhile', async () => {
        accountNowMock.mockResolvedValue([])
        await returnRestoredUserToGms(member())

        expect(deleteMock).toHaveBeenCalledTimes(1)
        expect(deleteMock).toHaveBeenCalledWith(API_KEY, MEMBER_UUID)
      })

      // Whether the GMS took them or not is not known for sure where the call failed.
      it('looks at the account as well where the hand-over did not get through', async () => {
        upsertMock.mockRejectedValue(new Error('timeout'))
        accountNowMock.mockResolvedValue([])
        await returnRestoredUserToGms(member())

        expect(deleteMock).toHaveBeenCalledWith(API_KEY, MEMBER_UUID)
      })
    })

    // The account is restored by then. Whether the publish throws or answers "no" is a switch
    // of the server (GMS_CREATE_USER_THROW_ERRORS); either way nothing reaches the moderator,
    // and the line that is written names the member -- the publish's own names nobody.
    describe.each([
      ['where a failed publish throws', true],
      ['where a failed publish answers no', false],
    ])('%s', (_name, throws) => {
      beforeEach(() => {
        CONFIG.GMS_CREATE_USER_THROW_ERRORS = throws
      })

      it.each([
        ['the GMS cannot be reached', () => upsertMock.mockRejectedValue(new Error('timeout'))],
        ['the GMS refuses the entries', () => snapshotMock.mockRejectedValue(new Error('400'))],
      ])(
        'does not fail where %s, and says whom it could not bring back',
        async (_what, breakIt) => {
          breakIt()
          await expect(returnRestoredUserToGms(member())).resolves.toBeUndefined()

          expect(logger.error).toHaveBeenCalledTimes(1)
          expect((logger.error as jest.Mock).mock.calls[0][0]).toContain(
            'could not bring the restored user 7 back to the GMS',
          )
        },
      )
    })

    it('does not fail where the community cannot be read', async () => {
      homeCommunityMock.mockRejectedValue(new Error('Connection lost'))
      await expect(returnRestoredUserToGms(member())).resolves.toBeUndefined()
      expect(upsertMock).not.toHaveBeenCalled()
    })

    it('writes no error where the member was handed over', async () => {
      await returnRestoredUserToGms(member())
      expect(logger.error).not.toHaveBeenCalled()
    })

    // ⛔ The moderator's mutation awaits this, and the two calls that hand a member over
    // carry no timeout. A GMS that does not answer must not keep "bring back" waiting.
    it('waits half a minute for a GMS that does not answer, and no longer', async () => {
      useFakeTimersForDrizzle()
      upsertMock.mockReturnValue(new Promise(() => undefined))
      let back = false
      returnRestoredUserToGms(member()).then(() => {
        back = true
      })

      await letItGoOn()
      jest.advanceTimersByTime(29_999)
      await letItGoOn()
      expect(back).toBe(false)

      jest.advanceTimersByTime(1)
      await letItGoOn()
      expect(back).toBe(true)
      expect(logger.error).toHaveBeenCalledTimes(1)
      expect((logger.error as jest.Mock).mock.calls[0][0]).toContain(
        'the GMS did not take the restored user 7 back within 30000 ms',
      )
    })

    it('leaves no clock running where the GMS answered', async () => {
      useFakeTimersForDrizzle()
      await returnRestoredUserToGms(member())
      expect(jest.getTimerCount()).toBe(0)
    })

    // ⛔ What is not waited for any longer still arrives. The moderation may have deleted the
    // account again by then, and the delete of that deletion may have come first: so a late
    // hand-over is held against the account as it stands, and a deleted one is taken off once
    // more. Nothing else would -- the repair run leaves a deleted account out.
    describe('a hand-over that arrives after it was no longer waited for', () => {
      let arrives: (taken: boolean) => void

      const comesLate = async () => {
        useFakeTimersForDrizzle()
        upsertMock.mockReturnValue(
          new Promise<boolean>((resolve) => {
            arrives = resolve
          }),
        )
        // Not awaited: without the bound it would never come back, and this test would wait
        // for the house's time limit instead of failing.
        let back = false
        returnRestoredUserToGms(member()).then(() => {
          back = true
        })
        await letItGoOn()
        jest.advanceTimersByTime(30_000)
        await letItGoOn()
        expect(back).toBe(true)
      }

      it('takes the member off once more where the account was deleted again meanwhile', async () => {
        await comesLate()
        expect(deleteMock).not.toHaveBeenCalled()

        accountNowMock.mockResolvedValue([])
        arrives(true)
        await letItGoOn()

        expect(accountNowMock).toHaveBeenCalledWith([7])
        expect(deleteMock).toHaveBeenCalledTimes(1)
        expect(deleteMock).toHaveBeenCalledWith(API_KEY, MEMBER_UUID)
      })

      it('leaves the member where the account still stands', async () => {
        await comesLate()

        accountNowMock.mockResolvedValue([member()])
        arrives(true)
        await letItGoOn()

        expect(accountNowMock).toHaveBeenCalledWith([7])
        expect(deleteMock).not.toHaveBeenCalled()
      })

      it('says so where the account cannot be read then, and fails nothing', async () => {
        await comesLate()

        accountNowMock.mockRejectedValue(new Error('Connection lost'))
        arrives(true)
        await letItGoOn()

        expect(deleteMock).not.toHaveBeenCalled()
        expect(logger.error).toHaveBeenCalledTimes(2)
        expect((logger.error as jest.Mock).mock.calls[1][0]).toContain(
          'could not look at user 7 after the hand-over to the GMS',
        )
      })
    })
  })

  // What `unDeleteUser` calls: the row read anew and handed over, as one step that cannot
  // fail the moderator's restore -- the read included.
  describe('returnRestoredAccountToGms', () => {
    it('reads the row anew and hands that member over', async () => {
      const asItStandsNow = member({ alias: 'bibi-now' })
      accountNowMock.mockResolvedValueOnce([asItStandsNow])

      await returnRestoredAccountToGms(7)

      expect(accountNowMock).toHaveBeenNthCalledWith(1, [7])
      expect(upsertMock).toHaveBeenCalledTimes(1)
      const [, gmsUsers] = upsertMock.mock.calls[0]
      expect(gmsUsers[0].uuid).toBe(MEMBER_UUID)
      expect(gmsUsers[0].alias).toBe('bibi-now')
    })

    // Deleted again between the restore and this read: there is no row, and nobody to hand over.
    it('hands nobody over where the account is deleted again by then', async () => {
      accountNowMock.mockResolvedValueOnce([])

      await returnRestoredAccountToGms(7)

      expect(homeCommunityMock).not.toHaveBeenCalled()
      expect(upsertMock).not.toHaveBeenCalled()
      // Nobody there is no failure, and is not written down as one.
      expect(logger.error).not.toHaveBeenCalled()
    })

    // ⛔ The account is restored by now. A row that cannot be read for the GMS is no reason
    // to tell the moderator that restoring failed.
    it('does not fail where the row cannot be read, and says whose', async () => {
      accountNowMock.mockRejectedValueOnce(new Error('Connection lost'))

      await expect(returnRestoredAccountToGms(7)).resolves.toBeUndefined()

      expect(upsertMock).not.toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledTimes(1)
      expect((logger.error as jest.Mock).mock.calls[0][0]).toContain(
        'could not read the restored user 7 for the GMS',
      )
    })
  })

  // The path the save of an entry takes. Where taking a deleted member off failed, the GMS
  // still knows them and would take the entry.
  describe('syncMatchingEntryToGms, for an account that is deleted', () => {
    it('removes the entry over there instead of publishing it', async () => {
      await syncMatchingEntryToGms(member({ deletedAt: new Date() }), liveEntry)

      expect(deleteEntryMock).toHaveBeenCalledTimes(1)
      expect(deleteEntryMock).toHaveBeenCalledWith(API_KEY, ENTRY_UUID)
      expect(putEntryMock).not.toHaveBeenCalled()
      expect(upsertMock).not.toHaveBeenCalled()
    })

    it('does not hand the member over first, where the GMS is noted as not holding them', async () => {
      await syncMatchingEntryToGms(
        member({ deletedAt: new Date(), gmsRegistered: false }),
        liveEntry,
      )

      expect(upsertMock).not.toHaveBeenCalled()
      expect(putEntryMock).not.toHaveBeenCalled()
    })

    // The other side of it: the same entry of the same member, not deleted.
    it('publishes the entry of a member whose account stands', async () => {
      await syncMatchingEntryToGms(member(), liveEntry)

      expect(putEntryMock).toHaveBeenCalledTimes(1)
      expect(putEntryMock.mock.calls[0][0]).toBe(API_KEY)
      expect(deleteEntryMock).not.toHaveBeenCalled()
    })
  })
})
