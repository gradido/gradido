import { ContributionLink } from './ContributionLink'
import { LoginElopageBuys } from './LoginElopageBuys'
import { LoginEmailOptIn } from './LoginEmailOptIn'
import { Migration } from './Migration'
import { Transaction } from './Transaction'
import { TransactionLink } from './TransactionLink'
import { User } from './User'
<<<<<<< HEAD
import { UserSetting } from './UserSetting'
import { AdminPendingCreation } from './AdminPendingCreation'
import { Community } from './Community'
import { CommunityFederation } from './CommunityFederation'
import { CommunityApiVersion } from './CommunityApiVersion'
=======
import { UserContact } from './UserContact'
import { Contribution } from './Contribution'
import { EventProtocol } from './EventProtocol'
import { ContributionMessage } from './ContributionMessage'
>>>>>>> refs/remotes/origin/master

export const entities = [
  Contribution,
  ContributionLink,
  LoginElopageBuys,
  LoginEmailOptIn,
  Migration,
  Transaction,
  TransactionLink,
  User,
<<<<<<< HEAD
  UserSetting,
  Community,
  CommunityFederation,
  CommunityApiVersion,
=======
  EventProtocol,
  ContributionMessage,
  UserContact,
>>>>>>> refs/remotes/origin/master
]
