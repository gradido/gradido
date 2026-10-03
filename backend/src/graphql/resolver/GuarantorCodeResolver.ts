// AI-GENERATED — not an architecture reference
import { GuarantorCode } from '@model/GuarantorCode'
import { dbFindUnconfirmedVouchedAccounts, getHomeCommunity } from 'database'
import { aliasSchema } from 'shared'
import { Authorized, Ctx, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { GUARANTOR_LIMIT, mintGuarantorCode } from '@/data/GuarantorCode.logic'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'

@Resolver()
export class GuarantorCodeResolver {
  /**
   * A fresh guarantor code for the caller (E-017), sealing their user id for this community.
   * No argument: nobody can mint a code in somebody else's name.
   *
   * ⛔ Only a confirmed member vouches (E-018), checked here at once: an account inside its
   * grace period holds every other right (`RESTRICTED_WHILE_UNCONFIRMED` takes hold only after
   * it), and a code of its own would let one unconfirmed account open the next.
   *
   * ⚠️ Only for a member with a user name: the card carries the code on the link of their
   * Gradido address, `/u/<alias>`. And not for a member deleted while still signed in (the
   * session loads deleted users too): the registration does not find them, and refuses the
   * code.
   *
   * Both answer null, not an error: for a member without a user name that is the expected
   * answer on every visit, and the wallet tells it apart from a failure - it shows the card
   * without a code, and offers a new try only after a failure.
   *
   * With the member's own unconfirmed table guests (E-020). Once they are
   * `GUARANTOR_LIMIT` there is no code (E-019): the member sees it here, before a
   * guest scans. `createUser` takes the code and counts again right before it opens an account,
   * one registration after another per member (`inMemberLine`).
   */
  @Authorized([RIGHTS.GUARANTOR_CODE])
  @Query(() => GuarantorCode, { nullable: true })
  async guarantorCode(@Ctx() context: Context): Promise<GuarantorCode | null> {
    const user = getUser(context)
    if (!user.emailContact?.emailChecked) {
      throw new LogError('Confirm your address first')
    }
    if (user.deletedAt || !aliasSchema.safeParse(user.alias).success) {
      return null
    }
    const homeCom = await getHomeCommunity()
    if (!homeCom?.communityUuid) {
      throw new LogError('No home community')
    }
    const unconfirmedGuests = await dbFindUnconfirmedVouchedAccounts(user.id)
    if (unconfirmedGuests.length >= GUARANTOR_LIMIT) {
      return { code: null, alias: user.alias, expiresAt: null, remainingMs: 0, unconfirmedGuests }
    }
    return {
      ...mintGuarantorCode(user.id, homeCom.communityUuid),
      alias: user.alias,
      unconfirmedGuests,
    }
  }
}
