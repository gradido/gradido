import { Raw } from 'typeorm'
import { User as DbUser, UserContact as DbUserContact } from '../entity'
import { aliasSchema, emailSchema, uuidv4Schema } from 'shared'
import { getLogger } from 'log4js'
import { findWithCommunityIdentifier, LOG4JS_QUERIES_CATEGORY_NAME } from './index'

export async function aliasExists(alias: string): Promise<boolean> {
  const user = await DbUser.findOne({
    where: { alias: Raw((a) => `LOWER(${a}) = LOWER(:alias)`, { alias }) },
  })
  return user !== null
}

/**
 *
 * @param identifier could be gradidoID, alias or email of user
 * @param communityIdentifier could be uuid or name of community
 * @returns
 */
export const findUserByIdentifier = async (
  identifier: string,
  communityIdentifier?: string,
): Promise<DbUser | null> => {
  const communityWhere = communityIdentifier 
    ? findWithCommunityIdentifier(communityIdentifier) 
    : undefined

  if (uuidv4Schema.safeParse(identifier).success) {
    return DbUser.findOne({
      where: { gradidoID: identifier, community: communityWhere },
      relations: ['emailContact', 'community'],
    })
  } else if (emailSchema.safeParse(identifier).success) {
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
    if (userContact) { 
      // TODO: remove circular reference
      const user = userContact.user
      user.emailContact = userContact
      return user
    } 
  } else if (aliasSchema.safeParse(identifier).success) {
    return await DbUser.findOne({
      where: { alias: identifier, community: communityWhere },
      relations: ['emailContact', 'community'],
    })
  } else {
    // should don't happen often, so we create only in the rare case a logger for it
    getLogger(`${LOG4JS_QUERIES_CATEGORY_NAME}.user.findUserByIdentifier`).warn('Unknown identifier type', identifier)
  }
  return null
}

export async function findForeignUserByUuids(
  communityUuid: string,
  gradidoID: string,
): Promise<DbUser | null> {
  return DbUser.findOne({
    where: { foreign: true, communityUuid, gradidoID },
  })
}
