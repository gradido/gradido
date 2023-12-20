import { Transaction } from '@entity/Transaction'

import { TransactionType } from '@/data/proto/3_3/enum/TransactionType'
import { logger } from '@/logging/logger'
import { TransactionLoggingView } from '@/logging/TransactionLogging.view'
import { LogError } from '@/server/LogError'

export abstract class AbstractTransactionRole {
  // eslint-disable-next-line no-useless-constructor
  constructor(protected self: Transaction) {}

  public validate(): void {
    logger.debug('validate transaction', new TransactionLoggingView(this.getTransaction()))
    if (!this.self.iotaMessageId || this.self.iotaMessageId.length !== 32) {
      throw new LogError('missing or invalid iota message id')
    }
    // community root hasn't signing account, because it is his self signing account
    if (
      this.self.type !== TransactionType.COMMUNITY_ROOT &&
      (!this.self.signingAccountId || this.self.signingAccountId === 0) &&
      !this.self.signingAccount
    ) {
      throw new LogError('missing singing account')
    }
    if (
      [TransactionType.GRADIDO_CREATION, TransactionType.GRADIDO_TRANSFER].includes(
        this.self.type,
      ) &&
      (!this.self.recipientAccountId || this.self.recipientAccountId === 0) &&
      !this.self.recipientAccount
    ) {
      throw new LogError('missing recipient account')
    }
    if (!this.self.communityId || this.self.communityId === 0) {
      throw new LogError('missing community id')
    }
  }

  public abstract isConfirmed(): boolean

  public hasIotaMessageId(): boolean {
    return this.self.iotaMessageId?.length === 32
  }

  public getIotaMessageIdHex(): string {
    if (!this.self.iotaMessageId || !this.hasIotaMessageId()) {
      throw new LogError('missing iota message id')
    }
    return Buffer.from(this.self.iotaMessageId).toString('hex')
  }

  public getTransaction(): Transaction {
    return this.self
  }

  public sortByNr(other: AbstractTransactionRole): number {
    if (!this.self.nr || !other.self.nr) {
      throw new LogError('missing nr for sorting')
    }
    return this.self.nr - other.self.nr
  }
}
