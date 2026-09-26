// AI-GENERATED — not an architecture reference
import { AppDatabase, ContributionLink as DbContributionLink } from '..'
import { createContributionLink } from '../seeds/factory/contributionLink'
import { dbFindContributionLinkIdByCode } from './contributionLinks'

const db = AppDatabase.getInstance()

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

describe('dbFindContributionLinkIdByCode', () => {
  let link: DbContributionLink

  beforeAll(async () => {
    await DbContributionLink.clear()
    link = await createContributionLink({
      amount: 200,
      name: 'Dokumenta',
      memo: 'Besuch',
      validFrom: new Date(),
    })
  })

  it('finds the link by the code a registration brings, with its CL- prefix', async () => {
    expect(await dbFindContributionLinkIdByCode(`CL-${link.code}`)).toBe(link.id)
  })

  it('finds nothing for an unknown code', async () => {
    expect(await dbFindContributionLinkIdByCode('CL-unknown')).toBeNull()
  })

  it('finds no deleted link', async () => {
    await DbContributionLink.softRemove(link)
    expect(await dbFindContributionLinkIdByCode(`CL-${link.code}`)).toBeNull()
  })
})
