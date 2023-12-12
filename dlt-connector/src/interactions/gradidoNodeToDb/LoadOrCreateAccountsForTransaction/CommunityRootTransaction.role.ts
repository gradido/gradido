import { Transaction } from '@entity/Transaction'

import { CommunityRoot } from '@/data/proto/3_3/CommunityRoot'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class CommunityRootTransactionRole extends AbstractTransactionRole {
  public constructor(transaction: Transaction, private communityRoot: CommunityRoot) {
    super(transaction)
  }

  public getAccountPublicKeys(): Buffer[] {
    return []
  }
}
