import { Decimal } from 'decimal.js-light'

export const MAX_CREATION_AMOUNT = new Decimal(1000)
export const FULL_CREATION_AVAILABLE = [
  MAX_CREATION_AMOUNT,
  MAX_CREATION_AMOUNT,
  MAX_CREATION_AMOUNT,
]
export const CONTRIBUTIONLINK_NAME_MAX_CHARS = 100
export const CONTRIBUTIONLINK_NAME_MIN_CHARS = 5
export const MEMO_MAX_CHARS = 512
export const MEMO_MIN_CHARS = 5
export const DEFAULT_PAGINATION_PAGE_SIZE = 25
export const FRONTEND_CONTRIBUTIONS_ITEM_ANCHOR_PREFIX = 'contributionListItem-'
export const CODE_VALID_DAYS_DURATION = 14
