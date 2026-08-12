import {
  AppDatabase,
  Community as DbCommunity,
  User as DbUser,
  dbSelectActiveMatchingEntriesByUserIds,
  MatchingEntrySelect,
} from 'database'
import { getLogger } from 'log4js'
import { upsertGmsUsers } from '@/apis/gms/GmsClient'
import { GmsUser } from '@/apis/gms/model/GmsUser'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { LogError } from '@/server/LogError'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.sendUserToGms`)

/**
 * @param withMatchingEntries send each user's live entries along, stating their
 *   full set: the GMS writes what it receives and removes what is missing. This is
 *   the repair path (ExportUsers) - it also cleans up entries that were paused or
 *   deleted while the GMS was unreachable. The everyday path leaves it out, and
 *   the GMS keeps the entries it has.
 */
export async function sendUsersToGms(
  users: DbUser[],
  homeCom: DbCommunity,
  withMatchingEntries = false,
): Promise<boolean> {
  if (homeCom.gmsApiKey === null) {
    throw new LogError('HomeCommunity needs GMS-ApiKey to publish user data to GMS.')
  }

  try {
    const userIds = users.map((user) => user.id)
    logger.debug(`Users will be send to GMS ${userIds}`)

    let entriesByUser: Map<number, MatchingEntrySelect[]> | undefined
    if (withMatchingEntries) {
      entriesByUser = await findLiveEntriesByUser(userIds)
    }

    const result = await upsertGmsUsers(
      homeCom.gmsApiKey,
      users.map(
        (user) =>
          // An empty array matters here: it tells the GMS this member has no live
          // entries, so any it still holds are removed.
          new GmsUser(user, entriesByUser ? (entriesByUser.get(user.id) ?? []) : undefined),
      ),
    )
    if (result) {
      await batchUpdateGmsStatus(userIds)
    }
  } catch (err) {
    if (!CONFIG.GMS_CREATE_USER_THROW_ERRORS) {
      logger.warn('publishing user fails with ', err)
      return false
    }
  }
  return true
}

async function findLiveEntriesByUser(
  userIds: number[],
): Promise<Map<number, MatchingEntrySelect[]>> {
  // Paused entries are deliberately left out - the GMS only holds what may
  // actually turn up in someone's search.
  const entries = await dbSelectActiveMatchingEntriesByUserIds(userIds)
  const byUser = new Map<number, MatchingEntrySelect[]>()
  for (const entry of entries) {
    const list = byUser.get(entry.userId)
    if (list) {
      list.push(entry)
    } else {
      byUser.set(entry.userId, [entry])
    }
  }
  return byUser
}

async function batchUpdateGmsStatus(userIds: number[]) {
  await AppDatabase.getInstance()
    .getDataSource()
    .createQueryBuilder()
    .update(DbUser)
    .set({
      gmsRegistered: true,
      gmsRegisteredAt: new Date(),
    })
    .where('id IN (:...ids)', { ids: userIds })
    .execute()
  logger.debug(`${userIds} User marked as gms published.`)
}
