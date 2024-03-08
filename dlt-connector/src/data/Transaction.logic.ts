import { Transaction } from '@entity/Transaction'
import { Not } from 'typeorm'

import { logger } from '@/logging/logger'
import { TransactionBodyLoggingView } from '@/logging/TransactionBodyLogging.view'
import { TransactionLoggingView } from '@/logging/TransactionLogging.view'
import { LogError } from '@/server/LogError'

import { CrossGroupType } from './proto/3_3/enum/CrossGroupType'
import { TransactionType } from './proto/3_3/enum/TransactionType'
import { TransactionBody } from './proto/3_3/TransactionBody'

export class TransactionLogic {
  protected transactionBody: TransactionBody | undefined

  // eslint-disable-next-line no-useless-constructor
  public constructor(private self: Transaction) {}

  /**
   * search for transaction pair for Cross Group Transaction
   * @returns
   */
  public async findPairTransaction(): Promise<Transaction> {
    const type = this.getBody().type
    if (type === CrossGroupType.LOCAL) {
      throw new LogError("local transaction don't has a pairing transaction")
    }

    // check if already was loaded from db
    if (this.self.pairingTransaction) {
      return this.self.pairingTransaction
    }

    if (this.self.pairingTransaction) {
      const pairingTransaction = await Transaction.findOneBy({ id: this.self.pairingTransaction })
      if (pairingTransaction) {
        return pairingTransaction
      }
    }
    // check if we find some in db
    const sameCreationDateTransactions = await Transaction.findBy({
      createdAt: this.self.createdAt,
      id: Not(this.self.id),
    })
    if (
      sameCreationDateTransactions.length === 1 &&
      this.isBelongTogether(sameCreationDateTransactions[0])
    ) {
      return sameCreationDateTransactions[0]
    }
    // this approach only work if all entities get ids really incremented by one
    if (type === CrossGroupType.OUTBOUND) {
      const prevTransaction = await Transaction.findOneBy({ id: this.self.id - 1 })
      if (prevTransaction && this.isBelongTogether(prevTransaction)) {
        return prevTransaction
      }
    } else if (type === CrossGroupType.INBOUND) {
      const nextTransaction = await Transaction.findOneBy({ id: this.self.id + 1 })
      if (nextTransaction && this.isBelongTogether(nextTransaction)) {
        return nextTransaction
      }
    }
    throw new LogError("couldn't find valid pairing transaction", {
      id: this.self.id,
      type: CrossGroupType[type],
      transactionCountWithSameCreatedAt: sameCreationDateTransactions.length,
    })
  }

  /**
   * check if two transactions belong together
   * are they pairs for a cross group transaction
   * @param otherTransaction
   */
  public isBelongTogether(otherTransaction: Transaction): boolean {
    if (this.self.id === otherTransaction.id) {
      logger.info('id is the same, it is the same transaction!')
      return false
    }

    if (
      this.self.signingAccountId !== otherTransaction.signingAccountId ||
      this.self.recipientAccountId !== otherTransaction.recipientAccountId ||
      this.self.communityId !== otherTransaction.otherCommunityId ||
      this.self.otherCommunityId !== otherTransaction.communityId ||
      this.self.createdAt.getTime() !== otherTransaction.createdAt.getTime()
    ) {
      logger.info('transaction a and b are not pairs', {
        a: new TransactionLoggingView(this.self).toJSON(),
        b: new TransactionLoggingView(otherTransaction).toJSON(),
      })
      return false
    }
    const body = this.getBody()
    const otherBody = TransactionBody.fromBodyBytes(otherTransaction.bodyBytes)
    /**
     * both must be Cross or
     * one can be OUTBOUND and one can be INBOUND
     * no one can be LOCAL
     */

    if (!this.validCrossGroupTypes(body.type, otherBody.type)) {
      logger.info("cross group types don't match", {
        a: new TransactionBodyLoggingView(body).toJSON(),
        b: new TransactionBodyLoggingView(otherBody).toJSON(),
      })
      return false
    }
    const type = body.getTransactionType()
    const otherType = otherBody.getTransactionType()
    if (!type || !otherType) {
      throw new LogError("couldn't determine transaction type", {
        a: new TransactionBodyLoggingView(body).toJSON(),
        b: new TransactionBodyLoggingView(otherBody).toJSON(),
      })
    }
    if (type !== otherType) {
      logger.info("transaction types don't match", {
        a: new TransactionBodyLoggingView(body).toJSON(),
        b: new TransactionBodyLoggingView(otherBody).toJSON(),
      })
      return false
    }
    if (
      [
        TransactionType.COMMUNITY_ROOT,
        TransactionType.GRADIDO_CREATION,
        TransactionType.GRADIDO_DEFERRED_TRANSFER,
      ].includes(type)
    ) {
      logger.info(`TransactionType ${TransactionType[type]} couldn't be a CrossGroup Transaction`)
      return false
    }
    if (
      [
        TransactionType.GRADIDO_CREATION,
        TransactionType.GRADIDO_TRANSFER,
        TransactionType.GRADIDO_DEFERRED_TRANSFER,
      ].includes(type)
    ) {
      if (!this.self.amount || !otherTransaction.amount) {
        logger.info('missing amount')
        return false
      }
      if (this.self.amount.cmp(otherTransaction.amount.toString())) {
        logger.info('amounts mismatch', {
          a: this.self.amount.toString(),
          b: otherTransaction.amount.toString(),
        })
        return false
      }
    }
    if (body.otherGroup === otherBody.otherGroup) {
      logger.info('otherGroups are the same', {
        a: new TransactionBodyLoggingView(body).toJSON(),
        b: new TransactionBodyLoggingView(otherBody).toJSON(),
      })
      return false
    }
    if (body.memo !== otherBody.memo) {
      logger.info('memo differ', {
        a: new TransactionBodyLoggingView(body).toJSON(),
        b: new TransactionBodyLoggingView(otherBody).toJSON(),
      })
      return false
    }
    return true
  }

  /**
   * both must be CROSS or
   * one can be OUTBOUND and one can be INBOUND
   * no one can be LOCAL
   * @return true if crossGroupTypes are valid
   */
  protected validCrossGroupTypes(a: CrossGroupType, b: CrossGroupType): boolean {
    logger.debug('compare ', {
      a: CrossGroupType[a],
      b: CrossGroupType[b],
    })
    if (a === CrossGroupType.LOCAL || b === CrossGroupType.LOCAL) {
      logger.info('no one can be LOCAL')
      return false
    }
    if (
      (a === CrossGroupType.INBOUND && b === CrossGroupType.OUTBOUND) ||
      (a === CrossGroupType.OUTBOUND && b === CrossGroupType.INBOUND)
    ) {
      return true // One can be INBOUND and one can be OUTBOUND
    }
    return a === CrossGroupType.CROSS && b === CrossGroupType.CROSS
  }

  public getBody(): TransactionBody {
    if (!this.transactionBody) {
      this.transactionBody = TransactionBody.fromBodyBytes(this.self.bodyBytes)
    }
    return this.transactionBody
  }
}
