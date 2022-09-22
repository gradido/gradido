import { ContributionInterface } from './ContributionInterface'

export const capturedContribution100OneMonthAgo: ContributionInterface = {
  capturedAmount: 100,
  capturedMemo: 'capturedContribution100',
  creationDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString(),
  updated: false,
  deleted: false,
  confirmed: false,
  denied: false,
}
