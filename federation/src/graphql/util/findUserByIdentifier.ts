import { User as DbUser } from '@entity/User'
import { UserContact as DbUserContact } from '@entity/UserContact'
import { validate, version } from 'uuid'

import { LogError } from '@/server/LogError'

import { VALID_ALIAS_REGEX } from './validateAlias'

export const findUserByIdentifier = async (
  identifier: string,
  communityIdentifier?: string,
): Promise<DbUser> => {
  let user: DbUser | null
  if (validate(identifier) && version(identifier) === 4) {
    user = await DbUser.findOne({
      where: { gradidoID: identifier, communityUuid: communityIdentifier },
      relations: { userContacts: true },
    })
    if (!user) {
      throw new LogError('No user found to given identifier(s)', identifier, communityIdentifier)
    }
  } else if (/^.{2,}@.{2,}\..{2,}$/.exec(identifier)) {
    const userContact = await DbUserContact.findOne({
      where: {
        email: identifier,
        emailChecked: true,
      },
      relations: ['user'],
    })
    if (!userContact) {
      throw new LogError('No user with this credentials', identifier)
    }
    if (!userContact.user) {
      throw new LogError('No user to given contact', identifier)
    }
    if (userContact.user.communityUuid !== communityIdentifier) {
      throw new LogError(
        'Found user to given contact, but belongs to other community',
        identifier,
        communityIdentifier,
      )
    }
    user = userContact.user
  } else if (VALID_ALIAS_REGEX.exec(identifier)) {
    user = await DbUser.findOne({
      where: { alias: identifier, communityUuid: communityIdentifier },
      relations: { userContacts: true },
    })
    if (!user) {
      throw new LogError('No user found to given identifier(s)', identifier, communityIdentifier)
    }
  } else {
    throw new LogError('Unknown identifier type', identifier)
  }

  return user
}
