import { dbFindOpenTransactionLinkWithCreatorByCode, getHomeCommunityDrizzle } from 'database'
import { status } from 'elysia'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'
import { ApiClientCompleted } from '../ApiClient'
import { DisburseTransactionLinkWire } from '../schema'
import { processXComCompleteTransaction } from './senderSide'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.crossCommunity.transferCoins.disburse`)

/**
 * Pays a link of this community out to a member of the calling one: the caller sends the link
 * and the member who accepted it, everything else comes from the link, and the transfer runs as
 * any other from this community (processXComCompleteTransaction).
 *
 * The caller names only a member of its own: it is the community the member is signed in at.
 */
export async function disburseTransactionLink({
  body: { link, recipient },
  senderClient,
}: {
  body: DisburseTransactionLinkWire
  senderClient: ApiClientCompleted
}) {
  if (recipient.communityUuid !== senderClient.communityUuid) {
    logger.debug(
      `${senderClient.communityUuid} asks to pay out to a member of ${recipient.communityUuid}`,
    )
    return status('Unauthorized')
  }
  const homeCom = await getHomeCommunityDrizzle()
  if (link.communityUuid !== homeCom.communityUuid) {
    logger.debug(`a link of another community: ${link.communityUuid}`)
    return status('Unauthorized')
  }

  const transactionLink = await dbFindOpenTransactionLinkWithCreatorByCode(link.code)
  if (!transactionLink) {
    return status('Not Found')
  }
  try {
    return await processXComCompleteTransaction(
      transactionLink.creator,
      recipient.communityUuid,
      recipient.identifier,
      // amount_gdd4 is filled for every link since migration 0102
      transactionLink.link.amount!,
      transactionLink.link.memo,
      transactionLink.link,
    )
  } catch (err) {
    return status('Internal Server Error', err instanceof Error ? err.message : String(err))
  }
}
