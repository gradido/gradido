import { GradidoUnit } from 'shared'
import { getDecayStartTime } from 'shared-native'

// logging
export const LOG4JS_BASE_CATEGORY_NAME = 'shared'

// gradido transaction logic constants
// for transaction links
export const CODE_VALID_DAYS_DURATION = 14

// decay
export const DECAY_START_TIME = getDecayStartTime()

// for contributions
// 1'000 gdd = 10'000'000 gdd cent
export const MAX_CREATION_AMOUNT = new GradidoUnit(10000000n)
export const FULL_CREATION_AVAILABLE = [
  MAX_CREATION_AMOUNT,
  MAX_CREATION_AMOUNT,
  MAX_CREATION_AMOUNT,
]

// input validation
export const CONTRIBUTIONLINK_NAME_MAX_CHARS = 100
export const CONTRIBUTIONLINK_NAME_MIN_CHARS = 5
export const MEMO_MAX_CHARS = 512
export const MEMO_MIN_CHARS = 5

// authentication
// 10 minutes
export const FEDERATION_AUTHENTICATION_TIMEOUT_MS = 60 * 1000 * 10
export const REDEEM_JWT_TOKEN_EXPIRATION = '10m'
export const GRADIDO_REALM = 'gradido'

// communication with frontend
export const DEFAULT_PAGINATION_PAGE_SIZE = 25
export const FRONTEND_CONTRIBUTIONS_ITEM_ANCHOR_PREFIX = 'contributionListItem-'
export const FRONTEND_LOGIN_ROUTE = 'login'
