// AI-GENERATED — not an architecture reference
import { SetTransactionReactionArgs } from '@arg/SetTransactionReactionArgs'
import { databaseErrorCode } from 'core'
import {
  dbDeleteTransactionReaction,
  dbSelectReceivedTransferOfUser,
  dbUpsertTransactionReaction,
} from 'database'
import { getLogger } from 'log4js'
import { Args, Authorized, Ctx, Mutation, Resolver } from 'type-graphql'
import * as v from 'valibot'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { chatReactionEmojiSchema } from '@/data/ChatReaction.schema'
import { TRANSACTION_REACTIONS_MAX_PER_REQUEST } from '@/data/TransactionReaction.logic'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'

const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.TransactionReactionResolver`)

/**
 * Reacting to a transfer (Bernd, 11.10.2026): whoever received a transfer answers it with an
 * emoji, and the two the transfer is between see it with the booking -- in their booking lists
 * and in their conversation, where the lists show it (`Transaction.reaction`).
 */
@Resolver()
export class TransactionReactionResolver {
  /**
   * Sets the caller's reaction to a transfer they received, or takes it back (`emoji` absent),
   * and answers the emoji that stands at the transfer then -- null where none does. One reaction
   * a transfer: another emoji takes the place of the one before. Taking back where there is none
   * changes nothing.
   *
   * ⛔ Only the recipient reacts: the transfer is named by the id of the caller's OWN RECEIVE
   * booking, and the one query that reads it says whether it is that
   * (dbSelectReceivedTransferOfUser). The sender, who holds the transfer as a SEND row, and
   * everybody else get the same refusal as for an id without a booking.
   *
   * No mail goes out about a reaction, and the sender is told nothing until their list or
   * their conversation is read again.
   *
   * Behind REACT_TO_TRANSACTION, which an account with an unconfirmed address loses with the
   * rights that act outward. Taking a reaction back is behind it too -- the mutation is one.
   *
   * Refused as TRANSACTION_REACTION_NOT_SET with the reason, before anything is written:
   * - UNKNOWN_EMOJI: not one of the wallet's forty-eight (chatReactionEmojiSchema);
   * - UNKNOWN_TRANSFER: no booking with that id that is a transfer the caller received;
   * - OTHER_COMMUNITY: a transfer from a member of another community. Their server holds its
   *   own row of the transfer, and a reaction has no way there yet: set here alone, only one of
   *   the two would see it.
   *
   * And NOT_STORED where the database failed.
   *
   * The log gets the booking's id and whether a reaction was set or taken back, never the
   * emoji. The request log leaves it out as well, by the variable's name (`$emoji` in
   * filterVariables) -- the wallet's document is held to that name. Only at trace level, where
   * the server writes down whole answers, this one stands among them.
   */
  @Authorized([RIGHTS.REACT_TO_TRANSACTION])
  @Mutation(() => String, { nullable: true })
  async setTransactionReaction(
    @Args() { transactionId, emoji }: SetTransactionReactionArgs,
    @Ctx() context: Context,
  ): Promise<string | null> {
    // ⛔ Counted in the HTTP request's budget before anything is looked up: a document may repeat
    // this field under any number of aliases (RequestBudget in server/context.ts).
    context.requestBudget.transactionReactionsSet += 1
    const count = context.requestBudget.transactionReactionsSet
    if (count > TRANSACTION_REACTIONS_MAX_PER_REQUEST) {
      throw new LogError('Too many transaction reactions set at once', count)
    }
    const user = getUser(context)
    const reaction = emoji ?? null
    if (reaction !== null && !v.safeParse(chatReactionEmojiSchema, reaction).success) {
      throw new LogError('TRANSACTION_REACTION_NOT_SET: UNKNOWN_EMOJI', transactionId)
    }
    try {
      const received = await dbSelectReceivedTransferOfUser(transactionId, user.id)
      if (!received.success) {
        throw new LogError('TRANSACTION_REACTION_NOT_SET: UNKNOWN_TRANSFER', transactionId)
      }
      if (!received.value.senderIsMemberHere) {
        throw new LogError('TRANSACTION_REACTION_NOT_SET: OTHER_COMMUNITY', transactionId)
      }
      // A booking is history: whose it is and what kind it is cannot change between the read
      // above and this write.
      if (reaction === null) {
        await dbDeleteTransactionReaction(received.value.id)
      } else {
        await dbUpsertTransactionReaction(received.value.id, reaction)
      }
    } catch (error) {
      if (error instanceof LogError) {
        throw error
      }
      // The driver's code, never the error: the message of a failed Drizzle query carries the
      // statement and its values.
      throw new LogError(
        'TRANSACTION_REACTION_NOT_SET: NOT_STORED',
        transactionId,
        databaseErrorCode(error),
      )
    }
    createLogger().info(
      `transaction reaction ${reaction === null ? 'taken back' : 'set'}: transaction_id=${transactionId}`,
    )
    return reaction
  }
}
