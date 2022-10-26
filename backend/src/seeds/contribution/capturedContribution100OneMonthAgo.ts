// eslint-disable-next-line camelcase
import { getDateAs_YYYYMMDD_String } from '@/util/utilities'
import { ContributionInterface } from './ContributionInterface'

export const capturedContribution100OneMonthAgo: ContributionInterface = {
  capturedAmount: 100,
  capturedMemo: 'capturedContribution100',
  creationDate: getDateAs_YYYYMMDD_String(
    new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
  ),
  updated: false,
  deleted: false,
  confirmed: false,
  denied: false,
}
