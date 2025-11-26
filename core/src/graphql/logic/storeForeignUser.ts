import { Community as DbCommunity, User as DbUser, findForeignUserByUuids } from 'database'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'
import { SendCoinsResult } from '../../federation/client/1_0/model/SendCoinsResult'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.logic.storeForeignUser`)

export async function storeForeignUser(
  recipCom: DbCommunity,
  committingResult: SendCoinsResult,
): Promise<DbUser | null> {
  if (recipCom.communityUuid !== null && committingResult.recipGradidoID !== null) {
    try {
      const user = await findForeignUserByUuids(
        recipCom.communityUuid,
        committingResult.recipGradidoID,
      )
      if (!user) {
        logger.debug(
          'no foreignUser found for:',
          recipCom.communityUuid,
          committingResult.recipGradidoID,
        )
        let foreignUser = DbUser.create()
        foreignUser.foreign = true
        if (committingResult.recipAlias !== null) {
          foreignUser.alias = committingResult.recipAlias
        }
        foreignUser.communityUuid = recipCom.communityUuid
        if (committingResult.recipFirstName !== null) {
          foreignUser.firstName = committingResult.recipFirstName
        }
        if (committingResult.recipLastName !== null) {
          foreignUser.lastName = committingResult.recipLastName
        }
        foreignUser.gradidoID = committingResult.recipGradidoID
        foreignUser = await DbUser.save(foreignUser)
        logger.debug('new foreignUser inserted:', foreignUser)

        return foreignUser
      } else if (
        user.firstName !== committingResult.recipFirstName ||
        user.lastName !== committingResult.recipLastName ||
        user.alias !== committingResult.recipAlias
      ) {
        logger.warn(
          'foreignUser still exists, but with different name or alias:',
          user,
          committingResult,
        )
        if (committingResult.recipFirstName !== null) {
          user.firstName = committingResult.recipFirstName
        }
        if (committingResult.recipLastName !== null) {
          user.lastName = committingResult.recipLastName
        }
        if (committingResult.recipAlias !== null) {
          user.alias = committingResult.recipAlias
        }
        await DbUser.save(user)
        logger.debug('update recipient successful.', user)
        return user
      } else {
        logger.debug('foreignUser still exists...:', user)
        return user
      }
    } catch (err) {
      logger.error('error in storeForeignUser;', err)
      return null
    }
  }
  return null
}
