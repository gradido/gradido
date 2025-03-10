import { ContributionLink } from './ContributionLink'
import { LoginElopageBuys } from './LoginElopageBuys'
import { LoginEmailOptIn } from './LoginEmailOptIn'
import { Migration } from './Migration'
import { ProjectBranding } from './ProjectBranding'
import { Transaction } from './Transaction'
import { TransactionLink } from './TransactionLink'
import { User } from './User'
import { UserContact } from './UserContact'
import { Contribution } from './Contribution'
import { Event } from './Event'
import { ContributionMessage } from './ContributionMessage'
import { Community } from './Community'
import { FederatedCommunity } from './FederatedCommunity'
import { UserRole } from './UserRole'
import { DltTransaction } from './DltTransaction'
import { PendingTransaction } from './0071-add-pending_transactions-table/PendingTransaction'

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
  PendingTransaction,
  Transaction,
  TransactionLink,
  User,
  UserContact,
  UserRole,
]
