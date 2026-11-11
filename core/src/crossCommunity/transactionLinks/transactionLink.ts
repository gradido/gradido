// AI-GENERATED — not an architecture reference
import { dbFindMemberAvatarsSmall, dbFindTransactionLinkForCodeHolder } from 'database'
import { status } from 'elysia'
import { getLogger } from 'log4js'
import * as v from 'valibot'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'
import { databaseErrorCode } from '../../logic/ChatMessage.logic'
import { showsSenderAvatar } from '../../logic/SenderAvatar.logic'
import { thankYouGreetingPictureForCode } from '../../logic/ThankYouGreetingPicture.logic'
import { TransactionLinkQuestion, transactionLinkWireSchema } from '../schema'

const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.crossCommunity.transactionLinks.transactionLink`)

/**
 * A link of this community, for the page another community shows to its member who holds the
 * code: what this community's own page shows of it to whoever holds the code (backend
 * queryTransactionLink), under the same rules -- no greeting of a deleted link, the maker's face
 * and the greeting's photo of an open link only. `404` for an unknown code, and where the maker's
 * account is deleted.
 *
 * The face and the photo are one part of the answer: where one cannot be read, the link comes
 * without it. What is logged of such a failure is the driver's code alone -- the message of a
 * failed query carries its parameters, the code among them.
 */
export async function transactionLink({ body }: { body: TransactionLinkQuestion }) {
  const found = await dbFindTransactionLinkForCodeHolder(body.code)
  if (!found) {
    return status('Not Found', 'Transaction link not found')
  }
  const { link, maker, greeting } = found
  const now = new Date()
  const unread = (what: string) => (error: unknown) => {
    createLogger().error(`${what} not read (${databaseErrorCode(error)})`)
    return null
  }
  const senderAvatar = showsSenderAvatar(link, null, now)
    ? await dbFindMemberAvatarsSmall([maker.gradidoId])
        .then(
          (rows) =>
            rows.find((row) => row.communityUuid === maker.communityUuid)?.avatarSmall ?? null,
        )
        .catch(unread('sender avatar'))
    : null
  const shownGreeting = link.deletedAt ? null : greeting
  // a greeting carries a photo where it has no motif
  const picture =
    shownGreeting && shownGreeting.motif === null
      ? await thankYouGreetingPictureForCode(link.code, now).catch(unread('greeting picture'))
      : null
  return v.parse(transactionLinkWireSchema, {
    ...link,
    sender: maker,
    greeting: shownGreeting,
    senderAvatar: senderAvatar?.toString('base64') ?? null,
    picture: picture?.toString('base64') ?? null,
  })
}
