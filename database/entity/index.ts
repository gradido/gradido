import { Balance } from './Balance'
import { LoginElopageBuys } from './LoginElopageBuys'
import { LoginEmailOptIn } from './LoginEmailOptIn'
import { LoginPendingTasks } from './LoginPendingTasks'
import { LoginPendingTasksAdmin } from './LoginPendingTasksAdmin'
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

export const entities = [
  Balance,
  LoginElopageBuys,
  LoginEmailOptIn,
  LoginPendingTasks,
  LoginPendingTasksAdmin,
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
]
