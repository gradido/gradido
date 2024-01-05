import { CrossGroupType } from '@/data/proto/3_3/enum/CrossGroupType'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class CreationTransactionRole extends AbstractTransactionRole {
  public getSigningUser(): UserIdentifier {
    return this.self.linkedUser
  }

  public getRecipientUser(): UserIdentifier {
    return this.self.user
  }

  public getCrossGroupType(): CrossGroupType {
    return CrossGroupType.LOCAL
  }
}
