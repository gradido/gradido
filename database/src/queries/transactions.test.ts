// AI-GENERATED — not an architecture reference
import { GradidoUnit } from 'shared'
import { clearDatabase } from '../../migration/clear'
import { Transaction as DbTransaction, User as DbUser, TransactionTypeId } from '..'
import { AppDatabase } from '../AppDatabase'
import { createCommunity } from '../seeds/community'
import { creationFactory, nMonthsBefore } from '../seeds/factory/creation'
import { transferGradidos } from '../seeds/factory/transaction'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { bobBaumeister } from '../seeds/users/bob-baumeister'
import { peterLustig } from '../seeds/users/peter-lustig'
import { dbSelectContactsByUserId } from './transactions'

const appDB = AppDatabase.getInstance()

let bibi: DbUser
let peter: DbUser
let bob: DbUser

const FOREIGN_COMMUNITY = '99999999-9999-9999-9999-999999999999'
const SARAH = 'dddddddd-dddd-dddd-dddd-dddddddddddd'

const day = (n: number): Date => new Date(Date.UTC(2026, 7, n, 12, 0, 0))

/**
 * A booking with somebody from another community, the way the federation writes it:
 * no local user id, the uuid pair and the name as it arrived. Written directly, because
 * the transfer factory only knows local members.
 */
const foreignReceive = async (
  user: DbUser,
  name: string,
  balanceDate: Date,
): Promise<DbTransaction> => {
  const tx = new DbTransaction()
  tx.typeId = TransactionTypeId.RECEIVE
  tx.memo = 'from afar'
  tx.userId = user.id
  tx.userGradidoID = user.gradidoID
  tx.userCommunityUuid = user.communityUuid
  tx.linkedUserId = null
  tx.linkedUserCommunityUuid = FOREIGN_COMMUNITY
  tx.linkedUserGradidoID = SARAH
  tx.linkedUserName = name
  tx.amount = new GradidoUnit(10000n)
  tx.balance = new GradidoUnit(10000n)
  tx.decay = new GradidoUnit(0n)
  tx.balanceDate = balanceDate
  return tx.save()
}

beforeAll(async () => {
  await appDB.init()
  await clearDatabase()
  await createCommunity(false)
  bibi = await userFactory(bibiBloxberg)
  peter = await userFactory(peterLustig)
  bob = await userFactory(bobBaumeister)

  // A creation for bibi: booked with nobody, must never become a contact.
  await creationFactory(
    {
      email: 'bibi@bloxberg.de',
      amount: 1000,
      memo: 'Herzlich Willkommen bei Gradido!',
      contributionDate: nMonthsBefore(new Date()),
      confirmed: true,
      moveCreationDate: 12,
    },
    bibi,
    peter,
  )
  // Three bookings with peter, two with bob, in a deliberate order of dates.
  await transferGradidos(bibi, peter, new GradidoUnit(100000n), 'one', day(1))
  await transferGradidos(bibi, bob, new GradidoUnit(50000n), 'two', day(2))
  await transferGradidos(peter, bibi, new GradidoUnit(20000n), 'three', day(3))
  await transferGradidos(bibi, peter, new GradidoUnit(30000n), 'four', day(4))
  await transferGradidos(bob, bibi, new GradidoUnit(10000n), 'five', day(5))
  // Two bookings from one foreign member, who renamed herself in between.
  await foreignReceive(bibi, 'Sarah', day(6))
  await foreignReceive(bibi, 'SarahP', day(7))
})

afterAll(async () => {
  await clearDatabase()
  await appDB.destroy()
})

describe('dbSelectContactsByUserId', () => {
  it('lists every counterparty once, newest contact first, with dates and counts', async () => {
    const page = await dbSelectContactsByUserId(bibi.id, { limit: 25, offset: 0 })
    expect(page.count).toBe(3)
    expect(page.contacts.map((c) => c.gradidoId)).toEqual([SARAH, bob.gradidoID, peter.gradidoID])

    const [sarah, bobRow, peterRow] = page.contacts
    expect(peterRow).toMatchObject({ linkedUserId: peter.id, alias: peter.alias, bookings: 3 })
    expect(peterRow.firstAt.getTime()).toBe(day(1).getTime())
    expect(peterRow.lastAt.getTime()).toBe(day(4).getTime())
    expect(bobRow).toMatchObject({ linkedUserId: bob.id, bookings: 2 })
    expect(bobRow.lastAt.getTime()).toBe(day(5).getTime())
    // The foreign member: no local id, the pair off the booking, the NEWEST name.
    expect(sarah).toMatchObject({
      linkedUserId: null,
      communityUuid: FOREIGN_COMMUNITY,
      alias: 'SarahP',
      bookings: 2,
    })
  })

  it('does not count the creation as a contact', async () => {
    const page = await dbSelectContactsByUserId(bibi.id, { limit: 25, offset: 0 })
    expect(page.contacts.some((c) => c.bookings > 3)).toBe(false)
    expect(page.count).toBe(3)
  })

  it('shows the other side the same booking, from their view', async () => {
    const page = await dbSelectContactsByUserId(bob.id, { limit: 25, offset: 0 })
    expect(page.count).toBe(1)
    expect(page.contacts[0]).toMatchObject({ linkedUserId: bibi.id, bookings: 2 })
  })

  it('pages without repeating or dropping anybody', async () => {
    const first = await dbSelectContactsByUserId(bibi.id, { limit: 2, offset: 0 })
    const second = await dbSelectContactsByUserId(bibi.id, { limit: 2, offset: 2 })
    expect(first.count).toBe(3)
    expect(first.contacts).toHaveLength(2)
    expect(second.contacts).toHaveLength(1)
    const all = [...first.contacts, ...second.contacts].map((c) => c.gradidoId)
    expect(new Set(all).size).toBe(3)
  })

  it('searches the alias, case-insensitively, and counts only what matches', async () => {
    const page = await dbSelectContactsByUserId(bibi.id, {
      search: 'sarah',
      limit: 25,
      offset: 0,
    })
    expect(page.count).toBe(1)
    expect(page.contacts[0].gradidoId).toBe(SARAH)
    const nobody = await dbSelectContactsByUserId(bibi.id, { search: 'zzz', limit: 25, offset: 0 })
    expect(nobody.count).toBe(0)
    expect(nobody.contacts).toEqual([])
  })

  it('answers an empty list for a member without any booking', async () => {
    const page = await dbSelectContactsByUserId(999999, { limit: 25, offset: 0 })
    expect(page).toEqual({ contacts: [], count: 0 })
  })
})
