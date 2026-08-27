// AI-GENERATED — not an architecture reference
import {
  AppDatabase,
  Community as DbCommunity,
  User as DbUser,
  dbSelectActiveMatchingEntriesByUserIds,
  MatchingEntrySelect,
} from 'database'
import { putGmsMatchingEntrySnapshots, upsertGmsUsers } from '@/apis/gms/GmsClient'
import { CONFIG } from '@/config'

import { sendUsersToGms } from './sendUserToGms'

jest.mock('@/apis/gms/GmsClient')
jest.mock('database', () => {
  const actual = jest.requireActual('database')
  return {
    __esModule: true,
    ...actual,
    dbSelectActiveMatchingEntriesByUserIds: jest.fn(),
    AppDatabase: { getInstance: jest.fn() },
  }
})

const upsertMock = upsertGmsUsers as jest.Mock
const snapshotMock = putGmsMatchingEntrySnapshots as jest.Mock
const selectEntriesMock = dbSelectActiveMatchingEntriesByUserIds as jest.Mock

// The one statement sendUsersToGms writes itself: marking the batch as published.
const execute = jest.fn()
const queryBuilder: Record<string, jest.Mock> = {
  update: jest.fn(() => queryBuilder),
  set: jest.fn(() => queryBuilder),
  where: jest.fn(() => queryBuilder),
  execute,
}

const HOME_COM = { gmsApiKey: 'gms-test-key' } as DbCommunity

function member(id: number, gradidoID: string): DbUser {
  return {
    id,
    gradidoID,
    language: 'de',
    aboutMe: null,
    gmsAllowed: true,
    alias: `member-${id}`,
    firstName: 'Bibi',
    lastName: 'Bloxberg',
    gmsPublishName: 0,
    gmsPublishLocation: 0,
    location: null,
    emailContact: { email: `member-${id}@example.org`, gmsPublishEmail: true },
  } as unknown as DbUser
}

function entry(userId: number, uuid: string): MatchingEntrySelect {
  return {
    userId,
    uuid,
    matchingType: 'offer',
    summary: 'Lastenrad zum Ausleihen',
    details: null,
    remote: false,
    active: true,
  } as unknown as MatchingEntrySelect
}

const WITH_ENTRIES = member(1, '3a2f6f1e-6c1a-4e1a-9d3e-2f1b7c8d9e01')
const WITHOUT_ENTRIES = member(2, '7c4b1a90-1d2e-4f3a-8b5c-6d7e8f9a0b12')
const ENTRY_UUID = 'b6f0c1d2-3e4a-4b5c-8d9e-0f1a2b3c4d5e'

describe('sendUsersToGms', () => {
  const originalThrows = CONFIG.GMS_CREATE_USER_THROW_ERRORS

  beforeEach(() => {
    jest.clearAllMocks()
    ;(AppDatabase.getInstance as jest.Mock).mockReturnValue({
      getDataSource: () => ({ createQueryBuilder: () => queryBuilder }),
    })
    upsertMock.mockResolvedValue(true)
    snapshotMock.mockResolvedValue(true)
    selectEntriesMock.mockResolvedValue([entry(WITH_ENTRIES.id, ENTRY_UUID)])
  })

  afterAll(() => {
    CONFIG.GMS_CREATE_USER_THROW_ERRORS = originalThrows
  })

  describe('the everyday path', () => {
    it('sends the users alone and says nothing about entries', async () => {
      await expect(sendUsersToGms([WITH_ENTRIES], HOME_COM)).resolves.toBe(true)

      expect(upsertMock).toHaveBeenCalledTimes(1)
      // Saying nothing is what leaves the entries the GMS holds alone. An empty
      // snapshot here would wipe them on every profile edit.
      expect(snapshotMock).not.toHaveBeenCalled()
      expect(selectEntriesMock).not.toHaveBeenCalled()
    })
  })

  describe('the repair path', () => {
    it('sends the users first and the snapshots after', async () => {
      await sendUsersToGms([WITH_ENTRIES], HOME_COM, true)

      expect(upsertMock).toHaveBeenCalledTimes(1)
      expect(snapshotMock).toHaveBeenCalledTimes(1)
      // The GMS drops a snapshot for a member it does not know yet, warns, and answers
      // 200 all the same. The wrong order therefore loses every entry in silence, which
      // is why this is asserted rather than left to the reading of the code.
      expect(upsertMock.mock.invocationCallOrder[0]).toBeLessThan(
        snapshotMock.mock.invocationCallOrder[0],
      )
    })

    it('addresses the entries by the member uuid, not the local id', async () => {
      await sendUsersToGms([WITH_ENTRIES], HOME_COM, true)

      const [apiKey, snapshots] = snapshotMock.mock.calls[0]
      expect(apiKey).toBe('gms-test-key')
      expect(snapshots).toEqual([
        expect.objectContaining({
          userUuid: WITH_ENTRIES.gradidoID,
          entries: [expect.objectContaining({ uuid: ENTRY_UUID })],
        }),
      ])
    })

    // The line that makes a repair run clean up. Drop it and nobody notices until
    // entries paused months ago are still turning up in the GMS search.
    it('sends an empty snapshot for a member who has no entries left', async () => {
      await sendUsersToGms([WITH_ENTRIES, WITHOUT_ENTRIES], HOME_COM, true)

      const [, snapshots] = snapshotMock.mock.calls[0]
      expect(snapshots).toHaveLength(2)
      expect(snapshots[1]).toEqual(
        expect.objectContaining({ userUuid: WITHOUT_ENTRIES.gradidoID, entries: [] }),
      )
    })

    it('marks the batch as published once both calls are through', async () => {
      await sendUsersToGms([WITH_ENTRIES, WITHOUT_ENTRIES], HOME_COM, true)

      expect(execute).toHaveBeenCalledTimes(1)
      expect(queryBuilder.where).toHaveBeenCalledWith('id IN (:...ids)', { ids: [1, 2] })
    })
  })

  describe('when the users do not get through', () => {
    it('does not send the snapshots and does not mark anybody published', async () => {
      upsertMock.mockResolvedValue(false)

      await sendUsersToGms([WITH_ENTRIES], HOME_COM, true)

      expect(snapshotMock).not.toHaveBeenCalled()
      expect(execute).not.toHaveBeenCalled()
    })

    it('does not mark anybody published when the snapshots throw', async () => {
      CONFIG.GMS_CREATE_USER_THROW_ERRORS = false
      snapshotMock.mockRejectedValue(new Error('ECONNREFUSED'))

      await expect(sendUsersToGms([WITH_ENTRIES], HOME_COM, true)).resolves.toBe(false)

      expect(execute).not.toHaveBeenCalled()
    })
  })

  it('refuses to publish without an api key', async () => {
    await expect(
      sendUsersToGms([WITH_ENTRIES], { gmsApiKey: null } as DbCommunity),
    ).rejects.toThrow('HomeCommunity needs GMS-ApiKey to publish user data to GMS.')
  })
})
