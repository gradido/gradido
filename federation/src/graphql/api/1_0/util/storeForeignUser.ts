import { User as DbUser, UserLoggingView } from 'database'

import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { SendCoinsArgsLoggingView } from '../logger/SendCoinsArgsLogging.view'
import { SendCoinsArgs } from '../model/SendCoinsArgs'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.util.storeForeignUser`)

export async function storeForeignUser(args: SendCoinsArgs): Promise<boolean> {
  if (args.senderCommunityUuid !== null && args.senderUserUuid !== null) {
    try {
      const user = await DbUser.findOne({
        where: {
          foreign: true,
          communityUuid: args.senderCommunityUuid,
          gradidoID: args.senderUserUuid,
        },
      })
      if (!user) {
        logger.debug(
          'X-Com: no foreignUser found for:',
          args.senderCommunityUuid,
          args.senderUserUuid,
        )
        let foreignUser = DbUser.create()
        foreignUser.foreign = true
        if (args.senderAlias) {
          foreignUser.alias = args.senderAlias
        }
        foreignUser.communityUuid = args.senderCommunityUuid
        if (args.senderUserName !== null) {
          foreignUser.firstName = args.senderUserName.slice(0, args.senderUserName.indexOf(' '))
          foreignUser.lastName = args.senderUserName.slice(
            args.senderUserName.indexOf(' '),
            args.senderUserName.length,
          )
        }
        foreignUser.gradidoID = args.senderUserUuid
        foreignUser = await DbUser.save(foreignUser)
        logger.debug('X-Com: new foreignUser inserted:', new UserLoggingView(foreignUser))

        return true
      } else if (
        user.firstName !== args.senderUserName.slice(0, args.senderUserName.indexOf(' ')) ||
        user.lastName !==
          args.senderUserName.slice(args.senderUserName.indexOf(' '), args.senderUserName.length) ||
        user.alias !== args.senderAlias
      ) {
        logger.warn('X-Com: foreignUser still exists, but with different name or alias:', {
          user: new UserLoggingView(user),
          args: new SendCoinsArgsLoggingView(args),
        })
        return false
      } else {
        logger.debug('X-Com: foreignUser still exists...:', new UserLoggingView(user))
        return true
      }
    } catch (err) {
      logger.error('X-Com: error in storeForeignUser;', err)
      return false
    }
  }
  return false
}
