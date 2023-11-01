import { Community as DbCommunity } from '@entity/Community'
import { User as DbUser } from '@entity/User'

import { SendCoinsResult } from '@/federation/client/1_0/model/SendCoinsResult'
import { backendLogger as logger } from '@/server/logger'

export async function storeForeignUser(
  recipCom: DbCommunity,
  committingResult: SendCoinsResult,
): Promise<boolean> {
  if (recipCom.communityUuid !== null && committingResult.recipGradidoID !== null) {
    try {
      const user = await DbUser.findOne({
        where: {
          foreign: true,
          communityUuid: recipCom.communityUuid,
          gradidoID: committingResult.recipGradidoID,
        },
      })
      if (!user) {
        logger.debug(
          'X-Com: no foreignUser found for:',
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
        logger.debug('X-Com: new foreignUser inserted:', foreignUser)

        return true
      } else if (
        user.firstName !== committingResult.recipFirstName ||
        user.lastName !== committingResult.recipLastName ||
        user.alias !== committingResult.recipAlias
      ) {
        logger.warn(
          'X-Com: foreignUser still exists, but with different name or alias:',
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
        return true
      } else {
        logger.debug('X-Com: foreignUser still exists...:', user)
        return true
      }
    } catch (err) {
      logger.error('X-Com: error in storeForeignUser;', err)
      return false
    }
  }
  return false
}
