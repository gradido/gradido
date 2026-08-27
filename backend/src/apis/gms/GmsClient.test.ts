// AI-GENERATED — not an architecture reference
import axios from 'axios'
import { getLogger } from 'config-schema/test/testSetup'
import { MatchingEntrySelect } from 'database'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { LogError } from '@/server/LogError'

import {
  createGmsHandshakeJWTToken,
  deleteGmsMatchingEntry,
  deleteGmsUser,
  putGmsMatchingEntry,
  putGmsMatchingEntrySnapshots,
  upsertGmsUsers,
  verifyAuthToken,
  verifyGmsHandshakeJWTToken,
} from './GmsClient'
import { GmsMatchingEntrySnapshot, GmsUserMatchingEntry } from './model/GmsMatchingEntry'
import { GmsUser } from './model/GmsUser'

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))

const get = axios.get as jest.Mock
const post = axios.post as jest.Mock
const put = axios.put as jest.Mock
const del = axios.delete as jest.Mock

// LogError logs itself where it is built, so the status and status text land here
// rather than on the GmsClient logger, which only sees the wrapped message.
const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

const API_KEY = 'gms-test-key'
const USER_UUID = '3a2f6f1e-6c1a-4e1a-9d3e-2f1b7c8d9e01'
const ENTRY_UUID = 'b6f0c1d2-3e4a-4b5c-8d9e-0f1a2b3c4d5e'
// The url is deliberately written without a trailing slash, so every assertion below
// also proves the client puts one there before appending the route.
const BASE = 'http://gms.test/api'

function entry(overrides: Partial<MatchingEntrySelect> = {}): MatchingEntrySelect {
  return {
    uuid: ENTRY_UUID,
    matchingType: 'offer',
    summary: 'Lastenrad zum Ausleihen',
    details: null,
    remote: false,
    ...overrides,
  } as unknown as MatchingEntrySelect
}

function member(): GmsUser {
  return new GmsUser({
    gradidoID: USER_UUID,
    language: 'de',
    aboutMe: null,
    gmsAllowed: true,
    alias: 'bibi',
    firstName: 'Bibi',
    lastName: 'Bloxberg',
    gmsPublishName: 0,
    gmsPublishLocation: 0,
    location: null,
    emailContact: { email: 'bibi@bloxberg.de', gmsPublishEmail: true },
  } as any)
}

const ok = { status: 200, statusText: 'OK', data: {} }
const serverError = { status: 500, statusText: 'Internal Server Error', data: {} }

describe('GmsClient', () => {
  const originalActive = CONFIG.GMS_ACTIVE
  const originalUrl = CONFIG.GMS_API_URL

  beforeEach(() => {
    jest.clearAllMocks()
    CONFIG.GMS_ACTIVE = true
    CONFIG.GMS_API_URL = BASE
  })

  afterAll(() => {
    CONFIG.GMS_ACTIVE = originalActive
    CONFIG.GMS_API_URL = originalUrl
  })

  // The endpoint this delivery is about. Entries are their own call now, because a
  // member is one database row and their entries are many - only apart can both be
  // bounded by a limit that counts what the GMS actually writes.
  describe('putGmsMatchingEntrySnapshots', () => {
    const snapshots = [
      new GmsMatchingEntrySnapshot(USER_UUID, [entry()]),
      // A member with nothing left. The empty list is the whole point of a snapshot:
      // it tells the GMS to drop what it still holds for them.
      new GmsMatchingEntrySnapshot('7c4b1a90-1d2e-4f3a-8b5c-6d7e8f9a0b12', []),
    ]

    it('puts the snapshots to the snapshot route with the api key', async () => {
      put.mockResolvedValue(ok)

      await expect(putGmsMatchingEntrySnapshots(API_KEY, snapshots)).resolves.toBe(true)

      expect(put).toHaveBeenCalledTimes(1)
      const [url, body, config] = put.mock.calls[0]
      expect(url).toBe('http://gms.test/api/community-users/matching-entry-snapshots')
      expect(config.headers.authorization).toBe(`Bearer ${API_KEY}`)
      expect(body).toBe(snapshots)
    })

    it('sends each member as userUuid with their entries in plain text', async () => {
      put.mockResolvedValue(ok)

      await putGmsMatchingEntrySnapshots(API_KEY, snapshots)

      const [, body] = put.mock.calls[0]
      // Serialised, because that is what the GMS schema validates - a field the class
      // carries but JSON drops would pass an assertion on the object and fail there.
      expect(JSON.parse(JSON.stringify(body))).toEqual([
        {
          userUuid: USER_UUID,
          entries: [
            {
              uuid: ENTRY_UUID,
              matchingType: 'offer',
              summary: 'Lastenrad zum Ausleihen',
              details: null,
              remote: false,
            },
          ],
        },
        { userUuid: '7c4b1a90-1d2e-4f3a-8b5c-6d7e8f9a0b12', entries: [] },
      ])
    })

    // No `active` flag travels: a paused entry is not sent as paused, it is left out of
    // the snapshot and therefore deleted.
    it('does not carry the active flag over', async () => {
      put.mockResolvedValue(ok)

      await putGmsMatchingEntrySnapshots(API_KEY, [
        new GmsMatchingEntrySnapshot(USER_UUID, [entry({ active: true, userId: 42 } as any)]),
      ])

      const [, body] = put.mock.calls[0]
      expect(body[0].entries[0]).not.toHaveProperty('active')
      expect(body[0].entries[0]).not.toHaveProperty('userId')
    })

    it('throws on a status other than 200', async () => {
      put.mockResolvedValue(serverError)

      await expect(putGmsMatchingEntrySnapshots(API_KEY, snapshots)).rejects.toThrow(
        'HTTP Status Error in community-users/matching-entry-snapshots:',
      )
      expect(logErrorLogger.error).toBeCalledWith(
        'HTTP Status Error in community-users/matching-entry-snapshots:',
        500,
        'Internal Server Error',
      )
    })

    it('throws when the request itself fails', async () => {
      put.mockRejectedValue(new Error('ECONNREFUSED'))

      await expect(putGmsMatchingEntrySnapshots(API_KEY, snapshots)).rejects.toThrow('ECONNREFUSED')
    })

    it('sends nothing while GMS_ACTIVE is off', async () => {
      CONFIG.GMS_ACTIVE = false

      await expect(putGmsMatchingEntrySnapshots(API_KEY, snapshots)).resolves.toBe(false)
      expect(put).not.toHaveBeenCalled()
    })
  })

  // The twin the snapshot call is built against - same headers, same guard, same error
  // handling. Untested it would be free to drift apart from it.
  describe('upsertGmsUsers', () => {
    it('posts the users to the bulk route with the api key', async () => {
      post.mockResolvedValue(ok)
      const users = [member()]

      await expect(upsertGmsUsers(API_KEY, users)).resolves.toBe(true)

      expect(post).toHaveBeenCalledTimes(1)
      const [url, body, config] = post.mock.calls[0]
      expect(url).toBe('http://gms.test/api/community-users')
      expect(config.headers.authorization).toBe(`Bearer ${API_KEY}`)
      expect(body).toBe(users)
    })

    // The entries moved out of the user payload. If they came back the GMS would write
    // them through a route whose limit cannot see them.
    it('does not carry matching entries any more', async () => {
      post.mockResolvedValue(ok)

      await upsertGmsUsers(API_KEY, [member()])

      const [, body] = post.mock.calls[0]
      expect(body[0]).not.toHaveProperty('matchingEntries')
    })

    it('throws on a status other than 200', async () => {
      post.mockResolvedValue(serverError)

      await expect(upsertGmsUsers(API_KEY, [member()])).rejects.toThrow(
        'HTTP Status Error in community-users:',
      )
      expect(logErrorLogger.error).toBeCalledWith(
        'HTTP Status Error in community-users:',
        500,
        'Internal Server Error',
      )
    })

    it('sends nothing while GMS_ACTIVE is off', async () => {
      CONFIG.GMS_ACTIVE = false

      await expect(upsertGmsUsers(API_KEY, [member()])).resolves.toBe(false)
      expect(post).not.toHaveBeenCalled()
    })
  })

  // The everyday routes: one entry at a time, as a member adds, edits, pauses or
  // deletes it. They stay as they are - the snapshot route is only for batches.
  describe('single matching entry routes', () => {
    it('puts one entry addressed to its owner', async () => {
      put.mockResolvedValue(ok)
      const payload = new GmsUserMatchingEntry(USER_UUID, entry())

      await expect(putGmsMatchingEntry(API_KEY, payload)).resolves.toBe(true)

      const [url, body, config] = put.mock.calls[0]
      expect(url).toBe('http://gms.test/api/community-user/matching-entry')
      expect(config.headers.authorization).toBe(`Bearer ${API_KEY}`)
      expect(body.userUuid).toBe(USER_UUID)
      expect(body.uuid).toBe(ENTRY_UUID)
    })

    it('deletes one entry by its uuid in the path', async () => {
      del.mockResolvedValue(ok)

      await expect(deleteGmsMatchingEntry(API_KEY, ENTRY_UUID)).resolves.toBe(true)

      const [url] = del.mock.calls[0]
      expect(url).toBe(`http://gms.test/api/community-user/matching-entry/${ENTRY_UUID}`)
    })

    it('throws on a status other than 200', async () => {
      del.mockResolvedValue(serverError)

      await expect(deleteGmsMatchingEntry(API_KEY, ENTRY_UUID)).rejects.toThrow(LogError)
    })

    it('sends nothing while GMS_ACTIVE is off', async () => {
      CONFIG.GMS_ACTIVE = false

      await expect(
        putGmsMatchingEntry(API_KEY, new GmsUserMatchingEntry(USER_UUID, entry())),
      ).resolves.toBe(false)
      await expect(deleteGmsMatchingEntry(API_KEY, ENTRY_UUID)).resolves.toBe(false)
      expect(put).not.toHaveBeenCalled()
      expect(del).not.toHaveBeenCalled()
    })
  })

  describe('deleteGmsUser', () => {
    it('deletes the member by uuid in the path', async () => {
      del.mockResolvedValue(ok)

      await expect(deleteGmsUser(API_KEY, USER_UUID)).resolves.toBe(true)

      const [url, config] = del.mock.calls[0]
      expect(url).toBe(`http://gms.test/api/community-user/${USER_UUID}`)
      expect(config.headers.authorization).toBe(`Bearer ${API_KEY}`)
    })

    it('throws on a status other than 200', async () => {
      del.mockResolvedValue(serverError)

      await expect(deleteGmsUser(API_KEY, USER_UUID)).rejects.toThrow(LogError)
    })

    it('sends nothing while GMS_ACTIVE is off', async () => {
      CONFIG.GMS_ACTIVE = false

      await expect(deleteGmsUser(API_KEY, USER_UUID)).resolves.toBe(false)
      expect(del).not.toHaveBeenCalled()
    })
  })

  describe('verifyAuthToken', () => {
    it('asks the GMS about the token and hands back what it says', async () => {
      get.mockResolvedValue({ ...ok, data: 'verified-token' })

      await expect(verifyAuthToken(API_KEY, 'some-token')).resolves.toBe('verified-token')

      const [url, config] = get.mock.calls[0]
      expect(url).toBe('http://gms.test/api/verify-auth-token/some-token')
      expect(config.headers.authorization).toBe(`Bearer ${API_KEY}`)
    })

    it('throws on a status other than 200', async () => {
      get.mockResolvedValue(serverError)

      await expect(verifyAuthToken(API_KEY, 'some-token')).rejects.toThrow(LogError)
    })
  })

  // The handshake that lets a member walk from the wallet into the GMS without logging
  // in again. Nothing here reaches the network.
  describe('handshake token', () => {
    it('round-trips the member uuid', async () => {
      const token = await createGmsHandshakeJWTToken(USER_UUID)

      await expect(verifyGmsHandshakeJWTToken(token)).resolves.toBe(USER_UUID)
    })

    // The one place that swallows its failure and answers undefined instead of throwing
    // - a caller who treats that as a uuid would let anybody in.
    it('answers undefined for a token signed with another secret', async () => {
      const token = await createGmsHandshakeJWTToken(USER_UUID)
      const realSecret = CONFIG.JWT_SECRET
      CONFIG.JWT_SECRET = 'a-different-secret'

      await expect(verifyGmsHandshakeJWTToken(token)).resolves.toBeUndefined()

      CONFIG.JWT_SECRET = realSecret
    })

    it('answers undefined for something that is not a token at all', async () => {
      await expect(verifyGmsHandshakeJWTToken('not-a-token')).resolves.toBeUndefined()
    })
  })
})
