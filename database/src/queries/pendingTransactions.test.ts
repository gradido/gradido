import {
  PendingTransaction as DbPendingTransaction,
  User as DbUser,
  UserContact as DbUserContact,
  Community as DbCommunity,
} from '..'
import { countOpenPendingTransactions } from './pendingTransactions'
import { PendingTransactionState } from 'shared'
import { AppDatabase } from '../AppDatabase'
import { userFactory } from '../seeds/factory/user'
import { pendingTransactionFactory } from '../seeds/factory/pendingTransaction'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { peterLustig } from '../seeds/users/peter-lustig'
import { bobBaumeister } from '../seeds/users/bob-baumeister'
import { garrickOllivander } from '../seeds/users/garrick-ollivander'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { createCommunity } from '../seeds/community'
import { v4 as uuidv4 } from 'uuid'
import Decimal from 'decimal.js-light'

const db = AppDatabase.getInstance()

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})


describe('countOpenPendingTransactions', () => {
  let bibi: DbUser
  let peter: DbUser
  let bob: DbUser
  let garrick: DbUser
  beforeAll(async () => {
    await DbPendingTransaction.clear()
    await DbUser.clear()
    await DbUserContact.clear()
    await DbCommunity.clear()

    await createCommunity(false)

    bibi = await userFactory(bibiBloxberg)  
    peter = await userFactory(peterLustig)
    bob = await userFactory(bobBaumeister)
    garrick = await userFactory(garrickOllivander)

    // Bibi -> Peter
    await pendingTransactionFactory(
      bibi, 
      peter, 
      new Decimal(10), 
      'Bibi -> Peter new', 
      PendingTransactionState.NEW
    )
    await pendingTransactionFactory(
      bibi, 
      peter, 
      new Decimal(100.01), 
      'Bibi -> Peter settled', 
      PendingTransactionState.SETTLED
    )

    // Peter -> Bibi
    await pendingTransactionFactory(
      peter, 
      bibi, 
      new Decimal(12), 
      'Peter -> Bibi new', 
      PendingTransactionState.NEW
    )

    // Bob -> Peter
    await pendingTransactionFactory(
      bob, 
      peter, 
      new Decimal(17.1), 
      'Bob -> Peter new', 
      PendingTransactionState.NEW
    )

  })
  it('should return 0 if called with empty array', async () => {
    const count = await countOpenPendingTransactions([])
    expect(count).toBe(0)
  })

  it('should return 0 if called with unknown gradido id', async () => {
    const count = await countOpenPendingTransactions([uuidv4()])
    expect(count).toBe(0)
  })

  it('should return 0 if there are no pending transactions for the given user', async () => {
    const count = await countOpenPendingTransactions([garrick.gradidoID])
    expect(count).toBe(0)
  })

  it('bibi and peter have two transactions together and peter one additional, should return 3', async () => {
    const count = await countOpenPendingTransactions([bibi.gradidoID, peter.gradidoID])
    expect(count).toBe(3)
  })

  it('peter and bob have one transaction together, peter two additional, should return 3', async () => {
    const count = await countOpenPendingTransactions([peter.gradidoID, bob.gradidoID])
    expect(count).toBe(3)
  }) 
  
  it('peter has three transactions, should return 3', async () => {
    const count = await countOpenPendingTransactions([peter.gradidoID])
    expect(count).toBe(3)
  })


  it('bibi has two transactions, should return 2', async () => {
    const count = await countOpenPendingTransactions([bibi.gradidoID])
    expect(count).toBe(2)
  }) 

  it('bob has one transaction, should return 1', async () => {
    const count = await countOpenPendingTransactions([bob.gradidoID])
    expect(count).toBe(1)
  }) 
})
