export interface UserContext {
  pubKey?: Buffer
  email?: string
  firstName?: string
  lastName?: string
  username?: string
  disabled?: boolean
  description?: string
  password?: BigInt
  privKey?: Buffer
  emailHash?: Buffer
  createdAt?: Date
  emailChecked?: boolean
  passphraseShown?: boolean
  language?: string
  publisherId?: number
  passphrase?: string
}

export interface ServerUserContext {
  username?: string
  password?: string
  email?: string
  role?: string
  activated?: number
  lastLogin?: Date
  created?: Date
  modified?: Date
}
