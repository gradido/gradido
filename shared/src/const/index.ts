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
// memo travels with a transaction: it is stored in a varchar(512) column and is
// re-validated by the dlt-connector, so these bounds must not be widened here.
export const MEMO_MAX_CHARS = 512
export const MEMO_MIN_CHARS = 5
// a person-to-person message carries no amount and is stored in no varchar column,
// so it can be roomier than a memo. A short reply like "Yes" has to pass as well.
export const MESSAGE_MAX_CHARS = 2000
export const MESSAGE_MIN_CHARS = 1

// authentication
// 10 minutes
export const FEDERATION_AUTHENTICATION_TIMEOUT_MS = 60 * 1000 * 10
export const REDEEM_JWT_TOKEN_EXPIRATION = '10m'
export const GRADIDO_REALM = 'gradido'

// communication with frontend
export const DEFAULT_PAGINATION_PAGE_SIZE = 25
export const MAX_PAGINATION_PAGE_SIZE = 500
export const FRONTEND_CONTRIBUTIONS_ITEM_ANCHOR_PREFIX = 'contributionListItem-'
export const FRONTEND_LOGIN_ROUTE = 'login'

// Mirrors the users.salutation column (varchar 255, migration 0105); the admin field
// carries the same limit, so an over-long value is stopped before it gets here.
export const SALUTATION_MAX_LENGTH = 255
