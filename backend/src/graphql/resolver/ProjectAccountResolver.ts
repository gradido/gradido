// AI-GENERATED — not an architecture reference
import { sendCreationRightRequestSupportEmail } from 'core'
import {
  AppDatabase,
  User as DbUser,
  dbCountOpenContributionsByUserId,
  dbFindLatestEventForAffectedUser,
  dbGetUserWithRolesById,
  dbSetCreationAllowed,
} from 'database'
import { getLogger } from 'log4js'
import { Mutex } from 'redis-semaphore'
import { VoidResult } from 'shared'
import { Arg, Authorized, Ctx, Int, Mutation, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  CreationRightRequestRefused,
  isCreationRightRequestTooSoon,
  ProjectAccountRefused,
} from '@/data/ProjectAccount.logic'
import {
  EVENT_ADMIN_USER_CREATION_ALLOWED_SET,
  EVENT_CREATION_RIGHT_REQUEST,
  EVENT_PROJECT_ACCOUNT_DECLARE,
  EventType,
} from '@/event/Events'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'

const db = AppDatabase.getInstance()
const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ProjectAccountResolver.${method}`)

/**
 * The project account (ES-021): one column on `users`, three ways to move it, and the
 * asymmetry is the point. The holder switches creation OFF at once; switching it back ON
 * takes an administrator — the holder can only ASK, and the asking is a mail to the support.
 * What the switch protects is enforced in isAuthorized (RESTRICTED_FOR_PROJECT_ACCOUNT), not
 * here; this is only where the switch is moved and the record written.
 *
 * Thin on purpose: reads the caller off the context, turns an expected failure into the
 * thrown error the client sees — the failure's code as the message, no sentence.
 */
@Resolver()
export class ProjectAccountResolver {
  /**
   * "This account belongs to a project, an association or a shop — it does not create, it
   * receives thanks." Refused while the account has OPEN contributions: the moderation must
   * not be left judging contributions of an account that may not create (VORB-02).
   */
  @Authorized([RIGHTS.DECLARE_PROJECT_ACCOUNT])
  @Mutation(() => Boolean)
  async declareProjectAccount(@Ctx() context: Context): Promise<boolean> {
    const logger = createLogger('declareProjectAccount')
    const user = getUser(context)
    const result = await declareProjectAccount(user)
    if (!result.success) {
      throw new LogError(result.error.message)
    }
    logger.info(`account ${user.id} declared a project account`)
    return true
  }

  /**
   * The way back. Changes nothing on the account: a mail goes to the community's support
   * address (ES-022, English — one mailbox for every language), and an administrator flips
   * the switch by hand. At most one mail a day per account, read from the request event.
   */
  @Authorized([RIGHTS.REQUEST_CREATION_RIGHT])
  @Mutation(() => Boolean)
  async requestCreationRight(@Ctx() context: Context): Promise<boolean> {
    const logger = createLogger('requestCreationRight')
    const user = getUser(context)
    const result = await requestCreationRight(user)
    if (!result.success) {
      throw new LogError(result.error.message)
    }
    logger.info(`account ${user.id} asked for the creation right back`)
    return true
  }

  /**
   * The administrator's switch, both directions (ES-021): giving the creation right back
   * after a request, and taking it away where it turns out an account should never have
   * had it. Writes on somebody else's row, so a right of its own and an event.
   */
  @Authorized([RIGHTS.SET_CREATION_ALLOWED])
  @Mutation(() => Boolean)
  async setCreationAllowed(
    @Arg('userId', () => Int) userId: number,
    @Arg('allowed', () => Boolean) allowed: boolean,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const logger = createLogger('setCreationAllowed')
    const moderator = getUser(context)
    const target = await dbGetUserWithRolesById(userId)
    if (!target.success) {
      throw new LogError('Could not find user with given ID', userId)
    }
    const written = await dbSetCreationAllowed(userId, allowed)
    if (!written.success) {
      throw new LogError('Could not find user with given ID', userId)
    }
    await EVENT_ADMIN_USER_CREATION_ALLOWED_SET(target.value, moderator)
    logger.info(`creation right of account ${userId} set to ${allowed} by ${moderator.id}`)
    return allowed
  }
}

async function declareProjectAccount(user: DbUser): Promise<VoidResult<ProjectAccountRefused>> {
  if (!user.creationAllowed) {
    // Already a project account: nothing to move, nothing to record twice.
    return { success: true }
  }
  if ((await dbCountOpenContributionsByUserId(user.id)) > 0) {
    return { success: false, error: new ProjectAccountRefused('OPEN_CONTRIBUTIONS') }
  }
  // Column and event together or not at all: the event's timestamp is what the support
  // mail later names as "declared at", and a project account without one would read as
  // "switched off by an administrator". One TypeORM transaction covers both (the column
  // write joined the event's ORM for exactly this, see dbSetCreationAllowed).
  await db.getDataSource().transaction(async (manager) => {
    const written = await dbSetCreationAllowed(user.id, false, manager)
    if (!written.success) {
      // The caller is the row that was just loaded for this request; a miss here is a
      // programmer error, not a runtime condition.
      throw new LogError('Could not find user with given ID', user.id)
    }
    await EVENT_PROJECT_ACCOUNT_DECLARE(user, manager)
  })
  // The caller keeps acting on the snapshot in this request; keep it true to the row.
  user.creationAllowed = false
  return { success: true }
}

const requestLock = (userId: number) =>
  new Mutex(db.getRedisClient(), `CREATION_RIGHT_REQUEST_LOCK:${userId}`)

/**
 * Under the member's own lock, so that two tabs pressing at once cannot both slip past the
 * "one a day" read below and send two mails. The mail goes out FIRST and the event is
 * written only once the transport accepted it: sendEmailTranslated does not throw — it
 * answers null with mail switched off and undefined when the transport refused — and an
 * event written ahead of such an answer would lock the member out for a day over a mail
 * that never left. A mail accepted and an event that then fails to write is the rarer of
 * the two mistakes, and the one the support can live with (one mail too many).
 */
async function requestCreationRight(
  user: DbUser,
): Promise<VoidResult<CreationRightRequestRefused>> {
  if (user.creationAllowed) {
    return { success: false, error: new CreationRightRequestRefused('ALREADY_ALLOWED') }
  }
  const mutex = requestLock(user.id)
  await mutex.acquire()
  try {
    const lastRequest = await dbFindLatestEventForAffectedUser(
      EventType.CREATION_RIGHT_REQUEST,
      user.id,
    )
    if (isCreationRightRequestTooSoon(lastRequest?.createdAt ?? null)) {
      return { success: false, error: new CreationRightRequestRefused('RATE_LIMITED') }
    }
    const declared = await dbFindLatestEventForAffectedUser(
      EventType.PROJECT_ACCOUNT_DECLARE,
      user.id,
    )
    const accepted = await sendCreationRightRequestSupportEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email: CONFIG.COMMUNITY_SUPPORT_MAIL,
      // The one mailbox the backend writes to in a fixed language (ES-022): whoever reads
      // the support inbox has to act on it, whatever language the member speaks.
      language: 'en',
      alias: user.alias ?? '',
      gradidoId: user.gradidoID,
      memberEmail: user.emailContact?.email ?? '',
      // Null where no declaration event exists: then an administrator switched it off.
      declaredAt: declared?.createdAt ?? null,
      requestedAt: new Date(),
    })
    // Anything the transport did not take: null (mail switched off), undefined (send
    // rejected, logged in sendEmailTranslated), false, or an Error object.
    if (!accepted || accepted instanceof Error) {
      return { success: false, error: new CreationRightRequestRefused('MAIL_FAILED') }
    }
    await EVENT_CREATION_RIGHT_REQUEST(user)
  } finally {
    await mutex.release()
  }
  return { success: true }
}
