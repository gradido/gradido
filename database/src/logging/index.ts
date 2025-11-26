import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'
import { AbstractLoggingView } from './AbstractLogging.view'
import { CommunityHandshakeStateLoggingView } from './CommunityHandshakeStateLogging.view'
import { CommunityLoggingView } from './CommunityLogging.view'
import { ContributionLoggingView } from './ContributionLogging.view'
import { ContributionMessageLoggingView } from './ContributionMessageLogging.view'
import { DltTransactionLoggingView } from './DltTransactionLogging.view'
import { FederatedCommunityLoggingView } from './FederatedCommunityLogging.view'
import { PendingTransactionLoggingView } from './PendingTransactionLogging.view'
import { TransactionLoggingView } from './TransactionLogging.view'
import { UserContactLoggingView } from './UserContactLogging.view'
import { UserLoggingView } from './UserLogging.view'
import { UserRoleLoggingView } from './UserRoleLogging.view'

export {
  AbstractLoggingView,
  CommunityLoggingView,
  ContributionLoggingView,
  ContributionMessageLoggingView,
  DltTransactionLoggingView,
  FederatedCommunityLoggingView,
  PendingTransactionLoggingView,
  TransactionLoggingView,
  UserContactLoggingView,
  UserLoggingView,
  UserRoleLoggingView,
  CommunityHandshakeStateLoggingView,
}

export const logger = getLogger(LOG4JS_BASE_CATEGORY_NAME)
