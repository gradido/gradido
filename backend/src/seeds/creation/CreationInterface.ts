export interface CreationInterface {
  email: string
  amount: number
  memo: string
  creationDate: string
  confirmed?: boolean
  // number of months to move the confirmed creation to the past
  moveCreationDate?: number
}
