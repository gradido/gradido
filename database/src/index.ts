import { latestDbVersion } from './detectLastDBVersion'
import { Community } from './entity/Community'
import { Contribution } from './entity/Contribution'
import { ContributionLink } from './entity/ContributionLink'
import { ContributionMessage } from './entity/ContributionMessage'
import { DltTransaction } from './entity/DltTransaction'
import { Event } from './entity/Event'
import { FederatedCommunity } from './entity/FederatedCommunity'
import { LoginElopageBuys } from './entity/LoginElopageBuys'
import { Migration } from './entity/Migration'
import { OpenaiThreads } from './entity/OpenaiThreads'
import { PendingTransaction } from './entity/PendingTransaction'
import { ProjectBranding } from './entity/ProjectBranding'
import { Transaction } from './entity/Transaction'
import { TransactionLink } from './entity/TransactionLink'
import { User } from './entity/User'
import { UserContact } from './entity/UserContact'
import { UserRole } from './entity/UserRole'

export {
  Community,
  Contribution,
  ContributionLink,
  ContributionMessage,
  DltTransaction,
  Event,
  FederatedCommunity,
  LoginElopageBuys,
  Migration,
  ProjectBranding,
  OpenaiThreads,
  PendingTransaction,
  Transaction,
  TransactionLink,
  User,
  UserContact,
  UserRole,
}

export const entities = [
  Community,
  Contribution,
  ContributionLink,
  ContributionMessage,
  DltTransaction,
  Event,
  FederatedCommunity,
  LoginElopageBuys,
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

export { latestDbVersion }
export * from './logging'
export * from './queries'
export * from './util'  
export * from './enum'
export { AppDatabase } from './AppDatabase'
