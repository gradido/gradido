export interface ContributionInterface {
  capturedAmount: number
  capturedMemo: string
  creationDate: string
  updated?: boolean
  updatedAmount?: number
  updatedMemo?: string
  updatedCreationDate?: string
  deleted?: boolean
  confirmed?: boolean
  confirmedDate?: string
  denied?: boolean
  deniedDate?: string
  // number of months to move the confirmed creation to the past
  moveCreationDate?: number
}
