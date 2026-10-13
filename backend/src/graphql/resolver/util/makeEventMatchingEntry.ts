// AI-GENERATED — not an architecture reference
import {
  DrizzleTransaction,
  dbFindUsersWithEmailContactByIds,
  dbHasEventMatchingEntry,
  dbInsertMatchingEntry,
  dbSelectMatchingEntriesByUserId,
  dbTakeEventMatchingEntry,
  driverCodeOfFailedQuery,
  drizzleDb,
} from 'database'
import { getLogger } from 'log4js'
import { matchingKeyingRun } from '@/apis/anthropic/matching/keyingRun'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { newMatchingEntryRow, readBackMatchingEntry } from './createMatchingEntryFor'
import { syncMatchingEntryToGms } from './syncMatchingEntryToGms'

const logger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.makeEventMatchingEntry`,
)

// An event link offers an interest -- "I love ‹summary›" --, always.
const EVENT_ENTRY_KIND = 'interest'

/**
 * How long a noted entry waits for the address to be confirmed: thirty days. A registration
 * is confirmed within a day as a rule, and a resent mail within days. What waits longer is no
 * answer to the link any more -- the event is over -- and above all it must not go live years
 * later, with a new password, where making it failed at the confirmation it belonged to.
 */
const EVENT_ENTRY_KEPT_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

// The member's own sentence counts as this one where it has the same words, whatever their
// case and the blanks around them -- the rule the wallet asks by before it opens the form for
// a link (pages/Matching.vue, `sameWords`).
const sameWords = (a: string, b: string): boolean =>
  a.trim().toLowerCase() === b.trim().toLowerCase()

// What is logged of a failure: its driver code or its kind, never the error itself. A failed
// statement carries its parameters in the message, and here those are the words of the entry.
const kindOf = (error: unknown): string =>
  driverCodeOfFailedQuery(error) ?? (error instanceof Error ? error.name : 'unknown')

/**
 * The note becomes the entry, in one transaction: the uuid of the entry, or null where nothing
 * is to be made -- nothing waited, the note was too old, or the member has that very entry
 * already --, or where it could not be made, and the note waits on.
 */
async function entryOfTheNote(userId: number): Promise<string | null> {
  try {
    if (!(await dbHasEventMatchingEntry(userId))) {
      return null
    }
    return await drizzleDb().transaction(async (tx: DrizzleTransaction) => {
      // ⛔ The first statement of the transaction (see dbTakeEventMatchingEntry).
      const noted = await dbTakeEventMatchingEntry(userId, tx)
      if (!noted) {
        return null
      }
      if (Date.now() - noted.createdAt.getTime() > EVENT_ENTRY_KEPT_DAYS * DAY_MS) {
        logger.info(
          `let go the entry an event link noted for user ${userId}: noted more than ${EVENT_ENTRY_KEPT_DAYS} days ago`,
        )
        return null
      }
      // An account a member vouches for can sign in before its address is confirmed, open the
      // link again and save the entry in the form. The note then has nothing left to make.
      const own = await dbSelectMatchingEntriesByUserId(userId, tx)
      if (
        own.some(
          (entry) =>
            entry.active &&
            entry.matchingType === EVENT_ENTRY_KIND &&
            sameWords(entry.summary, noted.summary),
        )
      ) {
        logger.info(`user ${userId} has the entry an event link noted already; the note is let go`)
        return null
      }
      const row = newMatchingEntryRow(userId, {
        matchingType: EVENT_ENTRY_KIND,
        summary: noted.summary,
        details: noted.details,
        remote: noted.remote,
      })
      const inserted = await dbInsertMatchingEntry(row, tx)
      if (!inserted.success) {
        // Thrown, so that the transaction ends with the note still there.
        throw new Error('MatchingEntry not stored')
      }
      return row.uuid
    })
  } catch (error) {
    logger.error(
      `could not make the entry an event link noted for user ${userId}, it waits on:`,
      kindOf(error),
    )
    return null
  }
}

/**
 * What follows the storing of a new entry, as on the member's "save" (createMatchingEntryFor):
 * the GMS is brought in line with it, and the keying run is told.
 *
 * ⛔ The GMS is not waited for. The member's own "save" does wait, with the member in the
 * wallet; here somebody presses "set password", and an event sends many of them within the
 * same hour. Where the GMS is slow or away, the entry is stored all the same, and reaches the
 * GMS with the member's next edit or the next repair run -- as after any hand-over that failed.
 *
 * And it is asked only for a member who takes part. A fresh account does not: the GMS holds
 * nothing of a member who does not take part, and a new entry is nothing it could hold -- the
 * call would only be a delete of what is not there, tried again and again where the GMS is
 * away. The entry reaches the GMS once the member takes part, with all their other entries.
 */
async function handOver(userId: number, uuid: string): Promise<void> {
  try {
    // The member as every hand-over to the GMS reads them, with the address in force. Read
    // here, where there is an entry to hand over, and not for every confirmation.
    const [user] = await dbFindUsersWithEmailContactByIds([userId])
    if (!user) {
      logger.warn(`user ${userId} not found, the entry ${uuid} is not handed to the GMS`)
      return
    }
    if (user.gmsAllowed) {
      const entry = await readBackMatchingEntry(uuid)
      syncMatchingEntryToGms(user, entry).catch((error) =>
        logger.warn(`could not hand the entry ${uuid} to the GMS:`, kindOf(error)),
      )
    }
    matchingKeyingRun.nudge()
  } catch (error) {
    logger.warn(`the entry ${uuid} is stored, but could not be handed on:`, kindOf(error))
  }
}

/**
 * Makes the entry an event link noted at this account, now that its address is confirmed
 * (Event-Matching). The registration brought it along and noted it (RegisterUserRole,
 * `noteEventMatchingEntry`); from here on it is an entry like one the member saved in the
 * wallet -- live, found from afar as the link said, handed to the keying run, and to the GMS
 * once the member takes part.
 *
 * Called at each of the three places an address is confirmed: `setPassword`, the mail of a
 * registration; `confirmEmail`, the mail of an account a member vouched for; and
 * `confirmEmailChange`, where such an account changed its address before it confirmed one.
 * Most accounts have nothing noted, and for them this is one read that finds no row.
 *
 * ⛔ Once. The note is taken away in the same transaction that writes the entry
 * (dbTakeEventMatchingEntry): a second confirmation -- the link of the mail opened again, a
 * password set anew -- finds nothing waiting, also where the member has deleted the entry
 * since. Where writing the entry fails, the note is back with it and waits for a later
 * confirmation of this address (a new password, a changed address) -- thirty days at most
 * (EVENT_ENTRY_KEPT_DAYS); after that it is let go and not made.
 *
 * ⛔ It never throws. The address is confirmed by the time this is called, and nothing that
 * goes wrong here may be read as "the confirmation failed": the member would be sent back to
 * a mail that has done its work.
 */
export async function makeEventMatchingEntry(userId: number): Promise<void> {
  const uuid = await entryOfTheNote(userId)
  if (!uuid) {
    return
  }
  logger.info(`made the entry an event link noted for user ${userId}: ${uuid}`)
  await handOver(userId, uuid)
}
