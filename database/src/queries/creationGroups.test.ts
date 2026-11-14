// AI-GENERATED — not an architecture reference
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { creationGroupsTable } from '../schemas'
import { dbSelectCreationGroupByTag } from './creationGroups'
import { dbDeleteAllRowsExceptMigrations } from './informationSchemaTables'

const appDB = AppDatabase.getInstance()
let gardenId: number

beforeAll(async () => {
  await appDB.init()
  await dbDeleteAllRowsExceptMigrations()
  const [garden] = await drizzleDb()
    .insert(creationGroupsTable)
    .values({ tag: 'Gemeinschaftsgarten', name: 'Gemeinschaftsgarten am Bach' })
  gardenId = garden.insertId
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
