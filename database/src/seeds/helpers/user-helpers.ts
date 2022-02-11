import { UserContext, ServerUserContext } from '../../interface/UserContext'
import {
  BalanceContext,
  TransactionContext,
  TransactionCreationContext,
  UserTransactionContext,
} from '../../interface/TransactionContext'
import { UserInterface } from '../../interface/UserInterface'
import { User } from '../../../entity/User'
import { ServerUser } from '../../../entity/ServerUser'
import { Balance } from '../../../entity/Balance'
import { Transaction } from '../../../entity/Transaction'
import { UserTransaction } from '../../../entity/UserTransaction'
import { TransactionCreation } from '../../../entity/TransactionCreation'
import { Factory } from 'typeorm-seeding'

export const userSeeder = async (factory: Factory, userData: UserInterface): Promise<void> => {
  const user = await factory(User)(createUserContext(userData)).create()

  if (userData.isAdmin) {
    await factory(ServerUser)(createServerUserContext(userData)).create()
  }

  if (userData.addBalance) {
    // create some GDD for the user
    await factory(Balance)(createBalanceContext(userData, user)).create()
    const transaction = await factory(Transaction)(
      createTransactionContext(userData, 1, 'Herzlich Willkommen bei Gradido!'),
    ).create()
    await factory(TransactionCreation)(
      createTransactionCreationContext(userData, user, transaction),
    ).create()
    await factory(UserTransaction)(
      createUserTransactionContext(userData, user, transaction),
    ).create()
  }
}

const createUserContext = (context: UserInterface): UserContext => {
  return {
    pubKey: context.pubKey,
    email: context.email,
    firstName: context.firstName,
    lastName: context.lastName,
    disabled: context.disabled,
    password: context.password,
    privKey: context.privKey,
    emailHash: context.emailHash,
    createdAt: context.createdAt,
    emailChecked: context.emailChecked,
    language: context.language,
    publisherId: context.publisherId,
  }
}

const createServerUserContext = (context: UserInterface): ServerUserContext => {
  return {
    role: context.role,
    password: context.serverUserPassword,
    email: context.email,
    activated: context.activated,
    created: context.createdAt,
    lastLogin: context.lastLogin,
    modified: context.modified,
  }
}

const createBalanceContext = (context: UserInterface, user: User): BalanceContext => {
  return {
    modified: context.balanceModified,
    recordDate: context.recordDate,
    amount: context.amount,
    user,
  }
}

const createTransactionContext = (
  context: UserInterface,
  type: number,
  memo: string,
): TransactionContext => {
  return {
    transactionTypeId: type,
    txHash: context.creationTxHash,
    memo,
    received: context.recordDate,
  }
}

const createTransactionCreationContext = (
  context: UserInterface,
  user: User,
  transaction: Transaction,
): TransactionCreationContext => {
  return {
    userId: user.id,
    amount: context.amount,
    targetDate: context.targetDate,
    transaction,
  }
}

const createUserTransactionContext = (
  context: UserInterface,
  user: User,
  transaction: Transaction,
): UserTransactionContext => {
  return {
    userId: user.id,
    transactionId: transaction.id,
    transactionTypeId: transaction.transactionTypeId,
    balance: context.amount,
    balanceDate: context.recordDate,
    signature: context.signature,
    pubkey: context.signaturePubkey,
  }
}
