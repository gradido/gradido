import { Raw } from 'typeorm'
import { Community, User as DbUser, UserContact as DbUserContact } from '../entity'
import { FindOptionsWhere } from 'typeorm'
import { aliasSchema, emailSchema, uuidv4Schema, urlSchema } from 'shared'
import { getLogger } from 'log4js'
import { LOG4JS_QUERIES_CATEGORY_NAME } from './index'

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
  const communityWhere: FindOptionsWhere<Community> = urlSchema.safeParse(communityIdentifier).success
    ? { url: communityIdentifier }
    : uuidv4Schema.safeParse(communityIdentifier).success
      ? { communityUuid: communityIdentifier }
      : { name: communityIdentifier }

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
  }
  // should don't happen often, so we create only in the rare case a logger for it
  getLogger(`${LOG4JS_QUERIES_CATEGORY_NAME}.user.findUserByIdentifier`).warn('Unknown identifier type', identifier)
  return null
}
