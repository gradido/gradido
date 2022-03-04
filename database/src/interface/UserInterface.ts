import Decimal from 'decimal.js-light'

export interface UserInterface {
  // from user
  email?: string
  firstName?: string
  lastName?: string
  password?: BigInt
  pubKey?: Buffer
  privKey?: Buffer
  emailHash?: Buffer
  createdAt?: Date
  emailChecked?: boolean
  language?: string
  deletedAt?: Date
  publisherId?: number
  passphrase?: string
  // from server user
  serverUserPassword?: string
  role?: string
  activated?: number
  lastLogin?: Date
  modified?: Date
  // flag for admin
  isAdmin?: boolean
  // flag for balance (creation of 1000 GDD)
  addBalance?: boolean
  // balance
  recordDate?: Date
  creationDate?: Date
  amount?: Decimal
}
