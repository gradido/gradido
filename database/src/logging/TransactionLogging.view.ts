import { Transaction } from '../entity'
import { AbstractLoggingView } from './AbstractLogging.view'
import { ContributionLoggingView } from './ContributionLogging.view'
import { DltTransactionLoggingView } from './DltTransactionLogging.view'
import { TransactionLinkLoggingView } from './TransactionLinkLogging.view'

// TODO: move enum into database, maybe rename database
enum TransactionTypeId {
  CREATION = 1,
  SEND = 2,
  RECEIVE = 3,
  // This is a virtual property, never occurring on the database
  DECAY = 4,
  LINK_SUMMARY = 5,
}

export class TransactionLoggingView extends AbstractLoggingView {
  public constructor(private self: Transaction) {
    super()
  }

  public toJSON(): any {
    return {
      id: this.self.id,
      previous: this.self.previous,
      typeId: TransactionTypeId[this.self.typeId],
      transactionLinkId: this.self.transactionLinkId,
      amount: this.decimalToString(this.self.amount),
      balance: this.decimalToString(this.self.balance),
      balanceDate: this.dateToString(this.self.balanceDate),
      decay: this.decimalToString(this.self.decay),
      decayStart: this.dateToString(this.self.decayStart),
      memoLength: this.self.memo.length,
      creationDate: this.dateToString(this.self.creationDate),
      userId: this.self.userId,
      userCommunityUuid: this.self.userCommunityUuid,
      userGradidoId: this.self.userGradidoID,
      userName: this.self.userName?.substring(0, 3) + '...',
      linkedUserId: this.self.linkedUserId,
      linkedUserCommunityUuid: this.self.linkedUserCommunityUuid,
      linkedUserGradidoID: this.self.linkedUserGradidoID,
      linkedUserName: this.self.linkedUserName?.substring(0, 3) + '...',
      linkedTransactionId: this.self.linkedTransactionId,
      contribution: this.self.contribution
        ? new ContributionLoggingView(this.self.contribution).toJSON()
        : undefined,
      dltTransaction: this.self.dltTransaction
        ? new DltTransactionLoggingView(this.self.dltTransaction).toJSON()
        : undefined,
      previousTransaction: this.self.previousTransaction
        ? new TransactionLoggingView(this.self.previousTransaction).toJSON()
        : undefined,
      transactionLink: this.self.transactionLink
        ? new TransactionLinkLoggingView(this.self.transactionLink).toJSON()
        : undefined,
    }
  }
}
