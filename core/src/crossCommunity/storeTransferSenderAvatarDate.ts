import { dbUpsertForeignMemberAvatarDates } from 'database'
import { getLogger } from 'log4js'
import { avatarDateSchema } from 'shared'
import * as v from 'valibot'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'

const logger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.crossCommunity.storeTransferSenderAvatarDate`,
)

export async function storeForeignMemberAvatarDate(
  communityUuid: string | null,
  gradidoId: unknown,
  value: unknown,
): Promise<void> {
  if (!communityUuid || typeof gradidoId !== 'string') {
    logger.debug('picture date of a member of another community without a pair to file it under')
    return
  }
  const avatarUpdatedAt = v.parse(avatarDateSchema, value)
  if (!avatarUpdatedAt) {
    if (value !== undefined && value !== null) {
      logger.warn(
        'unusable picture date of a member of another community discarded',
        typeof value === 'string' ? value.slice(0, 64) : typeof value,
      )
    }
    return
  }
  try {
    await dbUpsertForeignMemberAvatarDates([
      { communityUuid, gradidoId, avatarUpdatedAt, checkedAt: new Date() },
    ])
  } catch (err) {
    logger.warn('picture date of a member of another community not stored', err)
  }
}
