// AI-GENERATED — not an architecture reference
import {
  AccountState,
  DbUser,
  DrizzleTransaction,
  dbFindTransactionLinkWithOwner,
  dbHasGuestRegisteredByLink,
  UserInsert,
} from 'database'
import { Logger } from 'log4js'
import { Result } from 'shared'
import { linkVouches } from '@/data/VouchingLink.logic'
import { RegisterUserDuplicateError } from './errorTypes'
import { RegisterUserFromTransactionLinkRole } from './RegisterUserFromTransactionLink.role'

/**
 * A redeem code that comes with a password (ZE-017 F5): somebody accepts a member's thank-you
 * on the page its link opens, and gets the account right there. The link vouches for that
 * account as a guarantor code does at a table - the same steps (RegisterUserRole), the same
 * state, the same limit per member, the same mail that asks only to confirm the address.
 *
 * A link vouches only while all of this holds, read under the lock of its maker's row:
 *   1. it is a member's redeem link, and open (data/VouchingLink.logic.ts)
 *   2. the member who made it is confirmed (same place)
 *   3. they hold a place under GUARANTOR_LIMIT, shared with their guarantor codes
 *   4. no account was registered through this link before: one link, one account. A link lives
 *      for days and travels through messengers; without this, whoever gets hold of an open one
 *      could fill all the member's places.
 *
 * ⛔ Where it does not, nothing is refused: the registration goes on as
 * RegisterUserFromTransactionLinkRole - an account without a password, and the activation
 * mail that carries the code. The password is dropped, and the answer is the same. Nobody is
 * beside the guest to hand them a new link, as there is with a code at a table.
 */
export class RegisterUserFromVouchingLinkRole extends RegisterUserFromTransactionLinkRole {
  // Decided inside the transaction, under the lock. Until then, and for every other redeem
  // code, every step below is the one of RegisterUserFromTransactionLinkRole.
  private vouched = false

  public getRoleTitle(): string {
    return this.vouched ? 'Register User with vouching Transaction Link' : super.getRoleTitle()
  }

  public async storeUserAndUserContact(
    dbUser: UserInsert,
    logger: Logger,
    tx: DrizzleTransaction,
  ): Promise<Result<number, RegisterUserDuplicateError>> {
    const { password } = this.user
    // prepareUser made the member who made the link the referrer: the one who would vouch.
    const guarantorId = dbUser.referrerId
    const linkId = this.transactionLinkId
    if (password && guarantorId && linkId && (await this.vouches(linkId, guarantorId, tx))) {
      this.vouched = true
      // As with a guarantor code: acts before the address is confirmed, and counts against
      // the member's GUARANTOR_LIMIT until it is.
      dbUser.accountState = AccountState.PARTLY_ACTIVATED_GUARANTOR
    }
    const result = await super.storeUserAndUserContact(dbUser, logger, tx)
    // `password` is there whenever the link vouched; the type does not know it.
    if (result.success && this.vouched && password) {
      // The hash starts once the account is stored, for the id it was stored under, and runs
      // beside the rest. Not before: an address that is taken stores nothing, and the hash
      // would be work for nobody.
      this.startPasswordEncryption(dbUser.gradidoId, password)
      // The event of the registration is what rule 4 looks for. Written here, with the
      // account and under the lock: the next registration through this link finds it.
      await super.storeUserRegisterEvent(tx)
    }
    return result
  }

  // ⛔ guarantorHoldsPlace first: it takes the lock, and nothing may be read before the lock.
  private async vouches(
    linkId: number,
    guarantorId: number,
    tx: DrizzleTransaction,
  ): Promise<boolean> {
    return (
      (await this.guarantorHoldsPlace(guarantorId, tx)) &&
      linkVouches(await dbFindTransactionLinkWithOwner(linkId, tx), guarantorId, new Date()) &&
      !(await dbHasGuestRegisteredByLink(guarantorId, linkId, tx))
    )
  }

  public async sendAccountActivationEmail(activationLink: string): Promise<boolean> {
    return this.vouched
      ? this.sendConfirmAddressEmail(true)
      : super.sendAccountActivationEmail(activationLink)
  }

  // Where the link vouched, the event is written already (storeUserAndUserContact).
  public storeUserRegisterEvent(tx?: DrizzleTransaction): Promise<void> {
    return this.vouched ? Promise.resolve() : super.storeUserRegisterEvent(tx)
  }

  public async afterRun(user: DbUser): Promise<void> {
    const { password } = this.user
    if (this.vouched && password) {
      await this.storePassword(user, password)
    }
  }
}
