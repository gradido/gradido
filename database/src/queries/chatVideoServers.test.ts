// AI-GENERATED — not an architecture reference
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { DBDuplicateEntryError, DBNotFoundError } from '../errorTypes'
import { chatVideoServersTable } from '../schemas'
import {
  dbCountChatVideoServers,
  dbDeleteChatVideoServer,
  dbInsertChatVideoServer,
  dbSelectChatVideoServers,
  dbUpdateChatVideoServer,
} from './chatVideoServers'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// Distinct on every field, so that a value read back can only have come from its own column.
const FFMUC = {
  baseUrl: 'https://meet.ffmuc.net/',
  operator: 'Freifunk München (Freie Netze München e. V.)',
  roomPrefix: null,
  note: null,
  active: true,
}
const FAIRMEETING = {
  baseUrl: 'https://fairmeeting.net/',
  operator: 'fairmeeting (fairkom)',
  roomPrefix: 'GradidoAkademie',
  note: 'Akademie-Lizenz',
  active: false,
}
const SYSTEMLI = { baseUrl: 'https://meet.systemli.org/', operator: 'Systemli' }

/** The value of a Result that has to be a success; its error, readable, where it is not. */
const succeeded = <T>(
  result: { success: true; value: T } | { success: false; error: Error },
): T => {
  if (!result.success) {
    throw new Error(`expected a success, got ${result.error.message}`)
  }
  return result.value
}

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(chatVideoServersTable)
})
afterAll(async () => {
  await db.delete(chatVideoServersTable)
  await appDB.destroy()
})

describe('chatVideoServers query test', () => {
  let ffmucId: number
  let fairmeetingId: number

  it('starts empty', async () => {
    expect(await dbCountChatVideoServers()).toBe(0)
    expect(await dbSelectChatVideoServers()).toEqual([])
  })

  it('adds an entry and gives it back as stored', async () => {
    const row = succeeded(await dbInsertChatVideoServer(FFMUC))
    ffmucId = row.id

    expect(row).toMatchObject(FFMUC)
    expect(row.id).toBeGreaterThan(0)
    expect(row.createdAt).toBeInstanceOf(Date)
    expect(row.updatedAt).toBeNull()
    expect(await dbCountChatVideoServers()).toBe(1)
  })

  it('keeps every field apart, the tick and the prefix among them', async () => {
    const row = succeeded(await dbInsertChatVideoServer(FAIRMEETING))
    fairmeetingId = row.id

    // `active` comes back as a boolean, not as the column's 0: the admin page shows it as a tick.
    expect(row).toMatchObject(FAIRMEETING)
    expect(row.active).toBe(false)
  })

  it('makes an entry that names no tick an active one', async () => {
    const row = succeeded(await dbInsertChatVideoServer(SYSTEMLI))

    expect(row.active).toBe(true)
    expect(row.roomPrefix).toBeNull()
    expect(row.note).toBeNull()
  })

  it('refuses the same base address a second time', async () => {
    const result = await dbInsertChatVideoServer({ ...FFMUC, operator: 'somebody else' })

    expect(result.success).toBe(false)
    expect(!result.success && result.error).toBeInstanceOf(DBDuplicateEntryError)
    expect(await dbCountChatVideoServers()).toBe(3)
  })

  it('lists the entries oldest first', async () => {
    const rows = await dbSelectChatVideoServers()

    expect(rows.map((row) => row.baseUrl)).toEqual([
      FFMUC.baseUrl,
      FAIRMEETING.baseUrl,
      SYSTEMLI.baseUrl,
    ])
    expect(rows.map((row) => row.id)).toEqual([...rows.map((row) => row.id)].sort((a, b) => a - b))
  })

  it('changes an entry, and only what the change names', async () => {
    const row = succeeded(
      await dbUpdateChatVideoServer(ffmucId, { note: 'zuverlässig', active: false }),
    )

    expect(row).toMatchObject({ ...FFMUC, note: 'zuverlässig', active: false })
    expect(row.updatedAt).toBeInstanceOf(Date)
    const stored = (await dbSelectChatVideoServers()).find((entry) => entry.id === ffmucId)
    expect(stored).toMatchObject({ note: 'zuverlässig', active: false })
  })

  it('takes a change that changes nothing', async () => {
    // mysql2 counts the rows found, not the rows changed: "nothing to change" is not "not there".
    const row = succeeded(
      await dbUpdateChatVideoServer(fairmeetingId, { roomPrefix: FAIRMEETING.roomPrefix }),
    )

    expect(row).toMatchObject(FAIRMEETING)
  })

  it("refuses a change to another entry's base address", async () => {
    const result = await dbUpdateChatVideoServer(ffmucId, { baseUrl: FAIRMEETING.baseUrl })

    expect(result.success).toBe(false)
    expect(!result.success && result.error).toBeInstanceOf(DBDuplicateEntryError)
    const stored = (await dbSelectChatVideoServers()).find((entry) => entry.id === ffmucId)
    expect(stored?.baseUrl).toBe(FFMUC.baseUrl)
  })

  it('refuses a change to an entry that is not there', async () => {
    const result = await dbUpdateChatVideoServer(ffmucId + 100_000, { note: 'nobody' })

    expect(result.success).toBe(false)
    expect(!result.success && result.error).toBeInstanceOf(DBNotFoundError)
  })

  it('removes an entry', async () => {
    const result = await dbDeleteChatVideoServer(ffmucId)

    expect(result).toEqual({ success: true })
    const rows = await dbSelectChatVideoServers()
    expect(rows.map((row) => row.id)).not.toContain(ffmucId)
    expect(rows).toHaveLength(2)
    expect(await dbCountChatVideoServers()).toBe(2)
  })

  it('refuses to remove an entry that is not there', async () => {
    const result = await dbDeleteChatVideoServer(ffmucId)

    expect(result.success).toBe(false)
    expect(!result.success && result.error).toBeInstanceOf(DBNotFoundError)
    expect(await dbCountChatVideoServers()).toBe(2)
  })
})
