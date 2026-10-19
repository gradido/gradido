// AI-GENERATED — not an architecture reference

import { GuarantorCode } from '@model/GuarantorCode'
import {
  dbFindUnconfirmedVouchedAccounts,
  dbInsertEvent,
  EventType,
  getHomeCommunity,
} from 'database'
import { aliasSchema } from 'shared'
import { Authorized, Ctx, Query, Resolver } from 'type-graphql'
import * as v from 'valibot'
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
   * Gradido address, `/u/<alias>`.
   *
   * That answers null, not an error: for a member without a user name it is the expected
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
    if (!v.safeParse(aliasSchema, user.alias).success) {
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
    const minted = mintGuarantorCode(user.id, homeCom.communityUuid)
    // A query that writes, on purpose: the minting is the event (GUARANTOR_CODE_SHOW, for the
    // community figures). Every code minted here is one the member was shown -- the page asks
    // when it opens (the door that holds the code is open on arrival), on "show a new code", and
    // on "no phone with you?", which hands the code to the guest's form. No code, no row: none at
    // the limit, none without a user name (both answered above).
    await dbInsertEvent({
      type: EventType.GUARANTOR_CODE_SHOW,
      affectedUserId: user.id,
      actingUserId: user.id,
    })
    return { ...minted, alias: user.alias, unconfirmedGuests }
  }
}
