import { isURL } from 'class-validator'
import { Community, User as DbUser, UserContact as DbUserContact } from 'database'
import { FindOptionsWhere } from 'typeorm'
import { validate, version } from 'uuid'

import { LogError } from '@/server/LogError'
import { isEMail, isUUID4 } from '@/util/validate'

import { aliasSchema } from 'shared'

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
  const communityWhere: FindOptionsWhere<Community> = isURL(communityIdentifier)
    ? { url: communityIdentifier }
    : isUUID4(communityIdentifier)
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
  } else if (isEMail(identifier)) {
    const userContact = await DbUserContact.findOne({
      where: {
        email: identifier,
        emailChecked: true,
        user: {
          community: communityWhere,
        },
      },
      relations: { user: { community: true } },
    })
    if (!userContact) {
      throw new LogError('No user with this credentials', identifier, communityIdentifier)
    }
    user = userContact.user
    user.emailContact = userContact
  } else if (aliasSchema.safeParse(identifier).success) {
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
