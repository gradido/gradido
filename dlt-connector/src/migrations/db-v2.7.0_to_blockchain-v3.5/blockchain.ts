import {
  AccountBalances,
  Filter,
  GradidoTransactionBuilder,
  HieroAccountId,
  InMemoryBlockchain,
  LedgerAnchor,
} from 'gradido-blockchain-js'
import { NotEnoughGradidoBalanceError } from './errors'

export const defaultHieroAccount = new HieroAccountId(0, 0, 2)

export function addToBlockchain(
  builder: GradidoTransactionBuilder,
  blockchain: InMemoryBlockchain,
  ledgerAnchor: LedgerAnchor,
  accountBalances: AccountBalances,
): boolean {
  const transaction = builder.build()
  try {    
    const result = blockchain.createAndAddConfirmedTransactionExtern(
      transaction,
      ledgerAnchor,
      accountBalances,
    )
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
    const lastTransaction = blockchain.findOne(Filter.LAST_TRANSACTION)
    throw new Error(`Transaction ${transaction.toJson(true)} not added: ${error}, last transaction was: ${lastTransaction?.getConfirmedTransaction()?.toJson(true)}`)
  }
}

