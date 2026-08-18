import { UserAlias } from './UserAlias'

export {
  ALIAS_ORIGIN_ADOPTED,
  ALIAS_ORIGIN_ASSIGNED,
  ALIAS_ORIGIN_CHOSEN,
  ALIAS_ORIGIN_MIGRATED,
  type AliasOrigin,
  aliasOriginIsSettled,
} from './UserAlias'

import { Community } from './Community'
import { CommunityHandshakeState } from './CommunityHandshakeState'
import { Contribution } from './Contribution'
import { ContributionCreationGroup } from './ContributionCreationGroup'
import { ContributionLink } from './ContributionLink'
import { ContributionMessage } from './ContributionMessage'
import { CreaRecord } from './CreaRecord'
import { CreaSetting } from './CreaSetting'
import { CreationGroup } from './CreationGroup'
import { DltTransaction } from './DltTransaction'
import { Event } from './Event'
import { FederatedCommunity } from './FederatedCommunity'
import { LoginElopageBuys } from './LoginElopageBuys'
import { Migration } from './Migration'
import { PendingTransaction } from './PendingTransaction'
import { Transaction } from './Transaction'
import { TransactionLink } from './TransactionLink'
import { User } from './User'
import { UserContact } from './UserContact'
import { UserCreationGroup } from './UserCreationGroup'
import { UserRole } from './UserRole'

export {
  UserAlias,
  Community,
  CommunityHandshakeState,
  Contribution,
  ContributionCreationGroup,
  ContributionLink,
  ContributionMessage,
  CreaRecord,
  CreaSetting,
  DltTransaction,
  Event,
  FederatedCommunity,
  CreationGroup,
  LoginElopageBuys,
  Migration,
  PendingTransaction,
  Transaction,
  TransactionLink,
  User,
  UserContact,
  UserCreationGroup,
  UserRole,
}

export const entities = [
  UserAlias,
  Community,
  CommunityHandshakeState,
  Contribution,
  ContributionCreationGroup,
  ContributionLink,
  ContributionMessage,
  CreaRecord,
  CreaSetting,
  DltTransaction,
  Event,
  FederatedCommunity,
  CreationGroup,
  LoginElopageBuys,
  Migration,
  PendingTransaction,
  Transaction,
  TransactionLink,
  User,
  UserContact,
  UserCreationGroup,
  UserRole,
]
