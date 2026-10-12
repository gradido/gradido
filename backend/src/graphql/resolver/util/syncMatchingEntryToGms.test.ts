// AI-GENERATED — not an architecture reference
import { getLogger } from 'config-schema/test/testSetup'
import {
  Community as DbCommunity,
  User as DbUser,
  dbClearGmsRegistration,
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

/** Lets what waits on an answer go on: the steps of a retry between two turns of the clock. */
const letItGoOn = async () => {
  for (let step = 0; step < 10; step++) {
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

    it('tells the GMS nothing about a member who never was there', async () => {
      await removeDeletedUserFromGms(member({ gmsAllowed: false, gmsRegistered: false }))

      expect(homeCommunityMock).not.toHaveBeenCalled()
      expect(deleteMock).not.toHaveBeenCalled()
      expect(clearRegistrationMock).not.toHaveBeenCalled()
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
      jest.useFakeTimers()
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

    // A deleted account has no next save behind it and cannot be deleted a second time: where
    // every try fails, the last line has to say WHOSE copy may still stand over there.
    it('says whose copy may remain where every try fails', async () => {
      jest.useFakeTimers()
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
