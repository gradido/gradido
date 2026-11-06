import {
  DbUser,
  dbFindLastTransactionBalance,
  dbUpsertForeignMemberAvatarDates,
  dbUpsertForeignUser,
  foreignMemberAvatarDateSelectSchema,
  TransactionLinksSelect,
  User,
} from 'database'
import { getLogger } from 'log4js'
import {
  Decay,
  GradidoUnit,
  InsufficientBalance,
  Result,
  ResultNoError,
  UserPublicInfo,
} from 'shared'
import * as v from 'valibot'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'
import { transactionLinksDecayed } from './transactionLinksDecayed'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.logic.user`)

export type UserBalance = {
  balance: GradidoUnit
  decay: Decay
  lastTransactionId: number | null
}

export async function calculateSenderBalance(
  userId: number,
  amount: GradidoUnit,
  time: Date,
  transactionLink?: TransactionLinksSelect,
): Promise<Result<UserBalance, InsufficientBalance>> {
  // let's start this function as early as possible because it is expensive
  const blockedByLinksDecayedPromise = transactionLinksDecayed(userId, time)
  const lastTransaction = await dbFindLastTransactionBalance(userId)
  if (!lastTransaction) {
    return {
      success: false,
      error: new InsufficientBalance(userId, GradidoUnit.fromGradidoCent(0n), amount),
    }
  }
  // TODO: remove after make balance column not null in db
  if (!lastTransaction.balance) {
    throw new Error('Empty balance in transaction')
  }
  const decay = lastTransaction.balance.calculateDecay(lastTransaction.balanceDate, time)

  // If we want to redeem a link we need to make sure that the link amount is not considered as blocked
  const releasedLinkAmount =
    transactionLink && transactionLink.holdAvailableAmount
      ? transactionLink.holdAvailableAmount
      : new GradidoUnit(0n)

  // subtract from sender account
  const balance = decay.balance.subtract(amount)
  const { sumHoldAvailableDecayedAmount } = await blockedByLinksDecayedPromise
  const availableBalanceAfterSend = balance
    .subtract(sumHoldAvailableDecayedAmount)
    .add(releasedLinkAmount)
  if (availableBalanceAfterSend.isNegative()) {
    return {
      success: false,
      error: new InsufficientBalance(userId, availableBalanceAfterSend, amount),
    }
  }
  return { success: true, value: { balance, lastTransactionId: lastTransaction.id, decay } }
}

export async function calculateRecipientBalance(
  userId: number,
  amount: GradidoUnit,
  time: Date,
): Promise<UserBalance> {
  const lastTransaction = await dbFindLastTransactionBalance(userId)
  if (!lastTransaction) {
    return {
      balance: amount,
      lastTransactionId: null,
      decay: {
        balance: amount,
        decay: GradidoUnit.fromGradidoCent(0n),
        start: null,
        end: null,
        duration: null,
      },
    }
  }
  // TODO: remove after make balance column not null in db
  if (!lastTransaction.balance) {
    throw new Error('Empty balance in transaction')
  }
  const decay = lastTransaction.balance.calculateDecay(lastTransaction.balanceDate, time)

  // recipient, add to his account
  const balance = decay.balance.add(amount)
  return { balance, lastTransactionId: lastTransaction.id, decay }
}

export async function storeForeignUser(
  foreignUser: UserPublicInfo,
): Promise<ResultNoError<number>> {
  try {
    const [existingUserResult, _] = await Promise.all([
      dbUpsertForeignUser(foreignUser),
      // The recipient's picture date came with the answer to the vote, and that answer was
      // verified with recipientCom's JWT key (processXComPendingSendCoins) -- so the date is
      // filed under recipientCom's uuid, with the id the mirror row was just stored or found
      // under. storeForeignMemberAvatarDate logs a failed write and returns; an answer without
      // the field (a recipient server that does not send it) writes nothing.
      dbUpsertForeignMemberAvatarDates([
        v.parse(foreignMemberAvatarDateSelectSchema, { ...foreignUser, checkedAt: new Date() }),
      ]),
    ])
    if (!existingUserResult.success) {
      // warn instead of error, because input data came from outside
      logger.warn(`couldn't upsert foreign user: ${existingUserResult.error.message}`)
      return { success: false }
    }
    return { success: true, value: existingUserResult.value }
  } catch (err) {
    logger.error('error in storeForeignUser;', err)
  }
  return { success: false }
}

/**
 * Which of the two user shapes this is: the TypeORM entity, or a Drizzle `users` row.
 *
 * ⛔ Asked STRUCTURALLY, by the property that differs, and not with `instanceof User`.
 * That distinction is the whole reason this function exists rather than the one-liner at
 * each call site. Plenty of the entity-shaped users in this house are object literals cast
 * to `User` and never constructed through it -- the community's stand-in
 * (`util/communityUser.ts`) is one in PRODUCTION code, and the test fixtures are full of
 * them. `instanceof` reads every one of those as a Drizzle row, takes the other branch,
 * and finds `undefined` there: the stand-in lost its gradidoID that way, and it is the
 * linkedUser on every CREATION row of every booking list, where the field is `String!`.
 *
 * Nothing is lost against `instanceof`: a real Drizzle row has no `gradidoID` at all, and
 * an entity that has none was loaded without it, in which case neither branch has an id
 * to give.
 */
export const isLegacyUser = (user: User | DbUser): user is User =>
  (user as User).gradidoID !== undefined

/**
 * The member's gradido id, whichever of the two shapes is in hand.
 *
 * The TypeORM entity spells it `gradidoID`, a Drizzle `users` row spells it `gradidoId`,
 * and while the translation is under way a good many functions have to take either. Every
 * one of them needs this one line, and getting it wrong is silent: the property is simply
 * `undefined`, which then travels on as a salt, a HumHub username or a token payload.
 *
 * ⛔ To be deleted together with the entity, not extended. One place to look for when the
 * last `User` is gone.
 */
export const gradidoIdOf = (user: User | DbUser): string =>
  isLegacyUser(user) ? user.gradidoID : user.gradidoId
