// AI-GENERATED — not an architecture reference
import { GradidoUnit } from 'shared'
import { ContributionStatus } from '../../enum'
import { CreationInterface } from '../creation/CreationInterface'
import { buildSeedCreationRows, newSeedBookingState, sortCreationsByBalanceDate } from './creation'
import { SeedUserRef } from './user'

const COMMUNITY_UUID = '0bd3a4a9-31a4-4b0a-8f3c-0c1d7a4b6f00'
const ref = (id: number, name: string): SeedUserRef => ({
  id,
  gradidoId: `gradido-id-${id}`,
  communityUuid: COMMUNITY_UUID,
  name,
})
const moderator = ref(1, 'Mo Derator')
const anna = ref(2, 'Anna A')
const ben = ref(3, 'Ben B')
const refsByEmail = new Map([
  ['moderator@seed.de', moderator],
  ['anna@seed.de', anna],
  ['ben@seed.de', ben],
])

const creation = (email: string, extra: Partial<CreationInterface> = {}): CreationInterface => ({
  email,
  amount: 100,
  memo: 'seed creation',
  contributionDate: new Date(2026, 0, 1).toISOString(),
  confirmed: true,
  ...extra,
})

const build = (creations: CreationInterface[], state = newSeedBookingState()) =>
  buildSeedCreationRows(sortCreationsByBalanceDate(creations), refsByEmail, moderator, state)

describe('sortCreationsByBalanceDate', () => {
  it('orders by balance date, whatever the order of the list', () => {
    const dated = sortCreationsByBalanceDate([
      creation('anna@seed.de', { memo: 'now' }),
      creation('anna@seed.de', { memo: 'moved', moveCreationDate: 2 }),
    ])

    expect(dated.map(({ creation }) => creation.memo)).toEqual(['moved', 'now'])
  })
})

describe('buildSeedCreationRows', () => {
  it("builds each booking of a member on the previous one, decayed to the booking's date", () => {
    const rows = build([
      creation('anna@seed.de', { moveCreationDate: 12 }),
      creation('anna@seed.de'),
    ])

    const [first, second] = rows.transactions
    expect(first.previous).toBeNull()
    expect(first.balance).toEqual(GradidoUnit.fromNumber(100))
    expect(second.previous).toBe(first.id)
    const decay = (first.balance as GradidoUnit).calculateDecay(
      first.balanceDate as Date,
      second.balanceDate as Date,
    )
    expect(second.decay).toEqual(decay.decay)
    expect(second.balance).toEqual(decay.balance.add(GradidoUnit.fromNumber(100)))
  })

  it('keeps a chain per member', () => {
    const rows = build([
      creation('anna@seed.de'),
      creation('ben@seed.de'),
      creation('anna@seed.de'),
    ])

    const [annaFirst, benFirst, annaSecond] = rows.transactions
    expect(benFirst.userId).toBe(ben.id)
    expect(benFirst.previous).toBeNull()
    expect(annaSecond.previous).toBe(annaFirst.id)
  })

  it('carries the chain and the ids on into the next batch', () => {
    const state = newSeedBookingState()
    const firstBatch = build([creation('anna@seed.de', { moveCreationDate: 1 })], state)
    const secondBatch = build([creation('anna@seed.de')], state)

    const [first] = firstBatch.transactions
    const [second] = secondBatch.transactions
    expect(second.id).toBe((first.id as number) + 1)
    expect(second.previous).toBe(first.id)
    const decay = (first.balance as GradidoUnit).calculateDecay(
      first.balanceDate as Date,
      second.balanceDate as Date,
    )
    expect(second.balance).toEqual(decay.balance.add(GradidoUnit.fromNumber(100)))
  })

  it('confirms a creation with the moderator and links its booking', () => {
    const rows = build([creation('anna@seed.de')])

    const [contribution] = rows.contributions
    const [transaction] = rows.transactions
    expect(contribution.status).toBe(ContributionStatus.CONFIRMED)
    expect(contribution.confirmedBy).toBe(moderator.id)
    expect(contribution.transactionId).toBe(transaction.id)
    expect(transaction.userId).toBe(anna.id)
    expect(transaction.userName).toBe(anna.name)
    expect(transaction.linkedUserId).toBe(moderator.id)
    expect(transaction.linkedUserName).toBe(moderator.name)
    expect(transaction.creationDate).toEqual(contribution.contributionDate)
  })

  it('books nothing for a creation that is not confirmed', () => {
    const state = newSeedBookingState()
    const rows = build([creation('anna@seed.de', { confirmed: false })], state)

    expect(rows.contributions).toHaveLength(1)
    expect(rows.contributions[0].status).toBe(ContributionStatus.PENDING)
    expect(rows.contributions[0].transactionId).toBeUndefined()
    expect(rows.transactions).toHaveLength(0)
    expect(state.nextTransactionId).toBe(1)
  })

  it('throws for an address no seed user has', () => {
    expect(() => build([creation('nobody@seed.de')])).toThrow('nobody@seed.de')
  })
})
