export interface UserContext {
  pubkey?: Buffer
  email?: string
  firstName?: string
  lastName?: string
  username?: string
  disabled?: boolean
}

export interface LoginUserContext {
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
}

export interface LoginUserBackupContext {
  userId?: number
  passphrase?: string
  mnemonicType?: number
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

export interface LoginUserRolesContext {
  userId?: number
  roleId?: number
}
