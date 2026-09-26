// AI-GENERATED — not an architecture reference
import { cleanDB, testEnvironment } from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import { AppDatabase, dbInsertChatVideoServer, dbSelectChatVideoServers } from 'database'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { CHAT_VIDEO_SERVERS_DEFAULT } from '@/data/ChatVideoServers.default'
import { seedChatVideoServers } from './seedChatVideoServers'

/**
 * The seed runs against the database, as it does at a start: it asks the table how many rows it
 * holds and writes through dbInsertChatVideoServer. What it reads, CHAT_VIDEO_SERVERS, is set
 * per test.
 */

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.jitsi.seedChatVideoServers`)

const AKADEMIE = 'https://fairmeeting.net/|fairmeeting (fairkom)|GradidoAkademie'

let db: AppDatabase
const configuredBefore = CONFIG.CHAT_VIDEO_SERVERS

beforeAll(async () => {
  db = (await testEnvironment()).db
})

beforeEach(async () => {
  jest.clearAllMocks()
  CONFIG.CHAT_VIDEO_SERVERS = ''
  await cleanDB()
})

afterAll(async () => {
  CONFIG.CHAT_VIDEO_SERVERS = configuredBefore
  await cleanDB()
  await db.destroy()
})

/** The table without its dates, which say nothing here. */
const storedRows = async () =>
  (await dbSelectChatVideoServers()).map(({ baseUrl, operator, roomPrefix, note, active }) => ({
    baseUrl,
    operator,
    roomPrefix,
    note,
    active,
  }))

describe('seedChatVideoServers', () => {
  it('fills an empty table with the default list, each server ticked, and says so', async () => {
    await seedChatVideoServers()

    expect(await storedRows()).toEqual(
      CHAT_VIDEO_SERVERS_DEFAULT.map((entry) => ({
        baseUrl: entry.baseUrl,
        operator: entry.operator,
        roomPrefix: null,
        note: null,
        active: true,
      })),
    )
    expect(logger.info).toHaveBeenCalledWith(
      `chat video servers: the list was empty -- filled with ${CHAT_VIDEO_SERVERS_DEFAULT.length} from the default list`,
    )
  })

  // ⛔ Bernd's agreement with fairkom covers the prefix, not a server to fall back on.
  it('fills an empty table with CHAT_VIDEO_SERVERS alone, where it is set -- prefix and all', async () => {
    CONFIG.CHAT_VIDEO_SERVERS = AKADEMIE
    await seedChatVideoServers()

    expect(await storedRows()).toEqual([
      {
        baseUrl: 'https://fairmeeting.net/',
        operator: 'fairmeeting (fairkom)',
        roomPrefix: 'GradidoAkademie',
        note: null,
        active: true,
      },
    ])
    expect(logger.info).toHaveBeenCalledWith(
      'chat video servers: the list was empty -- filled with 1 from CHAT_VIDEO_SERVERS',
    )
  })

  // ⛔ From the first start on the table is the list: what an administrator decided stays.
  it('leaves a table with a row as it is -- also a single one, switched off', async () => {
    const kept = {
      baseUrl: 'https://meet.ffmuc.net/',
      operator: 'Freifunk München',
      roomPrefix: null,
      note: 'off for a test',
      active: false,
    }
    expect((await dbInsertChatVideoServer(kept)).success).toBe(true)

    await seedChatVideoServers()
    CONFIG.CHAT_VIDEO_SERVERS = AKADEMIE
    await seedChatVideoServers()

    expect(await storedRows()).toEqual([kept])
    expect(logger.info).not.toHaveBeenCalled()
  })

  it('fills nothing twice: a second start finds the list of the first', async () => {
    await seedChatVideoServers()
    await seedChatVideoServers()
    expect(await storedRows()).toHaveLength(CHAT_VIDEO_SERVERS_DEFAULT.length)
  })

  it('writes nothing where CHAT_VIDEO_SERVERS holds no usable entry, and says so loudly', async () => {
    CONFIG.CHAT_VIDEO_SERVERS = 'http://fairmeeting.net/|fairmeeting (fairkom)|GradidoAkademie'
    await seedChatVideoServers()

    expect(await storedRows()).toEqual([])
    expect(logger.warn).toHaveBeenCalledWith(
      'chat video server left out: http://fairmeeting.net/|fairmeeting (fairkom)|GradidoAkademie (NOT_HTTPS)',
    )
    expect(logger.error).toHaveBeenCalledWith(
      'chat video servers: CHAT_VIDEO_SERVERS holds no usable entry -- the list stays empty',
    )
  })

  it('never throws: a list that cannot be read is logged, and the start goes on', async () => {
    await expect(
      seedChatVideoServers(() => {
        throw new Error('the list could not be read')
      }),
    ).resolves.toBeUndefined()
    expect(logger.error).toHaveBeenCalledWith(
      'filling the list of the chat video servers failed',
      expect.any(Error),
    )
    expect(await storedRows()).toEqual([])
  })
})
