import { FindOptionsWhere } from '@dbTools/typeorm'
import { Community } from '@entity/Community'
import { User as DbUser } from '@entity/User'
import { isURL } from 'class-validator'
import { validate, version } from 'uuid'

import { LogError } from '@/server/LogError'
import { isEMail, isUUID4 } from '@/util/validate'

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
  const communityWhere: FindOptionsWhere<Community> = isURL(communityIdentifier)
    ? { url: communityIdentifier }
    : isUUID4(communityIdentifier)
    ? { communityUuid: communityIdentifier }
    : { name: communityIdentifier }

  const relations = { userContacts: true, community: true }

  let where: FindOptionsWhere<DbUser>
  if (validate(identifier) && version(identifier) === 4) {
    where = { gradidoID: identifier, community: communityWhere }
  } else if (isEMail(identifier)) {
    where = { userContacts: { email: identifier, emailChecked: true }, community: communityWhere }
  } else if (VALID_ALIAS_REGEX.exec(identifier)) {
    where = { alias: identifier, community: communityWhere }
  } else {
    throw new LogError('Unknown identifier type', identifier)
  }

  const user = await DbUser.findOne({ where, relations })
  if (!user) {
    throw new LogError('No user found to given identifier(s)', identifier, communityIdentifier)
  }
  return user
}
