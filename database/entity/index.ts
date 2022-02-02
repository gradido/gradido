import { Balance } from './Balance'
import { LoginElopageBuys } from './LoginElopageBuys'
import { LoginEmailOptIn } from './LoginEmailOptIn'
import { LoginUser } from './LoginUser'
import { LoginUserBackup } from './LoginUserBackup'
import { Migration } from './Migration'
import { ServerUser } from './ServerUser'
import { Transaction } from './Transaction'
import { TransactionCreation } from './TransactionCreation'
import { TransactionSignature } from './TransactionSignature'
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
  LoginUser,
  LoginUserBackup,
  Migration,
  ServerUser,
  Transaction,
  TransactionCreation,
  TransactionSignature,
  TransactionSendCoin,
  User,
  UserSetting,
  UserTransaction,
]
