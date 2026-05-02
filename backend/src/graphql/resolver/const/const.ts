import { GradidoUnit } from 'shared'

// 1'000 gdd = 10'000'000 gdd cent
export const MAX_CREATION_AMOUNT = new GradidoUnit(10000000n)
export const FULL_CREATION_AVAILABLE = [
  MAX_CREATION_AMOUNT,
  MAX_CREATION_AMOUNT,
  MAX_CREATION_AMOUNT,
]
export const DEFAULT_PAGINATION_PAGE_SIZE = 25
export const FRONTEND_CONTRIBUTIONS_ITEM_ANCHOR_PREFIX = 'contributionListItem-'
export const CODE_VALID_DAYS_DURATION = 14
