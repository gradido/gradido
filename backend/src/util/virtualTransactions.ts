import { Transaction } from '@model/Transaction'
import { User } from '@model/User'
import { TransactionTypeId } from 'core'
import { Transaction as dbTransaction } from 'database'
import { Decimal } from 'decimal.js-light'
import { calculateDecay, Decay, DecayCalculationType } from 'shared'
import { GradidoUnit } from 'shared-native'
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
  balance: GradidoUnit,
  amount: GradidoUnit,
  _holdAvailableAmount: GradidoUnit,
  decay: GradidoUnit,
  createdAt: Date,
  validUntil: Date,
  user: User,
  _previousBalance: GradidoUnit,
): Transaction => {
  const linkDbTransaction: dbTransaction = {
    id: -2,
    userId: -1,
    previous: -1,
    typeId: TransactionTypeId.LINK_SUMMARY,
    amount: new Decimal(amount.toString()).toDecimalPlaces(2, Decimal.ROUND_FLOOR),
    balance: new Decimal(balance.toString()).toDecimalPlaces(2, Decimal.ROUND_DOWN),
    balanceDate: validUntil,
    decay: new Decimal(decay.toString()).toDecimalPlaces(2, Decimal.ROUND_FLOOR),
    decayStart: createdAt,
    decayCalculationType: DecayCalculationType.NATIVE_C_DYNAMIC_FACTOR,
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
  balance: GradidoUnit,
  balanceDate: Date,
  time: Date = new Date(),
  user: User,
  holdAvailabeAmount: GradidoUnit,
): Transaction => {
  const decay = new Decay(balance).calculateDecay(balanceDate, time)
  const roundedDecayAmount = decay.decay ? new Decimal(decay.roundedDecay.toString()) : new Decimal(0)
  // const balance = decay.balance.minus(lastTransaction.balance)
  const decayDbTransaction: dbTransaction = {
    id: -1,
    userId: -1,
    previous: -1,
    typeId: TransactionTypeId.DECAY,
    amount: roundedDecayAmount,
    balance: new Decimal(decay.balance.rounded(2).sub(holdAvailabeAmount).round(2).toString()),
    balanceDate: time,
    decay: roundedDecayAmount,
    decayStart: decay.start,
    decayCalculationType: DecayCalculationType.NATIVE_C_DYNAMIC_FACTOR,
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
