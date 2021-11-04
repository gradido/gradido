import { Balance } from './Balance'
import { LoginEmailOptIn } from './LoginEmailOptIn'
import { LoginUser } from './LoginUser'
import { LoginUserBackup } from './LoginUserBackup'
import { Migration } from './Migration'
import { Transaction } from './Transaction'
import { TransactionCreation } from './TransactionCreation'
import { TransactionSendCoin } from './TransactionSendCoin'
import { User } from './User'
import { UserSetting } from './UserSetting'
import { UserTransaction } from './UserTransaction'

export const entities = [
  Balance,
  LoginUser,
  LoginUserBackup,
  LoginEmailOptIn,
  Migration,
  Transaction,
  TransactionCreation,
  TransactionSendCoin,
  User,
  UserSetting,
  UserTransaction,
]
