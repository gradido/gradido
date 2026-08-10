// AI-GENERATED — not an architecture reference
import {
  Community as DbCommunity,
  User as DbUser,
  dbClearGmsRegistration,
  getHomeCommunity,
  MatchingEntrySelect,
} from 'database'
import { getLogger } from 'log4js'
import { deleteGmsMatchingEntry, deleteGmsUser, putGmsMatchingEntry } from '@/apis/gms/GmsClient'
import { GmsUserMatchingEntry } from '@/apis/gms/model/GmsMatchingEntry'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { sendUsersToGms } from './sendUserToGms'

const logger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.syncMatchingEntryToGms`,
)

// A lost delete is a lasting privacy leak - the member's copy would stay in the
// GMS after they asked for it to go. So deletes are retried, while a lost upsert
// only means "not visible yet" and heals with the next edit or repair run.
const DELETE_RETRIES = 3
const DELETE_RETRY_DELAY_MS = [2000, 8000, 30000]

async function findGmsApiKey(): Promise<{ community: DbCommunity; apiKey: string } | undefined> {
  if (!CONFIG.GMS_ACTIVE) {
    return undefined
  }
  const community = await getHomeCommunity()
  if (!community?.gmsApiKey) {
    logger.warn('no home community with a gms api key, cannot reach the GMS')
    return undefined
  }
  return { community, apiKey: community.gmsApiKey }
}

/**
 * Retry in the background, so the member's mutation returns straight away. This
 * only survives as long as the process does; making the guarantee durable is what
 * the outbox is for, and that comes with the hardening step.
 */
function retryInBackground(what: string, operation: () => Promise<unknown>): void {
  runRetries(what, operation).catch((e) => {
    logger.error(`retry loop for "${what}" crashed: ${e}`)
  })
}

async function runRetries(what: string, operation: () => Promise<unknown>): Promise<void> {
  for (let attempt = 0; attempt < DELETE_RETRIES; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, DELETE_RETRY_DELAY_MS[attempt]))
    try {
      await operation()
      logger.info(`${what} succeeded on retry ${attempt + 1}`)
      return
    } catch (retryError) {
      logger.warn(`${what} failed on retry ${attempt + 1}: ${retryError}`)
    }
  }
  // Never silently given up on: someone has to see this.
  logger.error(`${what} still failing after ${DELETE_RETRIES} retries - GMS copy may remain`)
}

/**
 * Bring one entry in line with the GMS.
 *
 * Only entries that may actually be found belong there: the member takes part
 * (gmsAllowed) and the entry is live (active). Anything else is removed - which
 * makes pausing an entry and deleting it the very same operation towards the GMS.
 */
export async function syncMatchingEntryToGms(
  user: DbUser,
  entry: MatchingEntrySelect,
): Promise<void> {
  const gms = await findGmsApiKey()
  if (!gms) {
    return
  }

  if (!user.gmsAllowed || !entry.active) {
    await removeMatchingEntryFromGms(entry.uuid)
    return
  }

  try {
    // The entry needs its user to exist over there first. A member who never
    // published anything is not in the GMS yet; their first entry brings them in.
    if (!user.gmsRegistered) {
      await sendUsersToGms([user], gms.community)
    }
    await putGmsMatchingEntry(gms.apiKey, new GmsUserMatchingEntry(user.gradidoID, entry))
  } catch (e) {
    // The member keeps their entry either way; it just may not be findable yet.
    // The next edit, or a bulk repair run, brings it over.
    logger.warn(`could not publish matching entry ${entry.uuid} to the GMS: ${e}`)
  }
}

/** Remove one entry from the GMS - deleted or paused, it must not be findable. */
export async function removeMatchingEntryFromGms(uuid: string): Promise<void> {
  const gms = await findGmsApiKey()
  if (!gms) {
    return
  }

  try {
    await deleteGmsMatchingEntry(gms.apiKey, uuid)
  } catch (e) {
    logger.warn(`could not delete matching entry ${uuid} from the GMS: ${e}`)
    retryInBackground(`deleting matching entry ${uuid} from the GMS`, () =>
      deleteGmsMatchingEntry(gms.apiKey, uuid),
    )
  }
}

/**
 * Remove a member and everything of theirs from the GMS, because they withdrew
 * their consent or deleted their account.
 *
 * Until now nothing was sent in that case at all: switching GMS off left the copy
 * over there untouched, for good. This is the path that honours the withdrawal.
 */
export async function removeUserFromGms(user: DbUser): Promise<void> {
  const gms = await findGmsApiKey()
  if (!gms) {
    return
  }

  try {
    await deleteGmsUser(gms.apiKey, user.gradidoID)
  } catch (e) {
    logger.warn(`could not delete user from the GMS: ${e}`)
    retryInBackground('deleting user from the GMS', () => deleteGmsUser(gms.apiKey, user.gradidoID))
  }
  await forgetGmsRegistration(user)
}

/**
 * From here on the member counts as no longer being in the GMS - also when the delete
 * just failed and is still being retried. The flag decides whether a later publish
 * registers them again first, and getting that wrong is one-sided: a needless upsert
 * costs one request, while a skipped one writes an entry that belongs to nobody.
 */
async function forgetGmsRegistration(user: DbUser): Promise<void> {
  const cleared = await dbClearGmsRegistration(user.id)
  if (!cleared.success) {
    logger.error(
      `could not clear the gms registration of user ${user.id}: ${cleared.error.message}`,
    )
    return
  }
  // The caller goes on working with this object, so it must not keep saying "registered".
  user.gmsRegistered = false
  user.gmsRegisteredAt = null
}
