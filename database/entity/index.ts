import { latestDbVersion } from '../src/config/detectLastDBVersion'
import { PendingTransaction } from './0071-add-pending_transactions-table/PendingTransaction'
import { Community } from './Community'
import { Contribution } from './Contribution'
import { ContributionLink } from './ContributionLink'
import { ContributionMessage } from './ContributionMessage'
import { DltTransaction } from './DltTransaction'
import { Event } from './Event'
import { FederatedCommunity } from './FederatedCommunity'
import { LoginElopageBuys } from './LoginElopageBuys'
import { LoginEmailOptIn } from './LoginEmailOptIn'
import { Migration } from './Migration'
import { OpenaiThreads } from './OpenaiThreads'
import { ProjectBranding } from './ProjectBranding'
import { Transaction } from './Transaction'
import { TransactionLink } from './TransactionLink'
import { User } from './User'
import { UserContact } from './UserContact'
import { UserRole } from './UserRole'

export {
  Community,
  Contribution,
  ContributionLink,
  ContributionMessage,
  DltTransaction,
  Event,
  FederatedCommunity,
  LoginElopageBuys,
  LoginEmailOptIn,
  Migration,
  ProjectBranding,
  OpenaiThreads,
  PendingTransaction,
  Transaction,
  TransactionLink,
  User,
  UserContact,
  UserRole,
  latestDbVersion,
}
export * from '../logging'

export const entities = [
  Community,
  Contribution,
  ContributionLink,
  ContributionMessage,
  DltTransaction,
  Event,
  FederatedCommunity,
  LoginElopageBuys,
  LoginEmailOptIn,
  Migration,
  ProjectBranding,
  OpenaiThreads,
  PendingTransaction,
  Transaction,
  TransactionLink,
  User,
  UserContact,
  UserRole,
]
