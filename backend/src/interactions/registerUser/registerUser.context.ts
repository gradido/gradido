import { dbFindUserByEmail } from 'database'
import { Logger } from 'log4js'
import { AbstractRegisterUserRole } from './AbstractRegisterUser.role'
import { CreateUser } from './createUser.schema'
import { RegisterUserRole } from './RegisterUser.role'
import { RegisterUserForProjectRole } from './RegisterUserForProject.role'
import { RegisterUserFromTransactionLinkRole } from './RegisterUserFromTransactionLink.role'
import { RegisterUserFromVouchingLinkRole } from './RegisterUserFromVouchingLink.role'
import { RegisterUserGuarantorRole } from './RegisterUserGuarantor.role'
import { RegisterUserReferrerRole } from './RegisterUserReferrer.role'

// registration with a guarantor code: scanned from the live card of the member who vouches, or opened from their link
function isRegistrationWithGuarantorCode(input: CreateUser): boolean {
  return input.guarantorCode != null
}

// if it was a registration for a another project which means showing logo and forward to humhub space after register is complete
function isRegistrationForProject(input: CreateUser): boolean {
  return input.project != null
}

// if the non-user has try to redeem a transaction or contribution link and clicked then at register
function isRegistrationFromTransactionLink(input: CreateUser): boolean {
  return input.redeemCode != null
}

// the redeem code came with a password: the guest accepts a member's thank-you on the page of the
// link and opens the account right there - where the link vouches for it
function isRegistrationWithPassword(input: CreateUser): boolean {
  return input.password != null
}

// The registration started at somebody's Gradido address (/u/<alias>): they become
// the referrer. A redeem code beats the address.
function isRegistrationWithReferrerAlias(input: CreateUser): boolean {
  return input.referrerAlias != null && input.guarantorCode == null
}

// One variant per registration, in this order - whatever comes after the first that applies
// is not looked at. A guarantor code therefore counts only without a project and without a
// redeem code; with one of them it is ignored.
//
// A password counts where a confirmed member vouches for the account, and nowhere else: with a
// guarantor code, and with a redeem code whose link vouches (RegisterUserFromVouchingLinkRole
// decides it, and registers as RegisterUserFromTransactionLinkRole where the link does not).
// With a project it is ignored, and without a code of either kind. No account can get a
// password that no member vouches for.
export async function registerUser(input: CreateUser, logger: Logger): Promise<number> {
  let role: AbstractRegisterUserRole

  if (isRegistrationForProject(input)) {
    role = new RegisterUserForProjectRole(input)
  } else if (isRegistrationFromTransactionLink(input)) {
    role = isRegistrationWithPassword(input)
      ? new RegisterUserFromVouchingLinkRole(input)
      : new RegisterUserFromTransactionLinkRole(input)
  } else if (isRegistrationWithGuarantorCode(input)) {
    role = new RegisterUserGuarantorRole(input)
  } else if (isRegistrationWithReferrerAlias(input)) {
    role = new RegisterUserReferrerRole(input)
  } else {
    role = new RegisterUserRole(input)
  }

  return role.run(logger)
}
