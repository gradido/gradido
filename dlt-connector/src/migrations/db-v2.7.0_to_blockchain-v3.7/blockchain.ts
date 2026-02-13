import {
  AccountBalances,
  Filter,
  GradidoTransaction,
  HieroAccountId,
  InMemoryBlockchain,
  InMemoryBlockchainProvider,
  LedgerAnchor,
  Profiler,
  TransactionEntry,
} from 'gradido-blockchain-js'
import { NotEnoughGradidoBalanceError } from './errors'

export const defaultHieroAccount = new HieroAccountId(0, 0, 2)
export let callTime: number = 0
const timeUsed = new Profiler

export function addToBlockchain(
  transaction: GradidoTransaction,
  blockchain: InMemoryBlockchain,
  ledgerAnchor: LedgerAnchor,
  accountBalances: AccountBalances,
): boolean {
  
  try {    
    timeUsed.reset()
    const result = blockchain.createAndAddConfirmedTransactionExtern(
      transaction,
      ledgerAnchor,
      accountBalances,
    )
    callTime += timeUsed.nanos()
    return result
  } catch (error) {
    if (error instanceof Error) {
      const matches = error.message.match(/not enough Gradido Balance for (send coins|operation), needed: -?(\d+\.\d+), exist: (\d+\.\d+)/)
      if (matches) {
        const needed = parseFloat(matches[2])
        const exist = parseFloat(matches[3])
        throw new NotEnoughGradidoBalanceError(needed, exist)
      }
    }
    // const wekingheim = InMemoryBlockchainProvider.getInstance().getBlockchain('wekingheim')
    // const lastTransactionw = wekingheim?.findOne(Filter.LAST_TRANSACTION)

    const lastTransaction = blockchain.findOne(Filter.LAST_TRANSACTION)    
    throw new Error(`Transaction ${transaction.toJson(true)} not added: ${error}, last transaction was: ${lastTransaction?.getConfirmedTransaction()?.toJson(true)}`)
  }
}

