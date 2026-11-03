import {
  DBDuplicateEntryError,
  dbFindUserByGradidoId,
  dbInsertForeignUser,
  dbUpdateForeignUserAlias,
  dbUpsertForeignMemberAvatarDates,
} from 'database'
import { getLogger } from 'log4js'
import { UserPublicInfo } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.crossCommunity.storeForeignUser`)

// TODO: add event
export async function storeForeignUser(foreignUser: UserPublicInfo): Promise<void> {
  try {
    const [existingUser, _] = await Promise.all([
      dbFindUserByGradidoId(foreignUser.gradidoId, foreignUser.communityUuid),
      // The recipient's picture date came with the answer to the vote, and that answer was
      // verified with recipientCom's JWT key (processXComPendingSendCoins) -- so the date is
      // filed under recipientCom's uuid, with the id the mirror row was just stored or found
      // under. storeForeignMemberAvatarDate logs a failed write and returns; an answer without
      // the field (a recipient server that does not send it) writes nothing.
      dbUpsertForeignMemberAvatarDates({ ...foreignUser, checkedAt: new Date() }),
    ])
    if (!existingUser) {
      const insertUserResult = await dbInsertForeignUser(foreignUser)
      if (insertUserResult.success) {
        logger.info(`new foreignUser ${insertUserResult.value} inserted`)
      } else {
        logger.error(`error adding foreignUser: ${insertUserResult.error.message}`)
      }
    } else if (existingUser && existingUser.alias !== foreignUser.alias) {
      const result = await dbUpdateForeignUserAlias(existingUser.id, foreignUser.alias)
      if (!result.success && result.error instanceof DBDuplicateEntryError) {
        logger.error(
          `couldn't change foreign user's ${existingUser.id} alias because of duplicate entry`,
        )
      } else {
        logger.info(`updated foreign user's ${existingUser.id} alias`)
      }
    }
  } catch (err) {
    logger.error('error in storeForeignUser;', err)
  }
}
