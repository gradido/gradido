import { SendCoinsArgs, SendCoinsArgsLoggingView } from 'core'
import { User as DbUser, UserLoggingView } from 'database'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

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
        // Brought up to date rather than only complained about. This branch used to warn
        // and leave, so a foreign member who picked a name AFTER their first transfer
        // kept the row they arrived with for good. That was survivable while the mails
        // named people by their real name -- now they name a third party by alias, and an
        // empty one here puts their 36-character identifier in the subject line.
        //
        // An alias the partner community did not send does NOT clear the one on file:
        // silence is "nothing new to say", not "it is gone".
        logger.debug('X-Com: foreignUser exists with a different name or alias, updating:', {
          user: new UserLoggingView(user),
          args: new SendCoinsArgsLoggingView(args),
        })
        if (args.senderUserName !== null) {
          user.firstName = args.senderUserName.slice(0, args.senderUserName.indexOf(' '))
          user.lastName = args.senderUserName.slice(
            args.senderUserName.indexOf(' '),
            args.senderUserName.length,
          )
        }
        if (args.senderAlias) {
          user.alias = args.senderAlias
        }
        await DbUser.save(user)
        logger.debug('X-Com: foreignUser updated:', new UserLoggingView(user))
        return true
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
