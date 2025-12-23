import { AccountBalances } from 'gradido-blockchain-js'
import * as v from 'valibot'
import { InputTransactionType } from '../../../../data/InputTransactionType.enum'
import { Transaction } from '../../../../schemas/transaction.schema'
import { Context } from '../../Context'
import { TransactionDb, TransactionLinkDb, transactionDbSchema, transactionLinkDbSchema } from '../../valibot.schema'
import { AbstractBalancesRole } from './AbstractBalances.role'
import { CreationBalancesRole } from './CreationBalances.role'
import { DeferredTransferBalancesRole } from './DeferredTransferBalances.role'
import { RedeemDeferredTransferBalancesRole } from './RedeemDeferredTransferBalances.role'
import { RegisterAddressBalancesRole } from './RegisterAddressBalances.role'
import { TransferBalancesRole } from './TransferBalances.role'

export async function accountBalancesContext(transaction: Transaction, item: TransactionDb | TransactionLinkDb, context: Context): Promise<AccountBalances> {
  let role: AbstractBalancesRole | null = null
  if (InputTransactionType.GRADIDO_CREATION === transaction.type) {
    role = new CreationBalancesRole(transaction, v.parse(transactionDbSchema, item))
  } else if (InputTransactionType.GRADIDO_TRANSFER === transaction.type) {
    role = new TransferBalancesRole(transaction, v.parse(transactionDbSchema, item))
  } else if (InputTransactionType.GRADIDO_DEFERRED_TRANSFER === transaction.type) {
    role = new DeferredTransferBalancesRole(transaction, v.parse(transactionLinkDbSchema, item))
  } else if (InputTransactionType.GRADIDO_REDEEM_DEFERRED_TRANSFER === transaction.type) {
    role = new RedeemDeferredTransferBalancesRole(transaction, v.parse(transactionDbSchema, item))
  } else if (InputTransactionType.REGISTER_ADDRESS === transaction.type) {
    role = new RegisterAddressBalancesRole(transaction)
  }
  if (!role) {
    throw new Error(`No role found for transaction type ${transaction.type}`)
  }
  return await role.getAccountBalances(context)
}

