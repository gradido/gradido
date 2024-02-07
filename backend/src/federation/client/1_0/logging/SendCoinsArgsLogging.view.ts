import { AbstractLoggingView } from '@logging/AbstractLogging.view'

import { SendCoinsArgs } from '@/federation/client/1_0/model/SendCoinsArgs'

export class SendCoinsArgsLoggingView extends AbstractLoggingView {
  public constructor(private self: SendCoinsArgs) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      recipientCommunityUuid: this.self.recipientCommunityUuid,
      recipientUserIdentifier: this.self.recipientUserIdentifier,
      creationDate: this.self.creationDate,
      amount: this.decimalToString(this.self.amount),
      memoLength: this.self.memo.length,
      senderCommunityUuid: this.self.senderCommunityUuid,
      senderUserUuid: this.self.senderUserUuid,
      senderUserName: this.self.senderUserName.substring(0, 3),
      senderAlias: this.self.senderAlias?.substring(0, 3),
    }
  }
}
