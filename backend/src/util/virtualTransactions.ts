import { Transaction } from '@model/Transaction'
import { User } from '@model/User'
import { TransactionTypeId } from 'core'
import { Transaction as dbTransaction } from 'database'
import { Decimal } from 'decimal.js-light'
import { calculateDecay } from 'shared'
import { RemoveOptions, SaveOptions } from 'typeorm'

const defaultModelFunctions = {
  hasId: function (): boolean {
    throw new Error('Function not implemented.')
  },
  save: function (_options?: SaveOptions): Promise<dbTransaction> {
    throw new Error('Function not implemented.')
  },
  remove: function (_options?: RemoveOptions): Promise<dbTransaction> {
    throw new Error('Function not implemented.')
  },
  softRemove: function (_options?: SaveOptions): Promise<dbTransaction> {
    throw new Error('Function not implemented.')
  },
  recover: function (_options?: SaveOptions): Promise<dbTransaction> {
    throw new Error('Function not implemented.')
  },
  reload: function (): Promise<void> {
    throw new Error('Function not implemented.')
  },
}

const virtualLinkTransaction = (
  balance: Decimal,
  amount: Decimal,
  _holdAvailableAmount: Decimal,
  decay: Decimal,
  createdAt: Date,
  validUntil: Date,
  user: User,
  _previousBalance: Decimal,
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
    userGradidoID: '',
    userName: null,
    linkedUserGradidoID: null,
    linkedUserName: null,
    userCommunityUuid: null,
    linkedUserCommunityUuid: null,
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
    userGradidoID: '',
    userName: null,
    linkedUserGradidoID: null,
    linkedUserName: null,
    userCommunityUuid: null,
    linkedUserCommunityUuid: null,
  }
  return new Transaction(decayDbTransaction, user)
}

export { virtualLinkTransaction, virtualDecayTransaction }
