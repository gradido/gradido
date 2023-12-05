import { Transaction } from '@entity/Transaction'

import { LogError } from '@/server/LogError'

export abstract class AbstractTransactionRole {
  // eslint-disable-next-line no-useless-constructor
  constructor(protected self: Transaction) {}

  public validate(): void {
    if (!this.self.iotaMessageId || this.self.iotaMessageId.length !== 32) {
      throw new LogError('missing or invalid iota message id')
    }
    if (!this.self.signingAccountId || this.self.signingAccountId === 0) {
      throw new LogError('missing singing account')
    }
    if (!this.self.senderCommunityId || this.self.senderCommunityId === 0) {
      throw new LogError('missing sender community id')
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
    return this.self.iotaMessageId.toString('hex')
  }

  public getTransaction(): Transaction {
    return this.self
  }
}
