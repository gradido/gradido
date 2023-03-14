import { User as DbUser } from '@entity/User'
import { UserContact as DbUserContact } from '@entity/UserContact'
import LogError from '@/server/LogError'

export const findUserByIdentifier = async (identifier: string): Promise<DbUser | null> => {
  let user: DbUser | undefined
  if (
    /^[0-9a-f]{8,8}-[0-9a-f]{4,4}-[0-9a-f]{4,4}-[0-9a-f]{4,4}-[0-9a-f]{12,12}$/.exec(identifier)
  ) {
    user = await DbUser.findOne({ where: { gradidoID: identifier } })
    if (!user) {
      throw new LogError('No user found to given identifier', identifier)
    }
  } else if (/^.{2,}@.{2,}\..{2,}$/.exec(identifier)) {
    const userContact = await DbUserContact.findOne(
      {
        email: identifier,
        emailChecked: true,
      },
      { relations: ['user'] },
    )
    if (!userContact) {
      throw new LogError('No user with this credentials', identifier)
    }
    if (!userContact.user) {
      throw new LogError('No user to given contact', identifier)
    }
    user = userContact.user
    user.emailContact = userContact
  } else {
    // last is alias when implemented
    throw new LogError('Unknown identifier type', identifier)
  }

  return user
}
