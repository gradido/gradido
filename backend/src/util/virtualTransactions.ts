/* eslint-disable @typescript-eslint/no-unused-vars */
import { Transaction } from '@model/Transaction'
import { SaveOptions, RemoveOptions } from '@dbTools/typeorm'
import { Transaction as dbTransaction } from '@entity/Transaction'
import { TransactionTypeId } from '@enum/TransactionTypeId'
import { calculateDecay } from './decay'
import { User } from '@model/User'
import Decimal from 'decimal.js-light'

const defaultModelFunctions = {
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
    typeId: TransactionTypeId.LINK_SUMMARY,
    amount: amount.toDecimalPlaces(2, Decimal.ROUND_FLOOR),
    balance: balance.toDecimalPlaces(2, Decimal.ROUND_DOWN),
    balanceDate: validUntil,
    decayStart: createdAt,
    decay: decay.toDecimalPlaces(2, Decimal.ROUND_FLOOR),
    memo: '',
    creationDate: null,
    contribution: null,
    ...defaultModelFunctions,
  }
  return new Transaction(linkDbTransaction, user)
}

const virtualDecayTransaction = (
  balance: Decimal,
  balanceDate: Date,
  time: Date = new Date(),
  user: User,
  holdAvailabeAmount: Decimal,
): Transaction => {
  const decay = calculateDecay(balance, balanceDate, time)
  // const balance = decay.balance.minus(lastTransaction.balance)
  const decayDbTransaction: dbTransaction = {
    id: -1,
    userId: -1,
    previous: -1,
    typeId: TransactionTypeId.DECAY,
    amount: decay.decay ? decay.roundedDecay : new Decimal(0),
    balance: decay.balance
      .toDecimalPlaces(2, Decimal.ROUND_DOWN)
      .minus(holdAvailabeAmount.toString())
      .toDecimalPlaces(2, Decimal.ROUND_DOWN),
    balanceDate: time,
    decay: decay.decay ? decay.roundedDecay : new Decimal(0),
    decayStart: decay.start,
    memo: '',
    creationDate: null,
    contribution: null,
    ...defaultModelFunctions,
  }
  return new Transaction(decayDbTransaction, user)
}

export { virtualLinkTransaction, virtualDecayTransaction }
