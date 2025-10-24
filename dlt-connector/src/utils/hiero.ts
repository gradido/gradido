import { HieroClient } from '../client/hiero/HieroClient'
import { MIN_TOPIC_EXPIRE_MILLISECONDS_FOR_SEND_MESSAGE } from '../config/const'
import { HieroId } from '../schemas/typeGuard.schema'

/**
 * Checks whether the given topic in the Hedera network will remain open
 * for sending messages for at least `MIN_TOPIC_EXPIRE_MILLISECONDS_FOR_SEND_MESSAGE` milliseconds.
 *
 * @param {HieroId} hieroTopicId - The topic ID to check.
 * @returns {Promise<boolean>} `true` if the topic is still open long enough, otherwise `false`.
 */
export async function isTopicStillOpen(hieroTopicId: HieroId): Promise<boolean> {
  const hieroClient = HieroClient.getInstance()
  const topicInfo = await hieroClient.getTopicInfo(hieroTopicId)
  return (
    topicInfo.expirationTime.getTime() >
    new Date().getTime() + MIN_TOPIC_EXPIRE_MILLISECONDS_FOR_SEND_MESSAGE
  )
}
