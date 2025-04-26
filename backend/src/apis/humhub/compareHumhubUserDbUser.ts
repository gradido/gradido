import type { User } from '@entity/User'

import { Account } from './model/Account'
import type { GetUser } from './model/GetUser'
import { Profile } from './model/Profile'

function profileIsTheSame(profile: Profile, user: User): boolean {
  const gradidoUserProfile = new Profile(user)
  if (profile.firstname !== gradidoUserProfile.firstname) {
    return false
  }
  if (profile.lastname !== gradidoUserProfile.lastname) {
    return false
  }
  if (profile.gradido_address !== gradidoUserProfile.gradido_address) {
    return false
  }
  return true
}

function accountIsTheSame(account: Account, user: User): boolean {
  const gradidoUserAccount = new Account(user)
  if (account.username !== gradidoUserAccount.username) {
    return false
  }
  if (account.email !== gradidoUserAccount.email) {
    return false
  }
  if (account.language !== gradidoUserAccount.language) {
    return false
  }
  if (account.status !== gradidoUserAccount.status) {
    return false
  }
  return true
}

/**
 * compare if gradido user (db entity) differ from humhub user
 * @param humhubUser
 * @param gradidoUse
 * @return true if no differences
 */
export function isHumhubUserIdenticalToDbUser(humhubUser: GetUser, gradidoUser: User): boolean {
  return (
    profileIsTheSame(humhubUser.profile, gradidoUser) &&
    accountIsTheSame(humhubUser.account, gradidoUser)
  )
}
