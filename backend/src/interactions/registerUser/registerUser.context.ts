import { dbFindUserByEmail } from 'database'
import { Logger } from 'log4js'
import { AbstractRegisterUserRole } from './AbstractRegisterUser.role'
import { CreateUser } from './createUser.schema'
import { RegisterUserRole } from './RegisterUser.role'
import { RegisterUserCardRole } from './RegisterUserCard.role'
import { RegisterUserForProjectRole } from './RegisterUserForProject.role'
import { RegisterUserFromTransactionLinkRole } from './RegisterUserFromTransactionLink.role'
import { RegisterUserReferrerRole } from './RegisterUserReferrer.role'

// assisted user registration with scanning other users gradido card or using his link (containing presenceCode)
function isRegistrationWithCard(input: CreateUser): boolean {
  return input.presenceCode != null
}

// if it was a registration for a another project which means showing logo and forward to humhub space after register is complete
function isRegistrationForProject(input: CreateUser): boolean {
  return input.project != null
}

// if the non-user has try to redeem a transaction or contribution link and clicked then at register
function isRegistrationFromTransactionLink(input: CreateUser): boolean {
  return input.redeemCode != null
}

// The registration started at somebody's Gradido address (/u/<alias>): they become
// the referrer. A redeem code beats the address.
function isRegistrationWithReferrerAlias(input: CreateUser): boolean {
  return input.referrerAlias != null && input.presenceCode == null
}

// One variant per registration, in this order - whatever comes after the first that applies
// is not looked at. A table code, and the password that comes with it, therefore counts only
// without a project and without a redeem code; with one of them it is ignored, and no account
// can get a password that no member vouches for.
export async function registerUser(input: CreateUser, logger: Logger): Promise<number> {
  let role: AbstractRegisterUserRole

  if (isRegistrationForProject(input)) {
    role = new RegisterUserForProjectRole(input)
  } else if (isRegistrationFromTransactionLink(input)) {
    role = new RegisterUserFromTransactionLinkRole(input)
  } else if (isRegistrationWithCard(input)) {
    role = new RegisterUserCardRole(input)
  } else if (isRegistrationWithReferrerAlias(input)) {
    role = new RegisterUserReferrerRole(input)
  } else {
    role = new RegisterUserRole(input)
  }

  return role.run(logger)
}
