// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { contributionLinksTable } from '../schemas'
import { contributionLinkFactory } from '../seeds/factory/contributionLink'
import { dbFindContributionLinkIdByCode, dbInsertContributionLink } from './contributionLinks'

const db = AppDatabase.getInstance()
const linkData = { amount: 200, name: 'Dokumenta', memo: 'Besuch', validFrom: new Date() }

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

describe('dbFindContributionLinkIdByCode', () => {
  let link: Awaited<ReturnType<typeof contributionLinkFactory>>

  beforeAll(async () => {
    await drizzleDb().delete(contributionLinksTable)
    link = await contributionLinkFactory(linkData)
  })

  it('finds the link by the code a registration brings, with its CL- prefix', async () => {
    expect(await dbFindContributionLinkIdByCode(`CL-${link.code}`)).toBe(link.id)
  })

  it('finds nothing for an unknown code', async () => {
    expect(await dbFindContributionLinkIdByCode('CL-unknown')).toBeNull()
  })

  it('finds no deleted link', async () => {
    await drizzleDb()
      .update(contributionLinksTable)
      .set({ deletedAt: new Date() })
      .where(eq(contributionLinksTable.id, link.id))
    expect(await dbFindContributionLinkIdByCode(`CL-${link.code}`)).toBeNull()
  })
})

describe('dbInsertContributionLink', () => {
  it('returns the id of the row it wrote', async () => {
    await drizzleDb().delete(contributionLinksTable)
    const row = {
      name: 'Dokumenta',
      memo: 'Besuch',
      validFrom: new Date(),
      code: 'insertcode',
    }

    const id = await dbInsertContributionLink(row)

    const rows = await drizzleDb()
      .select({ code: contributionLinksTable.code })
      .from(contributionLinksTable)
      .where(eq(contributionLinksTable.id, id))
    expect(rows).toEqual([{ code: 'insertcode' }])
  })
})
