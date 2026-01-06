import {
  Community as DbCommunity,
  User as DbUser,
  UserContact as DbUserContact,
  findForeignUserByUuids,
  UserContactLoggingView,
  UserLoggingView,
} from 'database'
import { getLogger } from 'log4js'
import { UserContactType } from 'shared'
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
        user.alias !== committingResult.recipAlias/* ||
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
        if (committingResult.recipAlias !== null) {
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
