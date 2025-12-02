export interface CreationInterface {
  email: string
  amount: number
  memo: string
  contributionDate: string
  confirmed?: boolean
  // number of months to move the confirmed creation to the past
  moveCreationDate?: number
}
