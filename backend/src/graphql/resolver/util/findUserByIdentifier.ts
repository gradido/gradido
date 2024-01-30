import { FindOptionsWhere } from '@dbTools/typeorm'
import { Community } from '@entity/Community'
import { User as DbUser } from '@entity/User'
import { UserContact as DbUserContact } from '@entity/UserContact'
import { validate, version } from 'uuid'

import { LogError } from '@/server/LogError'

import { VALID_ALIAS_REGEX } from './validateAlias'

/**
 *
 * @param identifier could be gradidoID, alias or email of user
 * @param communityIdentifier could be uuid or name of community
 * @returns
 */
export const findUserByIdentifier = async (
  identifier: string,
  communityIdentifier: string,
): Promise<DbUser> => {
  let user: DbUser | null
  const communityWhere: FindOptionsWhere<Community> =
    validate(communityIdentifier) && version(communityIdentifier) === 4
      ? { communityUuid: communityIdentifier }
      : { name: communityIdentifier }

  if (validate(identifier) && version(identifier) === 4) {
    user = await DbUser.findOne({
      where: { gradidoID: identifier, community: communityWhere },
      relations: ['emailContact', 'community'],
    })
    if (!user) {
      throw new LogError('No user found to given identifier(s)', identifier, communityIdentifier)
    }
  } else if (/^.{2,}@.{2,}\..{2,}$/.exec(identifier)) {
    const userContact = await DbUserContact.findOne({
      where: {
        email: identifier,
        emailChecked: true,
        user: {
          community: communityWhere,
        },
      },
      relations: ['user', 'user.community'],
    })
    if (!userContact) {
      throw new LogError('No user with this credentials', identifier, communityIdentifier)
    }
    if (!userContact.user) {
      throw new LogError('No user to given contact', identifier, communityIdentifier)
    }
    user = userContact.user
    user.emailContact = userContact
  } else if (VALID_ALIAS_REGEX.exec(identifier)) {
    user = await DbUser.findOne({
      where: { alias: identifier, community: communityWhere },
      relations: ['emailContact', 'community'],
    })
    if (!user) {
      throw new LogError('No user found to given identifier(s)', identifier, communityIdentifier)
    }
  } else {
    throw new LogError('Unknown identifier type', identifier)
  }

  return user
}
