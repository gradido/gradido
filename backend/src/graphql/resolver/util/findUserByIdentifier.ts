import { User as DbUser } from '@entity/User'
import { UserContact as DbUserContact } from '@entity/UserContact'
import { validate, version } from 'uuid'

import { LogError } from '@/server/LogError'

import { VALID_ALIAS_REGEX } from './validateAlias'

export const findUserByIdentifier = async (identifier: string): Promise<DbUser> => {
  let user: DbUser | undefined
  if (validate(identifier) && version(identifier) === 4) {
    user = await DbUser.findOne({ where: { gradidoID: identifier }, relations: ['emailContact'] })
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
  } else if (VALID_ALIAS_REGEX.exec(identifier)) {
    user = await DbUser.findOne({ where: { alias: identifier }, relations: ['emailContact'] })
    if (!user) {
      throw new LogError('No user found to given identifier', identifier)
    }
  } else {
    throw new LogError('Unknown identifier type', identifier)
  }

  return user
}
