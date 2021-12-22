export interface UserInterface {
  // from login user (contains state user)
  email?: string
  firstName?: string
  lastName?: string
  username?: string
  description?: string
  password?: BigInt
  pubKey?: Buffer
  privKey?: Buffer
  emailHash?: Buffer
  createdAt?: Date
  emailChecked?: boolean
  passphraseShown?: boolean
  language?: string
  disabled?: boolean
  groupId?: number
  publisherId?: number | null
  // from login user backup
  passphrase?: string
  mnemonicType?: number
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
  balanceModified?: Date
  recordDate?: Date
  targetDate?: Date
  amount?: number
  creationTxHash?: Buffer
  signature?: Buffer
  signaturePubkey?: Buffer
}
