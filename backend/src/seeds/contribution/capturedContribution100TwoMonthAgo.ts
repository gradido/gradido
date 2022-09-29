import { ContributionInterface } from './ContributionInterface'

export const capturedContribution100TwoMonthAgo: ContributionInterface = {
  capturedAmount: 100,
  capturedMemo: 'capturedContribution100 two month ago',
  creationDate: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString(),
  updated: false,
  deleted: false,
  confirmed: false,
  denied: false,
}
