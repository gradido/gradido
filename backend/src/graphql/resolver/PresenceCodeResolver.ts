// AI-GENERATED — not an architecture reference
import { PresenceCode } from '@model/PresenceCode'
import { dbFindUnconfirmedVouchedAccounts, getHomeCommunity } from 'database'
import { aliasSchema } from 'shared'
import { Authorized, Ctx, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { mintPresenceCode, PRESENCE_MAX_UNCONFIRMED } from '@/data/PresenceCode.logic'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'

@Resolver()
export class PresenceCodeResolver {
  /**
   * A fresh table code for the caller (E-017), bound to their user name and this community.
   * No argument: nobody can mint a code in somebody else's name.
   *
   * ⛔ Only a confirmed member vouches (E-018), checked here at once: an account inside its
   * grace period holds every other right (`RESTRICTED_WHILE_UNCONFIRMED` takes hold only after
   * it), and a code of its own would let one unconfirmed account open the next.
   *
   * ⚠️ Only for a user name that `registerAccount` accepts as a referrer (`aliasSchema`). For
   * any other name the guest would get a password while the member who vouched for them is
   * not recorded as their referrer. And not for a member deleted while still signed in (the
   * session loads deleted users too): `registerAccount` does not find them, so their guests
   * would get a password with nobody recorded as having vouched.
   *
   * Both answer null, not an error: for a member without a user name that is the expected
   * answer on every visit, and the wallet tells it apart from a failure - it shows the card
   * without a code, and offers a new try only after a failure.
   *
   * With the member's own unconfirmed table guests (E-020). Once they are
   * `PRESENCE_MAX_UNCONFIRMED` there is no code (E-019): the member sees it here, before a
   * guest scans. `createUser` takes the code and counts again right before it opens an account,
   * one registration after another per member (`inMemberLine`).
   */
  @Authorized([RIGHTS.PRESENCE_CODE])
  @Query(() => PresenceCode, { nullable: true })
  async presenceCode(@Ctx() context: Context): Promise<PresenceCode | null> {
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
    if (unconfirmedGuests.length >= PRESENCE_MAX_UNCONFIRMED) {
      return { code: null, alias: user.alias, expiresAt: null, remainingMs: 0, unconfirmedGuests }
    }
    return {
      ...mintPresenceCode(user.alias, homeCom.communityUuid),
      alias: user.alias,
      unconfirmedGuests,
    }
  }
}
