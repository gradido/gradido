// AI-GENERATED — not an architecture reference
import { LoginElopageBuys as DbLoginElopageBuys } from '..'
import { AppDatabase } from '../AppDatabase'
import { dbCountElopageBuysByEmail } from './loginElopageBuys'

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
})
