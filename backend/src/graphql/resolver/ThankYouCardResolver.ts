// AI-GENERATED — not an architecture reference
import {
  dbBlockThankYouCard,
  dbDeleteThankYouCardSettings,
  dbInsertThankYouCard,
  dbSelectActiveThankYouCard,
  dbSelectThankYouCardSettings,
  dbSelectThankYouCardsByUserId,
  dbUnblockThankYouCard,
  dbUpdateThankYouCardLimits,
  dbUpsertThankYouCardSettings,
  ThankYouCardSelect,
} from 'database'
import { Arg, Args, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import {
  createThankYouCardCode,
  createThankYouCardPinSalt,
  isValidThankYouCardPin,
} from '@/data/ThankYouCard.logic'
import {
  ThankYouCardArgs,
  ThankYouCardLimitsArgs,
  ThankYouCardSettingsArgs,
} from '@/graphql/arg/ThankYouCardSettingsArgs'
import { ThankYouCard } from '@/graphql/model/ThankYouCard'
import { ThankYouCardSettings } from '@/graphql/model/ThankYouCardSettings'
import { SecretKeyCryptographyCreateKey } from '@/password/EncryptorUtils'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'

/**
 * The card of this id, and only if it is the caller's own.
 *
 * "No such card" and "not your card" are folded into ONE answer here, unlike the matching
 * entries next door. That is deliberate and it is the opposite trade: ids are sequential,
 * so telling the two apart would let anybody count other people's cards by walking the
 * numbers. Nothing is lost — a member who reaches for a card that is not theirs is not
 * making a typo, they are probing.
 */
const findOwnCard = async (cardId: number, userId: number): Promise<ThankYouCardSelect> => {
  const cards = await dbSelectThankYouCardsByUserId(userId)
  const card = cards.find((candidate) => candidate.id === cardId)
  if (!card) {
    throw new LogError('ThankYouCard not found', cardId, userId)
  }
  return card
}

@Resolver()
export class ThankYouCardResolver {
  /**
   * The caller's settings, or null when card payment is switched off.
   *
   * Null is the normal answer, not a fault: everybody starts out switched off, and the
   * wallet draws the "not set up yet" panel from exactly this.
   */
  @Authorized([RIGHTS.MANAGE_OWN_THANK_YOU_CARD])
  @Query(() => ThankYouCardSettings, { nullable: true })
  async thankYouCardSettings(@Ctx() context: Context): Promise<ThankYouCardSettings | null> {
    const user = getUser(context)
    const result = await dbSelectThankYouCardSettings(user.id)
    return result.success ? new ThankYouCardSettings(result.value) : null
  }

  /** Every card the caller ever had, blocked ones included — the settings page lists them. */
  @Authorized([RIGHTS.MANAGE_OWN_THANK_YOU_CARD])
  @Query(() => [ThankYouCard])
  async thankYouCards(@Ctx() context: Context): Promise<ThankYouCard[]> {
    const user = getUser(context)
    const cards = await dbSelectThankYouCardsByUserId(user.id)
    return cards.map((card) => new ThankYouCard(card))
  }

  /**
   * Switching card payment on, and changing the PIN later — the same call, because they
   * are the same act. There is no separate "enable" flag to get out of step with.
   */
  @Authorized([RIGHTS.MANAGE_OWN_THANK_YOU_CARD])
  @Mutation(() => ThankYouCardSettings)
  async setThankYouCardSettings(
    @Args() { pin, maxPerPayment, maxPerDay }: ThankYouCardSettingsArgs,
    @Ctx() context: Context,
  ): Promise<ThankYouCardSettings> {
    const user = getUser(context)

    // Checked here and not only in the browser: a rule that lives in the wallet is a
    // suggestion, and this one is part of the security model.
    if (!isValidThankYouCardPin(pin)) {
      throw new LogError('Invalid thank you card pin', user.id)
    }

    // A fresh salt on every write, including a PIN change. Keeping the old one would let
    // anybody who once saw the stored value tell whether the PIN actually changed.
    const pinSalt = createThankYouCardPinSalt()
    const pinHash = await SecretKeyCryptographyCreateKey(pinSalt, pin)

    const written = await dbUpsertThankYouCardSettings({
      userId: user.id,
      pin: pinHash,
      pinSalt,
      maxPerPayment,
      maxPerDay,
    })
    if (!written.success) {
      throw new LogError('Could not save thank you card settings', user.id)
    }

    const result = await dbSelectThankYouCardSettings(user.id)
    if (!result.success) {
      throw new LogError('Thank you card settings vanished right after they were written', user.id)
    }
    return new ThankYouCardSettings(result.value)
  }

  @Authorized([RIGHTS.MANAGE_OWN_THANK_YOU_CARD])
  @Mutation(() => ThankYouCardSettings)
  async setThankYouCardLimits(
    @Args() { maxPerPayment, maxPerDay }: ThankYouCardLimitsArgs,
    @Ctx() context: Context,
  ): Promise<ThankYouCardSettings> {
    const user = getUser(context)

    const written = await dbUpdateThankYouCardLimits(user.id, { maxPerPayment, maxPerDay })
    if (!written.success) {
      throw new LogError('Card payment is not switched on', user.id)
    }

    const result = await dbSelectThankYouCardSettings(user.id)
    if (!result.success) {
      throw new LogError('Thank you card settings vanished right after they were written', user.id)
    }
    return new ThankYouCardSettings(result.value)
  }

  /**
   * Switching card payment off. The cards are left alone on purpose — a member who
   * switches back on later still has their history, and a card that is out there in
   * somebody's drawer stays recognisable rather than turning into an unknown code.
   *
   * ⚠️ It stops working all the same: without settings there is no PIN, and the payment
   * path refuses a card whose owner has none.
   */
  @Authorized([RIGHTS.MANAGE_OWN_THANK_YOU_CARD])
  @Mutation(() => Boolean)
  async deleteThankYouCardSettings(@Ctx() context: Context): Promise<boolean> {
    const user = getUser(context)
    await dbDeleteThankYouCardSettings(user.id)
    return true
  }

  /**
   * A new card. Refused while an unblocked one exists: today a member has exactly one
   * card at a time (PS-021), and the plural in the table comes from blocking, not from
   * printing.
   */
  @Authorized([RIGHTS.MANAGE_OWN_THANK_YOU_CARD])
  @Mutation(() => ThankYouCard)
  async createThankYouCard(
    @Args() { label }: ThankYouCardArgs,
    @Ctx() context: Context,
  ): Promise<ThankYouCard> {
    const user = getUser(context)

    const settings = await dbSelectThankYouCardSettings(user.id)
    if (!settings.success) {
      throw new LogError('Card payment is not switched on', user.id)
    }

    const active = await dbSelectActiveThankYouCard(user.id)
    if (active.success) {
      throw new LogError('There is already an active thank you card', user.id, active.value.id)
    }

    const code = createThankYouCardCode()
    const written = await dbInsertThankYouCard({ userId: user.id, code, label })
    if (!written.success) {
      throw new LogError('Could not create thank you card', user.id)
    }

    const created = await dbSelectActiveThankYouCard(user.id)
    if (!created.success) {
      throw new LogError('Thank you card vanished right after it was written', user.id)
    }
    return new ThankYouCard(created.value)
  }

  /** Losing a card. The row stays, so an old card can still say what happened to it. */
  @Authorized([RIGHTS.MANAGE_OWN_THANK_YOU_CARD])
  @Mutation(() => ThankYouCard)
  async blockThankYouCard(
    @Arg('cardId', () => Int) cardId: number,
    @Ctx() context: Context,
  ): Promise<ThankYouCard> {
    const user = getUser(context)
    const card = await findOwnCard(cardId, user.id)

    const blocked = await dbBlockThankYouCard(card.id, new Date())
    if (!blocked.success) {
      throw new LogError('Thank you card is already blocked', card.id)
    }

    return new ThankYouCard(await findOwnCard(cardId, user.id))
  }

  /**
   * Bringing a card back after three wrong PINs, which is the only way out of that block
   * (PS-018) — and the reason the block can be strict: undoing it needs the one thing a
   * guesser at the counter does not have, the account itself.
   */
  @Authorized([RIGHTS.MANAGE_OWN_THANK_YOU_CARD])
  @Mutation(() => ThankYouCard)
  async unblockThankYouCard(
    @Arg('cardId', () => Int) cardId: number,
    @Ctx() context: Context,
  ): Promise<ThankYouCard> {
    const user = getUser(context)
    const card = await findOwnCard(cardId, user.id)

    const unblocked = await dbUnblockThankYouCard(card.id)
    if (!unblocked.success) {
      throw new LogError('Could not unblock thank you card', card.id)
    }

    return new ThankYouCard(await findOwnCard(cardId, user.id))
  }
}
