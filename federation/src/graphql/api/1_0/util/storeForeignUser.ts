import { User as DbUser } from '@entity/User'

import { federationLogger as logger } from '@/server/logger'
import { SendCoinsArgs } from '../model/SendCoinsArgs'

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
        console.log(
          'X-Com: no foreignUser found for:',
          args.senderCommunityUuid,
          args.senderUserUuid,
        )
        let foreignUser = DbUser.create()
        foreignUser.foreign = true
        if (args.senderAlias !== null) {
          foreignUser.alias = args.senderAlias
        }
        foreignUser.communityUuid = args.senderCommunityUuid
        if (args.senderUserName !== null) {
          foreignUser.firstName = args.senderUserName.slice(0, args.senderUserName.indexOf(' '))
          foreignUser.firstName = args.senderUserName.slice(
            args.senderUserName.indexOf(' '),
            args.senderUserName.length,
          )
        }
        foreignUser.gradidoID = args.senderUserUuid
        foreignUser = await DbUser.save(foreignUser)
        logger.debug('X-Com: new foreignUser inserted:', foreignUser)
        console.log('X-Com: new foreignUser inserted:', foreignUser)

        return true
      } else if (
        user.firstName !== args.senderUserName.slice(0, args.senderUserName.indexOf(' ')) ||
        user.lastName !==
          args.senderUserName.slice(args.senderUserName.indexOf(' '), args.senderUserName.length) ||
        user.alias !== args.senderAlias
      ) {
        logger.warn(
          'X-Com: foreignUser still exists, but with different name or alias:',
          user,
          args,
        )
        console.log(
          'X-Com: foreignUser still exists, but with different name or alias:',
          user,
          args,
        )
        return false
      } else {
        logger.debug('X-Com: foreignUser still exists...:', user)
        console.log('X-Com: foreignUser still exists...:', user)
        return true
      }
    } catch (err) {
      logger.error('X-Com: error in storeForeignUser;', err)
      console.log('X-Com: error in storeForeignUser;', err)
      return false
    }
  }
  return false
}
