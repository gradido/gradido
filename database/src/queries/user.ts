import { getLogger, Logger } from 'log4js'
import { aliasSchema, emailSchema, uuidv4Schema } from 'shared'
import { In, Not, Raw } from 'typeorm'
import { AliasHistory, AliasHistory as DbAliasHistory, User as DbUser, UserContact as DbUserContact } from '../entity'
import { findWithCommunityIdentifier, LOG4JS_QUERIES_CATEGORY_NAME } from './index'

export async function aliasExists(alias: string, userId?: number): Promise<boolean> {
  const user = await DbUser.findOne({
    where: { alias }, // : Raw((a) => `LOWER(${a}) = LOWER(:alias)`, { alias }) },
  })
  let aliasHistory: DbAliasHistory | null = null
  if (userId !== undefined) {
    // find DbAliasHistory only from different users
    aliasHistory = await DbAliasHistory.findOne({
      where: { alias, userId: Not(userId) },
    })
  } else {
    // find DbAliasHistory from any user
    aliasHistory = await DbAliasHistory.findOne({
      where: { alias },
    })
  }
  return user !== null || aliasHistory !== null
}

export async function  AliasByUserId(userId: number): Promise<string | null> {
  const aliasHistory = await DbAliasHistory.findOne({
    where: { userId },
    order: { createdAt: 'DESC' },
  })
  return aliasHistory?.alias || null
}

export async function getUserById(
  id: number,
  withCommunity: boolean = false,
  withEmailContact: boolean = false,
): Promise<DbUser> {
  return DbUser.findOneOrFail({
    where: { id },
    relations: { community: withCommunity, emailContact: withEmailContact },
  })
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
    const normedAlias = Raw((a) => `LOWER(${a}) = LOWER(:alias)`, { alias: identifier })
    return await DbUser.findOne({
      where: [
        { alias: normedAlias, community: communityWhere },
        { aliasHistory: { alias: normedAlias }, community: communityWhere },
      ],
      relations: ['emailContact', 'community', 'aliasHistory'],
    })
  } else {
    // should don't happen often, so we create only in the rare case a logger for it
    getLogger(`${LOG4JS_QUERIES_CATEGORY_NAME}.user.findUserByIdentifier`).warn(
      'Unknown identifier type',
      identifier,
    )
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

export async function findUserByUuids(
  communityUuid: string,
  gradidoID: string,
  foreign: boolean = false,
): Promise<DbUser | null> {
  return DbUser.findOne({
    where: { foreign, communityUuid, gradidoID },
    relations: ['emailContact'],
  })
}

export async function findUserNamesByIds(userIds: number[]): Promise<Map<number, string>> {
  const users = await DbUser.find({
    select: { id: true, firstName: true, lastName: true, alias: true },
    where: { id: In(userIds) },
  })
  return new Map(
    users.map((user) => {
      return [user.id, `${user.firstName} ${user.lastName}`]
    }),
  )
}

export async function getLastAliasStorageTimeDistance(userId: number, logger: Logger): Promise<number | null> {
  const user = await DbUser.findOne({ where: { id: userId } })
  // select separatly because of optional history
  const aliasHistory = await AliasHistory.find({
    where: { userId },
    order: { createdAt: 'DESC' },
  })
  logger.debug(`user=${JSON.stringify(user)}, aliasHistory=${JSON.stringify(aliasHistory)}`)
  // in case user has updated alias
  if (user !== null && user.aliasStartUpdateAt !== null) {
    logger.debug('user has updated alias')
    // but no aliasHistory entries yet
    if(aliasHistory.length === 0) {
      logger.debug('no aliasHistory entries yet')
      return Date.now() - user.aliasStartUpdateAt.getTime()
    } else if (aliasHistory.length > 0) {
      logger.debug('has aliasHistory entries')
      // check if aliasStartUpdateAt is newer than last aliasHistory entry
      if(user.aliasStartUpdateAt.getTime() < aliasHistory[0].createdAt?.getTime()) {
        logger.debug('aliasStartUpdateAt is newer than last aliasHistory entry')
        return Date.now() - user.aliasStartUpdateAt.getTime()
      }
      else {
        logger.debug('aliasStartUpdateAt is older than last aliasHistory entry')
        return aliasHistory[0].createdAt ? (Date.now() - aliasHistory[0].createdAt.getTime()) : null
      }
    }
  }
  logger.debug('user has no updated alias')
  return null
}