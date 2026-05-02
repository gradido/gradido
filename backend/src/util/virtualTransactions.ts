import { Decay } from '@model/Decay'
import { Transaction } from '@model/Transaction'
import { User } from '@model/User'
import { TransactionTypeId } from 'core'
import { GradidoUnit } from 'shared'

// TODO: find a better solution
const virtualLinkTransaction = (amount: GradidoUnit, user: User): Transaction => {
  return {
    id: -2,
    user,
    previous: -1,
    typeId: TransactionTypeId.LINK_SUMMARY,
    amount,
    balance: new GradidoUnit(0n),
    balanceDate: new Date(),
    previousBalance: new GradidoUnit(0n),
    decay: new Decay(),
    memo: '',
    creationDate: null,
    linkedUser: null,
    linkedTransactionId: null,
    linkId: null,
  }
}

const virtualDecayTransaction = (
  balance: GradidoUnit,
  balanceDate: Date,
  time: Date = new Date(),
  user: User,
  holdAvailabeAmount: GradidoUnit,
): Transaction => {
  const decay = balance.calculateDecay(balanceDate, time)
  return {
    id: -1,
    user,
    previous: null,
    typeId: TransactionTypeId.DECAY,
    amount: decay.decay || new GradidoUnit(0n),
    balance: decay.balance.subtract(holdAvailabeAmount),
    balanceDate: time,
    previousBalance: new GradidoUnit(0n),
    decay,
    memo: '',
    creationDate: null,
    linkedUser: null,
    linkedTransactionId: null,
    linkId: null,
  }
}

export { virtualLinkTransaction, virtualDecayTransaction }
