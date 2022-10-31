// eslint-disable-next-line camelcase
import { getDateAs_YYYYMMDD_String } from '@/util/utilities'
import { ContributionInterface } from './ContributionInterface'

export const updatedContribution101OneMonthBefore: ContributionInterface = {
  capturedAmount: 100,
  capturedMemo: 'capturedContribution100',
  creationDate: getDateAs_YYYYMMDD_String(
    new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
  ),
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
