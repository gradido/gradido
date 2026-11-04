// AI-GENERATED — not an architecture reference
import { dbSelectReceivedTransferOfUser, driverCodeOfFailedQuery } from 'database'
import { Logger } from 'log4js'

/**
 * The received thank-you a transfer passes on (the trail, migration 0166): the id the wallet
 * named in `passOnOf`, where it is the sender's OWN RECEIVE booking of a transfer -- asked the
 * way a reaction asks it (dbSelectReceivedTransferOfUser). Null where none was named, and where
 * the id is anything else: that is dropped with a line in the log, and the transfer goes out
 * without a trail.
 *
 * ⛔ Never throws: the trail must not stop a thank-you. A read that fails drops it as well.
 *
 * One read more, and only for a transfer that names a thank-you. The insert of the trail could
 * ask the same in one statement with it; it does not, so that whose thank-you a booking is stays
 * decided in the one query that decides it for a reaction too, and the insert stays a plain one.
 */
export async function acceptedPassOnOrigin(
  passOnOf: number | null | undefined,
  senderUserId: number,
  logger: Logger,
): Promise<number | null> {
  if (!passOnOf) {
    return null
  }
  try {
    const received = await dbSelectReceivedTransferOfUser(passOnOf, senderUserId)
    if (received.success) {
      return received.value.id
    }
    logger.warn('passOnOf dropped: UNKNOWN_TRANSFER', passOnOf)
  } catch (error) {
    // The driver's code, never the error: the message of a failed Drizzle query carries the
    // statement and its parameters.
    logger.error('passOnOf dropped: NOT_READ', passOnOf, driverCodeOfFailedQuery(error))
  }
  return null
}
