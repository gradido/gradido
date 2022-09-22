import { ContributionInterface } from './ContributionInterface'

export const updatedContribution101OneMonthBefore: ContributionInterface = {
  capturedAmount: 100,
  capturedMemo: 'capturedContribution100',
  creationDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString(),
  updated: true,
  updatedAmount: 101,
  updatedMemo: 'updatedContribution101',
  updatedCreationDate: new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 1,
    2,
  ).toISOString(),
  confirmed: false,
  denied: false,
  deleted: false,
}
