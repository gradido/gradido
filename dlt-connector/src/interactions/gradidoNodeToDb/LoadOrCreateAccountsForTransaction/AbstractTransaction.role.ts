import { Transaction } from '@entity/Transaction'

export abstract class AbstractTransactionRole {
  // eslint-disable-next-line no-useless-constructor
  public constructor(protected self: Transaction) {}
  public abstract getAccountPublicKeys(): Buffer[]
}
