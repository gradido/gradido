// AI-GENERATED — not an architecture reference

import { sendThankYouCardPaidEmail } from 'core'
import {
  AppDatabase,
  dbBlockThankYouCard,
  dbConsumeThankYouCardPayment,
  dbIncrementFailedAttempts,
  dbInsertThankYouCardPayment,
  dbResetFailedAttempts,
  dbSelectOpenThankYouCardPayment,
  dbSelectThankYouCardByCode,
  dbSelectThankYouCardById,
  dbSelectThankYouCardPayment,
  dbSelectThankYouCardSettings,
  dbSumConsumedThankYouCardPayments,
  User as dbUser,
  MAX_FAILED_ATTEMPTS,
  ThankYouCardSelect,
  ThankYouCardSettingsSelect,
} from 'database'
import { getLogger } from 'log4js'
import { Mutex } from 'redis-semaphore'
import { GradidoUnit } from 'shared'
import { Arg, Args, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  pinMatches,
  startOfDay,
  startOfNextDay,
  THANK_YOU_CARD_PAYMENT_VALID_MINUTES,
} from '@/data/ThankYouCard.logic'
import { ThankYouCardPaymentArgs } from '@/graphql/arg/ThankYouCardSettingsArgs'
import { ThankYouCardPaymentStatus } from '@/graphql/enum/ThankYouCardPaymentStatus'
import { ThankYouCardPayment, ThankYouCardPaymentResult } from '@/graphql/model/ThankYouCardPayment'
import { ThankYouCardPaymentTarget } from '@/graphql/model/ThankYouCardPaymentTarget'
import { SecretKeyCryptographyCreateKey } from '@/password/EncryptorUtils'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { calculateBalance } from '@/util/validate'
import { executeTransaction } from './TransactionResolver'
import { getCommunityName } from './util/communities'

const db = AppDatabase.getInstance()
const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ThankYouCardPaymentResolver`)

/**
 * ⚠️ NOT the lock `executeTransaction` uses. That one is called 'TRANSACTIONS_LOCK', and
 * taking it here would deadlock against the booking we are about to make.
 *
 * Per card rather than global, and that is the right grain anyway: what has to be
 * serialised is the failure counter of ONE card, so that three guesses arriving together
 * cannot all read "no attempts yet". Two different cards have nothing to say to each
 * other.
 */
const cardMutex = (cardId: number) =>
  new Mutex(db.getRedisClient(), `THANK_YOU_CARD_LOCK:${cardId}`)

const failure = (status: ThankYouCardPaymentStatus): ThankYouCardPaymentResult =>
  new ThankYouCardPaymentResult(status)

/** Named from the sender rather than written out again, so the two cannot drift apart. */
type ThankYouCardReceipt = Parameters<typeof sendThankYouCardPaidEmail>[0]

/**
 * Is this card in a state where a payment could happen at all?
 *
 * Deliberately says nothing about WHOSE card it is. The merchant is holding it, so the
 * name is not a secret from them — but they have not proved anything yet, and there is
 * no reason for the server to hand it over before the PIN.
 *
 * The card itself comes back on success, and callers may pass on what is PRINTED on it —
 * today the label, see `ThankYouCardPaymentTarget`. Nothing about its owner.
 */
const checkCard = async (
  code: string,
  recipientId: number,
): Promise<
  | { usable: true; card: ThankYouCardSelect; settings: ThankYouCardSettingsSelect }
  | { usable: false; status: ThankYouCardPaymentStatus }
> => {
  const cardResult = await dbSelectThankYouCardByCode(code)
  if (!cardResult.success) {
    return { usable: false, status: ThankYouCardPaymentStatus.CARD_UNKNOWN }
  }
  const card = cardResult.value

  if (card.blockedAt !== null) {
    return { usable: false, status: ThankYouCardPaymentStatus.CARD_BLOCKED }
  }
  if (card.userId === recipientId) {
    return { usable: false, status: ThankYouCardPaymentStatus.OWN_CARD }
  }

  // Switching card payment off deletes the settings row and leaves the cards alone, so a
  // card whose owner switched off is a card without a PIN. It cannot pay, and saying so
  // is better than asking somebody to type a PIN that cannot be checked against anything.
  const settingsResult = await dbSelectThankYouCardSettings(card.userId)
  if (!settingsResult.success) {
    return { usable: false, status: ThankYouCardPaymentStatus.CARD_NOT_SET_UP }
  }

  return { usable: true, card, settings: settingsResult.value }
}

@Resolver()
export class ThankYouCardPaymentResolver {
  /**
   * What the scanned card is good for, before anybody types anything.
   *
   * The landing page asks this so that a blocked card is caught before the merchant
   * types an amount into it.
   *
   * `checkCard` has the card in its hand already, so the label costs no second query.
   * Why it may be named at all, and only on SUCCESS: see `ThankYouCardPaymentTarget`.
   */
  @Authorized([RIGHTS.RECEIVE_THANK_YOU_CARD_PAYMENT])
  @Query(() => ThankYouCardPaymentTarget)
  async thankYouCardPaymentTarget(
    @Arg('code', () => String) code: string,
    @Ctx() context: Context,
  ): Promise<ThankYouCardPaymentTarget> {
    const recipient = getUser(context)
    const checked = await checkCard(code, recipient.id)
    return checked.usable
      ? new ThankYouCardPaymentTarget(ThankYouCardPaymentStatus.SUCCESS, checked.card.label)
      : new ThankYouCardPaymentTarget(checked.status)
  }

  /**
   * The merchant entered an amount. Nothing is owed yet and nothing is reserved — the
   * request is only a place for the PIN to arrive at.
   *
   * ⚠️ No `holdAvailableAmount` here, unlike a transaction link: a card is permanent, and
   * a card that froze money while a request was open would keep somebody's balance
   * blocked for a mistyped amount. Coverage is checked at the moment of payment instead.
   */
  @Authorized([RIGHTS.RECEIVE_THANK_YOU_CARD_PAYMENT])
  @Mutation(() => ThankYouCardPayment)
  async createThankYouCardPayment(
    @Args() { code, amount, memo }: ThankYouCardPaymentArgs,
    @Ctx() context: Context,
  ): Promise<ThankYouCardPayment> {
    const recipient = getUser(context)

    const checked = await checkCard(code, recipient.id)
    if (!checked.usable) {
      throw new LogError('Thank you card cannot be used', checked.status, code.slice(0, 6))
    }
    // ⚠️ The amount is no longer checked here — `@IsPositiveGradidoUnit` on the args does it
    // now, at the edge, the same way the settings mutation has always done it.

    const validUntil = new Date(Date.now() + THANK_YOU_CARD_PAYMENT_VALID_MINUTES * 60 * 1000)
    const written = await dbInsertThankYouCardPayment({
      cardId: checked.card.id,
      recipientId: recipient.id,
      amount,
      memo,
      validUntil,
    })
    if (!written.success) {
      throw new LogError('Could not create thank you card payment', checked.card.id)
    }

    const created = await dbSelectThankYouCardPayment(written.value)
    if (!created.success) {
      throw new LogError('Payment vanished right after it was written', written.value)
    }
    return new ThankYouCardPayment(created.value)
  }

  /**
   * The PIN arrived. This is the whole payment.
   *
   * ★★★ The order of the last two steps is the design, not an accident: the request is
   * CONSUMED BEFORE the money moves. A TypeORM transaction does not cover Drizzle writes,
   * so the two cannot be made atomic, and of the two possible half-finished states only
   * one is safe — "request used, no money moved" costs a repeat, "money moved, request
   * still open" could be booked twice.
   */
  @Authorized([RIGHTS.RECEIVE_THANK_YOU_CARD_PAYMENT])
  @Mutation(() => ThankYouCardPaymentResult)
  async confirmThankYouCardPayment(
    @Arg('paymentId', () => Int) paymentId: number,
    @Arg('pin', () => String) pin: string,
    @Ctx() context: Context,
  ): Promise<ThankYouCardPaymentResult> {
    const logger = createLogger()
    const recipient = getUser(context)
    const now = new Date()

    // ⛔ The still-OPEN request, not merely the row. Everything below this line has to be
    // out of reach for a request that was already paid or has run out — above all counting
    // a failed PIN attempt against the card. A merchant who was once paid by this card
    // knows a valid payment id, and if wrong PINs still counted on it, they could replay
    // it three times and block their own customer's card for good.
    //
    // ⚠️ This read alone does not settle it, and cannot: the lock is keyed on the CARD, so
    // the card has to be known before it can be taken — which means this answer is already
    // a moment old by the time the lock is held. It is asked again inside. See below.
    const paymentResult = await dbSelectOpenThankYouCardPayment(paymentId, now)
    if (!paymentResult.success) {
      return failure(ThankYouCardPaymentStatus.REQUEST_GONE)
    }
    const payment = paymentResult.value

    // The request belongs to the till it was created at. Without this, anybody could
    // confirm somebody else's open request and have the money land in their own account.
    if (payment.recipientId !== recipient.id) {
      throw new LogError('Payment belongs to another recipient', paymentId, recipient.id)
    }

    let paid: { result: ThankYouCardPaymentResult; receipt: ThankYouCardReceipt } | null = null

    const mutex = cardMutex(payment.cardId)
    await mutex.acquire()
    try {
      // ⛔ Asked again, now that nothing else can be doing anything to this card. The read
      // before the lock had to happen first — it is what names the card the lock is keyed
      // on — and whatever it saw could have changed while we waited at the door: a second
      // call holding the same id can have paid the request in the meantime, and then a
      // wrong PIN arriving here would still be counted against the card. The gate belongs
      // where the counting happens, not one step before it.
      if (!(await dbSelectOpenThankYouCardPayment(payment.id, new Date())).success) {
        return failure(ThankYouCardPaymentStatus.REQUEST_GONE)
      }

      // Read through the request, not through a code the caller sends again: a swapped
      // code must not be able to pay from a different card than the one that was scanned.
      const cardResult = await dbSelectThankYouCardById(payment.cardId)
      if (!cardResult.success) {
        throw new LogError('Payment points at a card that is gone', payment.cardId)
      }
      const card = cardResult.value

      if (card.blockedAt !== null) {
        return failure(ThankYouCardPaymentStatus.CARD_BLOCKED)
      }

      const settingsResult = await dbSelectThankYouCardSettings(card.userId)
      if (!settingsResult.success) {
        return failure(ThankYouCardPaymentStatus.CARD_NOT_SET_UP)
      }
      const settings = settingsResult.value

      // ⚠️ This is the expensive line: argon2id with 32 MiB, and it runs before we know
      // whether the PIN is right. That cost lands on OUR server, which is a second and
      // independent reason for the three-attempt block, next to protecting the account.
      const offered = await SecretKeyCryptographyCreateKey(settings.pinSalt, pin)
      if (!pinMatches(offered, settings.pin)) {
        const counted = await dbIncrementFailedAttempts(card.id)
        if (!counted.success) {
          throw new LogError('Could not count a failed attempt', card.id)
        }
        if (counted.value >= MAX_FAILED_ATTEMPTS) {
          await dbBlockThankYouCard(card.id, now)
          logger.info(`thank you card ${card.id} blocked after ${counted.value} wrong pins`)
          return failure(ThankYouCardPaymentStatus.BLOCKED_NOW)
        }
        const wrong = failure(ThankYouCardPaymentStatus.WRONG_PIN)
        wrong.attemptsLeft = MAX_FAILED_ATTEMPTS - counted.value
        return wrong
      }

      // ⛔ HERE, the moment the PIN is proved right — not after the payment goes through.
      // This counter counts WRONG PINS, and nothing below this line is about the PIN: a
      // limit, a shortfall, a request that ran out, a booking that threw. Standing after
      // any of them, the reset was skipped on every one, so an earlier mistype survived a
      // CORRECT PIN and the next single typo blocked the card — a card its owner can then
      // only unblock by signing into their wallet, which is not something you do at a
      // counter. (Found by the review of 19.08.2026; the comment that used to stand here
      // named this exact rule and then applied it four steps too late.)
      // INJECTED: reset moved back to where it stood before the fix
      // ⛔ Read AGAIN, because the line above this block took about half a second: argon2id
      // with 32 MiB. The card and the settings in hand are from BEFORE that pause, and the
      // four mutations that can change them — blocking, switching card payment off, setting
      // a new PIN, lowering the limits — do not take this card's lock, so they can land in
      // the middle of it. Without this the wallet's promise that a blocked card "cannot pay
      // after this" was untrue for that half second, and lowering a limit did not reach a
      // payment already under way.
      const freshCard = await dbSelectThankYouCardById(card.id)
      if (!freshCard.success || freshCard.value.blockedAt !== null) {
        return failure(ThankYouCardPaymentStatus.CARD_BLOCKED)
      }
      const freshSettings = await dbSelectThankYouCardSettings(card.userId)
      if (!freshSettings.success) {
        return failure(ThankYouCardPaymentStatus.CARD_NOT_SET_UP)
      }
      // ⚠️ A PIN changed under us is NOT a wrong PIN. The hash in hand was derived with the
      // old salt, so re-comparing would fail for the wrong reason and cost an attempt on a
      // card whose owner just did the right thing. Deriving again would cost another half
      // second on our server. The request simply no longer applies.
      if (
        freshSettings.value.pin !== settings.pin ||
        freshSettings.value.pinSalt !== settings.pinSalt
      ) {
        return failure(ThankYouCardPaymentStatus.REQUEST_GONE)
      }
      const limits = freshSettings.value

      // Limits are checked only now, after the PIN. Before it, nobody has proved they
      // hold this card, and a limit is a property of somebody's account -- there is no
      // reason to tell an unproven caller what it is.
      if (payment.amount.comparedTo(limits.maxPerPayment) > 0) {
        return failure(ThankYouCardPaymentStatus.LIMIT_PER_PAYMENT_EXCEEDED)
      }
      // ⚠️ Against the day the request was CREATED, not the day it is being confirmed.
      // The fifteen minutes a request stays payable can cross midnight, and one created at
      // 23:58 was still open when its own day ended — counted by the confirming day it
      // would fall between the two and be free, which is enough to spend a whole daily
      // limit twice within a few minutes.
      const spentThatDay = await dbSumConsumedThankYouCardPayments(
        card.id,
        startOfDay(payment.createdAt),
        startOfNextDay(payment.createdAt),
      )
      if (spentThatDay.add(payment.amount).comparedTo(limits.maxPerDay) > 0) {
        return failure(ThankYouCardPaymentStatus.LIMIT_PER_DAY_EXCEEDED)
      }

      const owner = await dbUser.findOne({
        where: { id: card.userId },
        relations: ['emailContact'],
      })
      if (!owner) {
        throw new LogError('Thank you card has no owner', card.id, card.userId)
      }

      // Checked here rather than left to executeTransaction, which throws for it: a
      // shortfall is an expected answer the merchant's screen has to show, and matching
      // on a thrown message to tell it apart from a real fault would be guesswork.
      const covered = await calculateBalance(owner.id, payment.amount.negated(), now)
      if (!covered) {
        return failure(ThankYouCardPaymentStatus.NOT_ENOUGH_GDD)
      }

      // ★★★ Consume first. See the comment on this method.
      const consumed = await dbConsumeThankYouCardPayment(payment.id, now)
      if (!consumed.success) {
        return failure(ThankYouCardPaymentStatus.REQUEST_GONE)
      }

      await dbResetFailedAttempts(card.id)
      await executeTransaction(payment.amount, payment.memo, owner, recipient, logger)

      const success = failure(ThankYouCardPaymentStatus.SUCCESS)
      success.payerName = `${owner.firstName} ${owner.lastName}`
      success.amount = payment.amount

      // Assembled here, where the data is, and SENT after the lock is gone. See below.
      paid = {
        result: success,
        receipt: {
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.emailContact.email,
          language: owner.language,
          recipientName: `${recipient.firstName} ${recipient.lastName}`,
          recipientCommunity: await getCommunityName(recipient.communityUuid),
          transactionMemo: payment.memo,
          transactionAmount: payment.amount,
          cardLabel: card.label,
          cardId: card.id,
        },
      }
    } finally {
      await mutex.release()
    }

    // The receipt, and it is part of the security model rather than a courtesy: the limits
    // cap what one DAY can cost, and only somebody who notices and blocks turns that into a
    // cap for good.
    //
    // ⚠️ Sent with the card's lock already given back. Inside it, a mail server having a
    // slow minute would hold up every further payment with the SAME card — the customer
    // standing at the next till waits for somebody else's SMTP.
    //
    // ⚠️ Awaited but not allowed to undo anything. The money has moved and the request is
    // consumed; a bad minute at the mail server must not turn that into an error the
    // merchant sees, and there is nothing left to roll back anyway.
    try {
      await sendThankYouCardPaidEmail(paid.receipt)
    } catch (error) {
      logger.error('could not send the thank you card receipt', error)
    }

    return paid.result
  }
}
