// AI-GENERATED — not an architecture reference
import { LoginElopageBuys as DbLoginElopageBuys } from '..'
import { AppDatabase } from '../AppDatabase'
import { dbCountElopageBuysByEmail, dbCountElopageBuysByEmails } from './loginElopageBuys'

const db = AppDatabase.getInstance()

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

describe('loginElopageBuys.queries', () => {
  beforeAll(async () => {
    await DbLoginElopageBuys.clear()
    await DbLoginElopageBuys.save(
      DbLoginElopageBuys.create({
        payerEmail: 'buyer@example.org',
        publisherEmail: 'publisher@example.org',
        productPrice: 4000,
        payed: true,
        successDate: new Date(),
        event: 'payment.successful',
      }),
    )
  })

  it('counts the events filed under an address, and nothing for another', async () => {
    expect(await dbCountElopageBuysByEmail('buyer@example.org')).toBe(1)
    expect(await dbCountElopageBuysByEmail('nobody@example.org')).toBe(0)
  })

  it('looks at the payer only - the publisher is the seller, not the member', async () => {
    expect(await dbCountElopageBuysByEmail('publisher@example.org')).toBe(0)
  })

  it('counts over several addresses at once, and nothing for none', async () => {
    expect(await dbCountElopageBuysByEmails(['nobody@example.org', 'buyer@example.org'])).toBe(1)
    expect(await dbCountElopageBuysByEmails([])).toBe(0)
  })
})
