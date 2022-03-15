import { UserContext, ServerUserContext } from '../../interface/UserContext'
import { TransactionContext } from '../../interface/TransactionContext'
import { UserInterface } from '../../interface/UserInterface'
import { User } from '../../../entity/User'
import { ServerUser } from '../../../entity/ServerUser'
import { Transaction } from '../../../entity/Transaction'
import { Factory } from 'typeorm-seeding'
import Decimal from 'decimal.js-light'

export const userSeeder = async (factory: Factory, userData: UserInterface): Promise<void> => {
  const user = await factory(User)(createUserContext(userData)).create()

  if (userData.isAdmin) {
    await factory(ServerUser)(createServerUserContext(userData)).create()
  }

  if (userData.addBalance) {
    // create some GDD for the user
    await factory(Transaction)(
      createTransactionContext(userData, user, 1, 'Herzlich Willkommen bei Gradido!'),
    ).create()
  }
}

const createUserContext = (context: UserInterface): UserContext => {
  return {
    pubKey: context.pubKey,
    email: context.email,
    firstName: context.firstName,
    lastName: context.lastName,
    deletedAt: context.deletedAt,
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

const createTransactionContext = (
  context: UserInterface,
  user: User,
  type: number,
  memo: string,
): TransactionContext => {
  return {
    typeId: type,
    userId: user.id,
    amount: context.amount || new Decimal(1000),
    balance: context.amount || new Decimal(1000),
    balanceDate: new Date(context.recordDate || Date.now()),
    memo,
    creationDate: context.creationDate,
  }
}
