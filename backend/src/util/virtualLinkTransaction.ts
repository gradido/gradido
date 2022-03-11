/* eslint-disable @typescript-eslint/no-unused-vars */
import { Transaction } from '@model/Transaction'
import { SaveOptions, RemoveOptions } from '@dbTools/typeorm'
import { Transaction as dbTransaction } from '@entity/Transaction'
import { TransactionTypeId } from '@enum/TransactionTypeId'
import { User } from '@model/User'
import Decimal from 'decimal.js-light'

const virtualLinkTransaction = (
  balance: Decimal,
  amount: Decimal,
  holdAvailableAmount: Decimal,
  decay: Decimal,
  createdAt: Date,
  validUntil: Date,
  user: User,
): Transaction => {
  const linkDbTransaction: dbTransaction = {
    id: -2,
    userId: -1,
    previous: -1,
    typeId: TransactionTypeId.TRANSACTION_LINK,
    amount: amount,
    balance: balance,
    balanceDate: validUntil,
    decayStart: createdAt,
    decay: decay,
    memo: '',
    creationDate: null,
    hasId: function (): boolean {
      throw new Error('Function not implemented.')
    },
    save: function (options?: SaveOptions): Promise<dbTransaction> {
      throw new Error('Function not implemented.')
    },
    remove: function (options?: RemoveOptions): Promise<dbTransaction> {
      throw new Error('Function not implemented.')
    },
    softRemove: function (options?: SaveOptions): Promise<dbTransaction> {
      throw new Error('Function not implemented.')
    },
    recover: function (options?: SaveOptions): Promise<dbTransaction> {
      throw new Error('Function not implemented.')
    },
    reload: function (): Promise<void> {
      throw new Error('Function not implemented.')
    },
  }
  return new Transaction(linkDbTransaction, user)
}

export { virtualLinkTransaction }
