/* eslint-disable @typescript-eslint/no-unused-vars */
import Decimal from 'decimal.js-light'
import { SaveOptions, RemoveOptions } from '@dbTools/typeorm'
import { Transaction as dbTransaction } from '@entity/Transaction'
import { calculateDecay } from './decay'
import { TransactionTypeId } from '../graphql/enum/TransactionTypeId'
import { Transaction } from '../graphql/model/Transaction'
import { User } from '../graphql/model/User'

const virtualDecayTransaction = (
  balance: Decimal,
  balanceDate: Date,
  time: Date = new Date(),
  user: User,
): Transaction => {
  const decay = calculateDecay(balance, balanceDate, time)
  // const balance = decay.balance.minus(lastTransaction.balance)
  const decayDbTransaction: dbTransaction = {
    id: -1,
    userId: -1,
    previous: -1,
    typeId: TransactionTypeId.DECAY,
    amount: new Decimal(0),
    balance: decay.balance,
    balanceDate: time,
    decay: decay.decay ? decay.decay : new Decimal(0),
    decayStart: decay.start,
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
  return new Transaction(decayDbTransaction, user)
}

export { virtualDecayTransaction }
