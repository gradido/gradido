import { Transaction } from '@entity/Transaction'

import { GradidoDeferredTransfer } from '@/data/proto/3_3/GradidoDeferredTransfer'

import { TransferTransactionRole } from './TransferTransaction.role'

export class DeferredTransferTransactionRole extends TransferTransactionRole {
  public constructor(
    transaction: Transaction,
    private deferredTransferTransaction: GradidoDeferredTransfer,
  ) {
    super(transaction, deferredTransferTransaction.transfer)
  }
}
