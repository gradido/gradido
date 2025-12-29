import {
  AccountBalances,
  Filter,
  GradidoTransactionBuilder,
  HieroAccountId,
  InMemoryBlockchain,
} from 'gradido-blockchain-js'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import { CommunityRootTransactionRole } from '../../interactions/sendToHiero/CommunityRootTransaction.role'
import { Community } from '../../schemas/transaction.schema'
import { NotEnoughGradidoBalanceError } from './errors'

const logger = getLogger(
  `${LOG4JS_BASE_CATEGORY}.migrations.db-v2.7.0_to_blockchain-v3.6.blockchain`,
)
export const defaultHieroAccount = new HieroAccountId(0, 0, 2)

export function addToBlockchain(
  builder: GradidoTransactionBuilder,
  blockchain: InMemoryBlockchain,
  transactionId: number,
  accountBalances: AccountBalances,
): boolean {
  const transaction = builder.build()
  try {    
    const result = blockchain.createAndAddConfirmedTransactionExtern(
      transaction,
      transactionId,
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

export async function addCommunityRootTransaction(
  blockchain: InMemoryBlockchain,
  community: Community,
  accountBalances: AccountBalances
): Promise<void> {
  const communityRootTransactionRole = new CommunityRootTransactionRole(community)
  if (
    addToBlockchain(
      await communityRootTransactionRole.getGradidoTransactionBuilder(),
      blockchain,
      0,
      accountBalances,
    )
  ) {
    logger.info(`Community Root Transaction added`)
  } else {
    throw new Error(`Community Root Transaction not added`)
  }
}

