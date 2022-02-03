import { Balance } from './Balance'
import { LoginElopageBuys } from './LoginElopageBuys'
import { LoginEmailOptIn } from './LoginEmailOptIn'
import { Migration } from './Migration'
import { ServerUser } from './ServerUser'
import { Transaction } from './Transaction'
import { TransactionCreation } from './TransactionCreation'
import { TransactionSendCoin } from './TransactionSendCoin'
import { User } from './User'
import { UserSetting } from './UserSetting'
import { UserTransaction } from './UserTransaction'
import { AdminPendingCreation } from './AdminPendingCreation'

export const entities = [
  AdminPendingCreation,
  Balance,
  LoginElopageBuys,
  LoginEmailOptIn,
  Migration,
  ServerUser,
  Transaction,
  TransactionCreation,
  TransactionSendCoin,
  User,
  UserSetting,
  UserTransaction,
]
