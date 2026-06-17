import { getDecayRespiteCent, getDecayStartTime } from 'shared-native'

export const LOG4JS_BASE_CATEGORY_NAME = 'shared'

// gradido transaction logic constants
// for transaction links
export const CODE_VALID_DAYS_DURATION = 14

// decay
export const DECAY_START_TIME = getDecayStartTime()

/**
 * The tolerance buffer for balance validation and decay calculations, expressed in GradidoCent.
 *
 * This constant accounts for rounding errors, timestamp discrepancies (e.g., Hedera consensus delay),
 * and natural imprecision in continuous decay calculations. It ensures that micro‑transactions are not
 * incorrectly rejected due to mathematical drift, reflecting Gradido's principle of generosity.
 *
 * 100 GradidoCent = 0.01 GDD
 *
 * @constant {number} GRADIDO_DECAY_RESPITE_CENT
 */
export const DECAY_RESPITE_CENT = getDecayRespiteCent()

// for contributions
// 1'000 gdd = 10'000'000 gdd cent
export const MAX_CREATION_AMOUNT = 10000000n

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
