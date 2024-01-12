import { CrossGroupType } from '@/data/proto/3_3/enum/CrossGroupType'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class SendTransactionRole extends AbstractTransactionRole {
  public getSigningUser(): UserIdentifier {
    return this.self.user
  }

  public getRecipientUser(): UserIdentifier {
    return this.self.linkedUser
  }

  public getCrossGroupType(): CrossGroupType {
    if (this.isCrossGroupTransaction()) {
      return CrossGroupType.OUTBOUND
    }
    return CrossGroupType.LOCAL
  }
}
