import { CrossGroupType } from '@/data/proto/3_3/enum/CrossGroupType'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class ReceiveTransactionRole extends AbstractTransactionRole {
  public getSigningUser(): UserIdentifier {
    return this.self.linkedUser
  }

  public getRecipientUser(): UserIdentifier {
    return this.self.user
  }

  public getCrossGroupType(): CrossGroupType {
    if (this.isCrossGroupTransaction()) {
      return CrossGroupType.INBOUND
    }
    return CrossGroupType.LOCAL
  }
}
