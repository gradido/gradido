// AI-GENERATED — not an architecture reference
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { assistedRegistrationsTable } from '../schemas/drizzle.schema'
import {
  dbDeleteAssistedRegistration,
  dbFindAssistedRegistrationByCode,
  dbInsertAssistedRegistration,
  dbPurgeExpiredAssistedRegistrations,
} from './assistedRegistrations'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

const attempt = (assistCode: bigint, createdAt?: Date) => ({
  firstName: 'Guest',
  lastName: 'Person',
  language: 'de',
  redeemCode: 'CL-testcode',
  hostUserId: 1,
  assistCode,
  ...(createdAt ? { createdAt } : {}),
})

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(assistedRegistrationsTable)
})
afterAll(async () => {
  await appDB.destroy()
})

describe('assistedRegistrations query test', () => {
  it('reports a miss for a code nobody parked', async () => {
    expect((await dbFindAssistedRegistrationByCode(BigInt(12345))).success).toBe(false)
  })

  it('parks an attempt and finds it again by its code', async () => {
    await dbInsertAssistedRegistration(attempt(BigInt(1111)))
    const found = await dbFindAssistedRegistrationByCode(BigInt(1111))
    expect(found.success).toBe(true)
    if (!found.success) {
      return
    }
    expect(found.value.firstName).toBe('Guest')
    expect(found.value.redeemCode).toBe('CL-testcode')
    expect(found.value.assistCode).toBe(BigInt(1111))
  })

  it('deletes a used attempt so its code stops answering', async () => {
    const found = await dbFindAssistedRegistrationByCode(BigInt(1111))
    expect(found.success).toBe(true)
    if (!found.success) {
      return
    }
    await dbDeleteAssistedRegistration(found.value.id)
    expect((await dbFindAssistedRegistrationByCode(BigInt(1111))).success).toBe(false)
  })

  // The cutoff is the caller's "now minus validity window". A row older than the cutoff
  // goes, a fresh one stays — asserted on both sides, so a purge that deletes everything
  // (the mistake the e-mail-change purge test once made) cannot pass.
  it('purges only what lies before the cutoff', async () => {
    const old = new Date(Date.now() - 1000 * 60 * 60 * 48)
    await dbInsertAssistedRegistration(attempt(BigInt(2222), old))
    await dbInsertAssistedRegistration(attempt(BigInt(3333)))

    await dbPurgeExpiredAssistedRegistrations(new Date(Date.now() - 1000 * 60 * 60 * 24))

    expect((await dbFindAssistedRegistrationByCode(BigInt(2222))).success).toBe(false)
    expect((await dbFindAssistedRegistrationByCode(BigInt(3333))).success).toBe(true)
  })
})
