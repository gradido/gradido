// AI-GENERATED — not an architecture reference
// ⛔ All of the runner's functions from here, not only `spyOn`: a file that imports from bun:test
// gets none of them as globals (see chatConversations.test.ts).
import { afterAll, beforeAll, describe, expect, it, spyOn } from 'bun:test'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { creationGroupsTable } from '../schemas'
import {
  dbReplaceUserCreationGroups,
  dbSelectCreationGroupByTag,
  dbSelectCreationGroupIdsIn,
  dbSelectUserCreationGroups,
} from './creationGroups'
import { dbDeleteAllRowsExceptMigrations } from './informationSchemaTables'

const appDB = AppDatabase.getInstance()
let gardenId: number
let beesId: number

beforeAll(async () => {
  await appDB.init()
  await dbDeleteAllRowsExceptMigrations()
  const [garden] = await drizzleDb()
    .insert(creationGroupsTable)
    .values({ tag: 'Gemeinschaftsgarten', name: 'Gemeinschaftsgarten am Bach' })
  gardenId = garden.insertId
  const [bees] = await drizzleDb()
    .insert(creationGroupsTable)
    .values({ tag: 'Bienen', name: 'Bienenfreunde' })
  beesId = bees.insertId
})
afterAll(async () => {
  await dbDeleteAllRowsExceptMigrations()
  await appDB.destroy()
})

describe('creationGroups query test', () => {
  it('finds a group by its tag', async () => {
    expect(await dbSelectCreationGroupByTag('Gemeinschaftsgarten')).toEqual({
      id: gardenId,
      tag: 'Gemeinschaftsgarten',
      name: 'Gemeinschaftsgarten am Bach',
    })
  })

  it('finds it without regard to case, and answers the tag as it is stored', async () => {
    expect((await dbSelectCreationGroupByTag('gemeinschaftsgarten'))?.tag).toBe(
      'Gemeinschaftsgarten',
    )
  })

  it('answers null for a tag the community has no group for', async () => {
    expect(await dbSelectCreationGroupByTag('Imkerei')).toBeNull()
  })
})

// "Meine Gruppen" (MG1): a choice may name only groups there are.
describe('dbSelectCreationGroupIdsIn', () => {
  it('answers the numbers the community has a group for, and leaves out the others', async () => {
    const unknown = Math.max(gardenId, beesId) + 1000
    const found = await dbSelectCreationGroupIdsIn([beesId, unknown, gardenId])
    expect([...found].sort((a, b) => a - b)).toEqual([gardenId, beesId].sort((a, b) => a - b))
  })

  it('answers none for numbers without a group', async () => {
    expect(await dbSelectCreationGroupIdsIn([Math.max(gardenId, beesId) + 1000])).toEqual([])
  })

  it('asks nothing for no number', async () => {
    const asked = spyOn(appDB, 'getDrizzleDataSource')
    try {
      expect(await dbSelectCreationGroupIdsIn([])).toEqual([])
      expect(asked).not.toHaveBeenCalled()
      // The spy sees the statement where there is one to send.
      await dbSelectCreationGroupIdsIn([gardenId])
      expect(asked).toHaveBeenCalled()
    } finally {
      asked.mockRestore()
    }
  })
})

describe("a member's personal list", () => {
  it('answers the groups in the order they were given, and replaces rather than adds', async () => {
    await dbReplaceUserCreationGroups(4711, [beesId, gardenId])
    expect((await dbSelectUserCreationGroups(4711)).map(({ id }) => id)).toEqual([beesId, gardenId])

    await dbReplaceUserCreationGroups(4711, [gardenId])
    expect((await dbSelectUserCreationGroups(4711)).map(({ id }) => id)).toEqual([gardenId])

    await dbReplaceUserCreationGroups(4711, [])
    expect(await dbSelectUserCreationGroups(4711)).toEqual([])
  })
})
