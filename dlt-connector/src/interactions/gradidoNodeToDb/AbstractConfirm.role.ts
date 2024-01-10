import { ConfirmedTransactionRole } from './ConfirmedTransaction.role'
import { ConfirmTransactionsContext } from './ConfirmTransactions.context'

export abstract class AbstractConfirm {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    protected confirmedTransactionRole: ConfirmedTransactionRole,
    protected confirmTransactionsContext: ConfirmTransactionsContext,
  ) {}

  public abstract confirm(): Promise<void>
}
