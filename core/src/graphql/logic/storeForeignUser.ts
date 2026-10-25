import {
  AccountState,
  Community as DbCommunity,
  User as DbUser,
  findForeignUserByUuids,
  UserLoggingView,
} from 'database'
import { getLogger } from 'log4js'
import { SendCoinsResult } from '../../apis'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'

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
        // A row without an alias cannot be filed: `users.alias` is NOT NULL (migration 0164),
        // and the recipient's community, which runs that migration too, sends it. An answer
        // without one is already turned away before anything settles
        // (processXComPendingSendCoins); this is the guard the type still asks for.
        if (!committingResult.recipAlias) {
          logger.error(
            'recipient came without an alias, not stored as foreign user:',
            recipCom.communityUuid,
            committingResult.recipGradidoID,
          )
          return null
        }
        let foreignUser = DbUser.create()
        foreignUser.foreign = true
        foreignUser.accountState = AccountState.FOREIGN
        foreignUser.alias = committingResult.recipAlias
        foreignUser.communityUuid = recipCom.communityUuid
        if (committingResult.recipFirstName !== null) {
          foreignUser.firstName = committingResult.recipFirstName
        }
        if (committingResult.recipLastName !== null) {
          foreignUser.lastName = committingResult.recipLastName
        }
        foreignUser.gradidoID = committingResult.recipGradidoID
        foreignUser = await DbUser.save(foreignUser)

        logger.debug('new foreignUser inserted:', new UserLoggingView(foreignUser))
        /*
        if (committingResult.recipEmail !== null) {
          let foreignUserEmail = DbUserContact.create()
          foreignUserEmail.email = committingResult.recipEmail!
          foreignUserEmail.emailChecked = true
          foreignUserEmail.user = foreignUser
          foreignUserEmail = await DbUserContact.save(foreignUserEmail)
          logger.debug(
            'new foreignUserEmail inserted:',
            new UserContactLoggingView(foreignUserEmail),
          )
          foreignUser.emailContact = foreignUserEmail
          foreignUser.emailId = foreignUserEmail.id
          foreignUser = await DbUser.save(foreignUser)
        }
        */
        return foreignUser
      } else if (
        user.firstName !== committingResult.recipFirstName ||
        user.lastName !== committingResult.recipLastName ||
        user.alias !== committingResult.recipAlias /* ||
        (user.emailContact === null && committingResult.recipEmail !== null) ||
        (user.emailContact !== null &&
          user.emailContact?.email !== null &&
          user.emailContact?.email !== committingResult.recipEmail)
          */
      ) {
        logger.debug(
          'foreignUser still exists, but with different name or alias:',
          new UserLoggingView(user),
          committingResult,
        )
        if (committingResult.recipFirstName !== null) {
          user.firstName = committingResult.recipFirstName
        }
        if (committingResult.recipLastName !== null) {
          user.lastName = committingResult.recipLastName
        }
        // An alias the partner did not send is not a difference, and never clears the one on
        // file: a row without one cannot be stored.
        if (committingResult.recipAlias) {
          user.alias = committingResult.recipAlias
        }
        /*
        if (!user.emailContact && committingResult.recipEmail !== null) {
          logger.debug(
            'creating new userContact:',
            new UserContactLoggingView(user.emailContact),
            committingResult,
          )
          let foreignUserEmail = DbUserContact.create()
          foreignUserEmail.type = UserContactType.USER_CONTACT_EMAIL
          foreignUserEmail.email = committingResult.recipEmail!
          foreignUserEmail.emailChecked = true
          foreignUserEmail.user = user
          foreignUserEmail.userId = user.id
          foreignUserEmail = await DbUserContact.save(foreignUserEmail)
          logger.debug(
            'new foreignUserEmail inserted:',
            new UserContactLoggingView(foreignUserEmail),
          )
          user.emailContact = foreignUserEmail
          user.emailId = foreignUserEmail.id
        } else if (user.emailContact && committingResult.recipEmail != null) {
          const userContact = user.emailContact
          userContact.email = committingResult.recipEmail
          user.emailContact = await DbUserContact.save(userContact)
          user.emailId = userContact.id
          logger.debug('foreignUserEmail updated:', new UserContactLoggingView(userContact))
        }
        */
        await DbUser.save(user)
        logger.debug('update recipient successful.', new UserLoggingView(user))
        return user
      } else {
        logger.debug('foreignUser still exists...:', new UserLoggingView(user))
        return user
      }
    } catch (err) {
      logger.error('error in storeForeignUser;', err)
      return null
    }
  }
  return null
}
