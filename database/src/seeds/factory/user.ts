import random from 'crypto-random-bigint'
import { OptInType, PasswordEncryptionType, UserContactType } from 'shared'
import { v4 } from 'uuid'
import { User, UserContact } from '../../entity'
import { getHomeCommunity } from '../../queries/communities'
import { UserInterface } from '../users/UserInterface'

export const userFactory = async (user: UserInterface): Promise<User> => {
  let dbUserContact = new UserContact()

  dbUserContact.email = user.email ?? ''
  dbUserContact.type = UserContactType.USER_CONTACT_EMAIL

  let dbUser = new User()
  dbUser.firstName = user.firstName ?? ''
  dbUser.lastName = user.lastName ?? ''
  if (user.alias) {
    dbUser.alias = user.alias
  }
  dbUser.language = user.language ?? 'en'
  dbUser.createdAt = user.createdAt ?? new Date()
  dbUser.deletedAt = user.deletedAt ?? null
  dbUser.publisherId = user.publisherId ?? 0
  dbUser.gradidoID = v4()

  if (user.emailChecked) {
    dbUserContact.emailVerificationCode = random(64).toString()
    dbUserContact.emailOptInTypeId = OptInType.EMAIL_OPT_IN_REGISTER
    dbUserContact.emailChecked = true
    dbUser.password = random(64)
    dbUser.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
  }
  const homeCommunity = await getHomeCommunity()
  if (homeCommunity) {
    dbUser.community = homeCommunity
    dbUser.communityUuid = homeCommunity.communityUuid!
  }
  // TODO: improve with cascade
  dbUser = await dbUser.save()
  dbUserContact.userId = dbUser.id
  dbUserContact = await dbUserContact.save()
  dbUser.emailId = dbUserContact.id
  dbUser.emailContact = dbUserContact
  return dbUser.save()
}
