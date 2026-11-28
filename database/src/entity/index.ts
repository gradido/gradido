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
import { Contribution } from './Contribution'
import { ContributionCreationGroup } from './ContributionCreationGroup'
import { ContributionLink } from './ContributionLink'
import { ContributionMessage } from './ContributionMessage'
import { DltTransaction } from './DltTransaction'
import { Event } from './Event'
import { PendingTransaction } from './PendingTransaction'
import { Transaction } from './Transaction'
import { TransactionLink } from './TransactionLink'
import { User } from './User'
import { UserContact } from './UserContact'
import { UserRole } from './UserRole'

export {
  Community,
  Contribution,
  ContributionCreationGroup,
  ContributionLink,
  ContributionMessage,
  DltTransaction,
  Event,
  PendingTransaction,
  Transaction,
  TransactionLink,
  User,
  UserAlias,
  UserContact,
  UserRole,
}

export const entities = [
  UserAlias,
  Community,
  Contribution,
  ContributionCreationGroup,
  ContributionLink,
  ContributionMessage,
  DltTransaction,
  Event,
  PendingTransaction,
  Transaction,
  TransactionLink,
  User,
  UserContact,
  UserRole,
]
