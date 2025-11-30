import { UserInterface } from '../users/UserInterface'
import { User, UserContact, UserRole } from '../../entity'
import { v4 } from 'uuid'
import { UserContactType, OptInType, PasswordEncryptionType } from 'shared'
import { getHomeCommunity } from '../../queries/communities'
import random from 'random-bigint'
import { Community } from '../../entity'
import { AppDatabase } from '../..'
import { RoleNames } from '../../enum/RoleNames'

export async function userFactory(user: UserInterface, homeCommunity?: Community | null): Promise<User> {
  // TODO: improve with cascade 
  let dbUser = await createUser(user, homeCommunity)
  let dbUserContact = await createUserContact(user, dbUser.id)
  dbUser.emailId = dbUserContact.id
  dbUser.emailContact = dbUserContact
  dbUser = await dbUser.save()

  const userRole = user.role as RoleNames
  if (userRole && (userRole === RoleNames.ADMIN || userRole === RoleNames.MODERATOR)) {
    dbUser.userRoles = [await createUserRole(dbUser.id, userRole)]
  }
  
  return dbUser
}

// only use in non-parallel environment (seeding for example)
export async function userFactoryBulk(users: UserInterface[], homeCommunity?: Community | null): Promise<User[]> {
  const dbUsers: User[] = []
  const dbUserContacts: UserContact[] = []
  const dbUserRoles: UserRole[] = []
  const lastUser = await User.findOne({ order: { id: 'DESC' }, select: ['id'], where: {} })
  const lastUserContact = await UserContact.findOne({ order: { id: 'DESC' }, select: ['id'], where: {} })
  let userId = lastUser ? lastUser.id + 1 : 1
  let emailId = lastUserContact ? lastUserContact.id + 1 : 1
  // console.log(`start with userId: ${userId} and emailId: ${emailId}`)
  for(const user of users) {
    const dbUser = await createUser(user, homeCommunity, false)
    dbUser.id = userId
    dbUser.emailId = emailId

    const dbUserContact = await createUserContact(user, userId, false)
    dbUserContact.id = emailId
    dbUserContact.userId = userId
    dbUser.emailContact = dbUserContact

    dbUsers.push(dbUser)
    dbUserContacts.push(dbUserContact)

    const userRole = user.role as RoleNames
    if (userRole && (userRole === RoleNames.ADMIN || userRole === RoleNames.MODERATOR)) {
      dbUserRoles.push(await createUserRole(dbUser.id, userRole, false))
    }
    
    userId++
    emailId++
  }
  const dataSource = AppDatabase.getInstance().getDataSource()
  await dataSource.transaction(async transaction => {
    // typeorm change my data what I don't want
    // because of manuel id assignment
    const dbUsersCopy = dbUsers.map(user => ({ ...user }))
    const dbUserContactsCopy = dbUserContacts.map(userContact => ({ ...userContact }))
    const dbUserRolesCopy = dbUserRoles.map(userRole => ({ ...userRole }))
    await Promise.all([
      transaction.getRepository(User).insert(dbUsersCopy),
      transaction.getRepository(UserContact).insert(dbUserContactsCopy),
      transaction.getRepository(UserRole).insert(dbUserRolesCopy)
    ])
  })
  return dbUsers
}

export async function createUser(user: UserInterface, homeCommunity?: Community | null, store: boolean = true): Promise<User> {
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
  dbUser.humhubAllowed = true
  dbUser.gradidoID = v4()

  if (user.emailChecked) {
    // dbUser.password = 
    dbUser.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
  }
  if (!homeCommunity) {
    homeCommunity = await getHomeCommunity()
  }
  if (homeCommunity) {
    dbUser.community = homeCommunity
    dbUser.communityUuid = homeCommunity.communityUuid!
  }

  return store ? dbUser.save() : dbUser
}

export async function createUserContact(user: UserInterface, userId?: number, store: boolean = true): Promise<UserContact> {
  let dbUserContact = new UserContact()

  dbUserContact.email = user.email ?? ''
  dbUserContact.type = UserContactType.USER_CONTACT_EMAIL

  if (user.createdAt) {
    dbUserContact.createdAt = user.createdAt
    dbUserContact.updatedAt = user.createdAt
  }
  if (user.emailChecked) {
    dbUserContact.emailVerificationCode = random(64).toString()
    dbUserContact.emailOptInTypeId = OptInType.EMAIL_OPT_IN_REGISTER
    dbUserContact.emailChecked = true
  }

  if (userId) {
    dbUserContact.userId = userId
  }

  return store ? dbUserContact.save() : dbUserContact
}

export async function createUserRole(userId: number, role: RoleNames, store: boolean = true): Promise<UserRole> {
  let dbUserRole = new UserRole()
  dbUserRole.userId = userId
  dbUserRole.role = role
  return store ? dbUserRole.save() : dbUserRole
}