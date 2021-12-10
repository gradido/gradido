import { Balance } from './Balance'
import { LoginElopageBuys } from './LoginElopageBuys'
import { LoginEmailOptIn } from './LoginEmailOptIn'
import { LoginUser } from './LoginUser'
import { LoginUserRoles } from './LoginUserRoles'
import { LoginUserBackup } from './LoginUserBackup'
import { Migration } from './Migration'
import { ServerUser } from './ServerUser'
import { Transaction } from './Transaction'
import { TransactionCreation } from './TransactionCreation'
import { TransactionSendCoin } from './TransactionSendCoin'
import { TransactionSignature } from './TransactionSignature'
import { User } from './User'
import { UserSetting } from './UserSetting'
import { UserTransaction } from './UserTransaction'
import { LoginPendingTasksAdmin } from './LoginPendingTasksAdmin'

export const entities = [
  Balance,
  LoginElopageBuys,
  LoginEmailOptIn,
  LoginUser,
  LoginUserRoles,
  LoginUserBackup,
  Migration,
  ServerUser,
  Transaction,
  TransactionCreation,
  TransactionSignature,
  TransactionSendCoin,
  TransactionSignature,
  User,
  UserSetting,
  UserTransaction,
  LoginPendingTasksAdmin,
]
