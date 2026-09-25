import { dbFindUserByEmail } from 'database'
import { Logger } from 'log4js'
import { AbstractRegisterUserRole } from './AbstractRegisterUser.role'
import { CreateUser } from './createUser.schema'
import { RegisterUserRole } from './RegisterUser.role'
import { RegisterUserCardRole } from './RegisterUserCard.role'
import { RegisterUserExistRole } from './RegisterUserExist.role'
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

export async function registerUser(input: CreateUser, logger: Logger): Promise<number> {
  let role: AbstractRegisterUserRole

  // check if user with email already exists?
  const userAlreadyExist = await dbFindUserByEmail(input.email)
  if (userAlreadyExist) {
    role = new RegisterUserExistRole(input, userAlreadyExist)
  } else if (isRegistrationForProject(input)) {
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
