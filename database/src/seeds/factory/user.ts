import { UserInterface } from '../users/UserInterface'
import { User, UserContact } from '../../entity'
import { generateRandomNumber, generateRandomNumericString } from '../utils'
import { v4 } from 'uuid'

export const userFactory = async (user: UserInterface): Promise<User> => {
  let dbUserContact = new UserContact()

  dbUserContact.email = user.email ?? ''
  dbUserContact.type = 'email' //UserContactType.USER_CONTACT_EMAIL
  
  let dbUser = new User()
  dbUser.firstName = user.firstName ?? ''
  dbUser.lastName = user.lastName ?? ''
  dbUser.alias = user.alias ?? ''
  dbUser.language = user.language ?? 'en'
  dbUser.createdAt = user.createdAt ?? new Date()
  dbUser.deletedAt = user.deletedAt ?? null
  dbUser.publisherId = user.publisherId ?? 0
  dbUser.gradidoID = v4()

  if (user.emailChecked) {
    dbUserContact.emailVerificationCode = generateRandomNumericString(64)
    dbUserContact.emailOptInTypeId = 1 //OptInType.EMAIL_OPT_IN_REGISTER
    dbUserContact.emailChecked = true
    dbUser.password = generateRandomNumber()
    // TODO: think where to put enums
    dbUser.passwordEncryptionType = 2 //PasswordEncryptionType.GRADIDO_ID
  }
  // TODO: improve with cascade 
  dbUser = await dbUser.save()
  dbUserContact.userId = dbUser.id
  dbUserContact = await dbUserContact.save()
  dbUser.emailId = dbUserContact.id
  dbUser.emailContact = dbUserContact
  return dbUser.save()
}