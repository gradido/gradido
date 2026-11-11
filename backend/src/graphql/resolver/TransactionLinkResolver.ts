import { Paginated } from '@arg/Paginated'
import { TransactionLinkArgs } from '@arg/TransactionLinkArgs'
import { TransactionLinkFilters } from '@arg/TransactionLinkFilters'
import { ContributionCycleType } from '@enum/ContributionCycleType'
import { ContributionStatus } from '@enum/ContributionStatus'
import { ContributionType } from '@enum/ContributionType'
import { ChatImageInput } from '@input/ChatImageInput'
import { Community } from '@model/Community'
import { ContributionLink } from '@model/ContributionLink'
import { ForeignTransactionLink } from '@model/ForeignTransactionLink'
import { ThankYouGreeting } from '@model/ThankYouGreeting'
import { TransactionLink, TransactionLinkResult } from '@model/TransactionLink'
import { User } from '@model/User'
import { QueryLinkResult } from '@union/QueryLinkResult'
import {
  ApiClientCache,
  acceptLargeThankYouGreetingPicture,
  acceptSmallThankYouGreetingPicture,
  ChatMessageImageAccepted,
  contributionTransaction,
  deferredTransferTransaction,
  mayAddLargePicture,
  pictureLinkIsAcceptedOrDeleted,
  pictureRenditionsForMember,
  pictureRenditionsForMemberAskingLarge,
  pictureToServe,
  redeemDeferredTransferTransaction,
  removeLargeThankYouGreetingPicture,
  removeThankYouGreetingPictures,
  SENDER_AVATARS_MAX_PER_REQUEST,
  showsSenderAvatar,
  THANK_YOU_GREETING_LARGE_PICTURE_COUNTS,
  THANK_YOU_GREETING_LARGE_PICTURES_MAX_PER_REQUEST,
  THANK_YOU_GREETING_PICTURES_ACCEPTED_MAX_PER_REQUEST,
  THANK_YOU_GREETING_PICTURES_MAX_PER_REQUEST,
  TransactionTypeId,
  transactionLinkWireSchema,
} from 'core'
import { randomBytes } from 'crypto'
import {
  AppDatabase,
  Contribution as DbContribution,
  ContributionLink as DbContributionLink,
  DltTransaction as DbDltTransaction,
  Transaction as DbTransaction,
  TransactionLink as DbTransactionLink,
  User as DbUser,
  dbDeleteThankYouGreetingByLinkCode,
  dbFindAuthenticatedForeignCommunityByIdentifier,
  dbFindMemberAvatarsSmall,
  dbInsertEvent,
  dbInsertThankYouGreeting,
  dbInsertThankYouGreetingPicture,
  dbSelectThankYouGreetingPictureImage,
  dbSelectThankYouGreetingPicturesByLinkId,
  dbSelectThankYouGreetingsByLinkCodes,
  EventType,
  findModeratorCreatingContributionLink,
  findTransactionLinkByCode,
  getLastTransaction,
} from 'database'
import { getLogger } from 'log4js'
import { Mutex } from 'redis-semaphore'
import {
  CODE_VALID_DAYS_DURATION,
  Decay,
  DecayCalculationType,
  Duration,
  GradidoUnit,
  parseOrThrowFirstIssue,
} from 'shared'
import { Arg, Args, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import * as v from 'valibot'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { CREATION_NOT_ALLOWED } from '@/data/ProjectAccount.logic'
import { transactionLinkGreetingSchema } from '@/data/ThankYouGreeting.schema'
import { Context, getClientTimezoneOffset, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { calculateBalance } from '@/util/validate'
import { executeTransaction } from './TransactionResolver'
import { getAuthenticatedCommunities } from './util/communities'
import { getUserCreation, validateContribution } from './util/creations'
import { transactionLinkListDecayed } from './util/transactionLinkListDecayed'

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.TransactionLinkResolver.${method}`)

// TODO: do not export, test it inside the resolver
export const transactionLinkCode = (date: Date): string => {
  const time = date.getTime().toString(16)
  return (
    randomBytes(12)
      .toString('hex')
      .substring(0, 24 - time.length) + time
  )
}

const db = AppDatabase.getInstance()

// What the log gets of a query that failed on a greeting's row: the driver's code. Not the
// error itself -- Drizzle writes the parameters of the statement into its message, and the name
// a member wrote about somebody else is one of them.
const driverCodeOf = (error: unknown): string =>
  (error as { cause?: { code?: string } } | null)?.cause?.code ?? 'no driver code'

// A read of a greeting's pictures that fails says so with the driver's code, as the writes do:
// the message of a failed Drizzle query carries the statement and its parameters, and neither
// belongs into an answer or a log.
const readPictures = <T>(read: Promise<T>): Promise<T> =>
  read.catch((e) => {
    throw new LogError('Unable to read thank-you greeting picture', driverCodeOf(e))
  })

/**
 * Takes the greeting of a link out again, and never throws: it runs where a link could not be
 * saved and where a link was deleted, and neither may fail over it. A plain link has no row --
 * that is its answer, not a failure. Anything else goes into the log.
 *
 * The picture of a greeting that carries one goes with it, in both renditions
 * (removeThankYouGreetingPictures, which never throws either).
 */
const removeThankYouGreeting = async (transactionLinkCode: string): Promise<void> => {
  try {
    await dbDeleteThankYouGreetingByLinkCode(transactionLinkCode)
  } catch (error) {
    createLogger('removeThankYouGreeting').error(
      'thank-you greeting could not be removed',
      transactionLinkCode,
      driverCodeOf(error),
    )
  }
  await removeThankYouGreetingPictures(transactionLinkCode)
}

/**
 * ⛔ Counts a picture that came in, in the HTTP request's budget, BEFORE any work is done on it:
 * a document may repeat a mutation under any number of aliases, each with the same picture from
 * its variables, and each is decoded and encoded again (RequestBudget).
 */
const countAcceptedPicture = (context: Context): void => {
  context.requestBudget.thankYouGreetingPicturesAccepted += 1
  const accepted = context.requestBudget.thankYouGreetingPicturesAccepted
  if (accepted > THANK_YOU_GREETING_PICTURES_ACCEPTED_MAX_PER_REQUEST) {
    throw new LogError('Too many thank-you greeting pictures sent at once', accepted)
  }
}

/**
 * The small rendition of a greeting's picture as it is stored (acceptSmallThankYouGreetingPicture),
 * or the refusal in a chat picture's words: CHAT_IMAGE_NOT_ACCEPTED with the reason -- EMPTY,
 * TOO_LARGE, NOT_JPEG or SIZE. The log gets the numbers, never the picture.
 */
const acceptedSmallPicture = async (image: ChatImageInput): Promise<ChatMessageImageAccepted> => {
  const accepted = await acceptSmallThankYouGreetingPicture(image)
  if (!accepted.success) {
    const { reason, bytes, width, height } = accepted.error
    throw new LogError(`CHAT_IMAGE_NOT_ACCEPTED: ${reason}`, { bytes, width, height })
  }
  return accepted.value
}

@Resolver()
export class TransactionLinkResolver {
  @Authorized([RIGHTS.CREATE_TRANSACTION_LINK])
  @Mutation(() => TransactionLink)
  async createTransactionLink(
    @Args() { amount, memo, greeting: greetingInput }: TransactionLinkArgs,
    @Ctx() context: Context,
  ): Promise<TransactionLink> {
    const user = getUser(context)

    // A thank-you greeting is this link with a motif, a first line and a name. Checked before
    // anything is read or written: the line has to be the beginning of the memo.
    const parsed = greetingInput
      ? parseOrThrowFirstIssue(transactionLinkGreetingSchema, { memo, greeting: greetingInput })
          .greeting
      : null
    // In the motif's place a greeting may carry a picture of the member's own: the small
    // rendition of their photo, which is a chat picture in every bound and is checked as one
    // (CHAT_IMAGE_NOT_ACCEPTED with the reason) -- and, as whoever holds the link's code will
    // get it, decoded and encoded again. The schema has seen to it that there is a motif or a
    // picture, and not both.
    if (parsed?.picture) {
      countAcceptedPicture(context)
    }
    const picture = parsed?.picture ? await acceptedSmallPicture(parsed.picture) : null
    const greeting = parsed && {
      motif: parsed.motif ?? null,
      line: parsed.line ?? null,
      recipientName: parsed.recipientName ?? null,
    }

    const createdDate = new Date()
    const validUntil = Duration.days(CODE_VALID_DAYS_DURATION).addToDate(createdDate)

    const holdAvailableAmount = amount.requiredBeforeDecay(Duration.days(CODE_VALID_DAYS_DURATION))

    // validate amount
    const sendBalance = await calculateBalance(user.id, holdAvailableAmount.negated(), createdDate)

    if (!sendBalance) {
      throw new LogError('User has not enough GDD', user.id)
    }

    const transactionLink = DbTransactionLink.create()
    transactionLink.userId = user.id
    transactionLink.amount = amount
    transactionLink.memo = memo
    transactionLink.holdAvailableAmount = holdAvailableAmount
    transactionLink.code = transactionLinkCode(createdDate)
    transactionLink.createdAt = createdDate
    transactionLink.validUntil = validUntil
    // ⛔ The greeting goes first, under the code the link is about to get. The link is saved
    // through TypeORM, the greeting through Drizzle -- two connection pools, no shared
    // transaction -- so the order decides what a failure leaves behind. This way round there is
    // never a link without its greeting: where the greeting cannot be filed, nothing is written,
    // nothing is held and the DLT has heard nothing; where the link cannot be saved after it,
    // the greeting is taken back out.
    if (greeting) {
      const filed = await dbInsertThankYouGreeting({
        transactionLinkCode: transactionLink.code,
        ...greeting,
      }).catch((e) => {
        throw new LogError('Unable to save thank-you greeting', driverCodeOf(e))
      })
      if (!filed.success) {
        throw new LogError('Unable to save thank-you greeting', filed.error.name)
      }
    }
    // ⛔ The picture goes with its greeting, before the link as well: never a link whose greeting
    // promises a picture that is not there. Where it cannot be filed, the greeting is taken back
    // out and nothing else has happened.
    if (picture) {
      const filed = await dbInsertThankYouGreetingPicture({
        transactionLinkCode: transactionLink.code,
        rendition: 'small',
        width: picture.width,
        height: picture.height,
        image: picture.image,
        mimeType: 'image/jpeg',
      }).catch(async (e) => {
        await removeThankYouGreeting(transactionLink.code)
        // The driver's code, never the error: the parameters of the insert are part of its
        // message, and the picture is one of them.
        throw new LogError('Unable to save thank-you greeting picture', driverCodeOf(e))
      })
      if (!filed.success) {
        await removeThankYouGreeting(transactionLink.code)
        throw new LogError('Unable to save thank-you greeting picture', filed.error.name)
      }
    }
    const dltTransactionPromise = deferredTransferTransaction(user, transactionLink)
    await DbTransactionLink.save(transactionLink).catch(async (e) => {
      if (greeting) {
        await removeThankYouGreeting(transactionLink.code)
      }
      throw new LogError('Unable to save transaction link', e)
    })
    await dbInsertEvent({
      type: EventType.TRANSACTION_LINK_CREATE,
      affectedUserId: user.id,
      actingUserId: user.id,
      involvedTransactionLinkId: transactionLink.id,
      amountGdd4: amount,
    })
    // wait for dlt transaction to be created
    const startTime = Date.now()
    const dltTransaction = await dltTransactionPromise
    const endTime = Date.now()
    createLogger('createTransactionLink').debug(
      `dlt transaction created in ${endTime - startTime} ms`,
    )
    if (dltTransaction) {
      dltTransaction.transactionLinkId = transactionLink.id
      await DbDltTransaction.save(dltTransaction)
    }
    return new TransactionLink(
      transactionLink,
      new User(user),
      undefined,
      undefined,
      greeting ? new ThankYouGreeting(greeting) : null,
    )
  }

  @Authorized([RIGHTS.DELETE_TRANSACTION_LINK])
  @Mutation(() => Boolean)
  async deleteTransactionLink(
    @Arg('id', () => Int) id: number,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const user = getUser(context)

    const transactionLink = await DbTransactionLink.findOne({ where: { id } })
    if (!transactionLink) {
      throw new LogError('Transaction link not found', id)
    }

    if (transactionLink.userId !== user.id) {
      throw new LogError(
        'Transaction link cannot be deleted by another user',
        transactionLink.userId,
        user.id,
      )
    }
    if (transactionLink.redeemedBy) {
      throw new LogError('Transaction link already redeemed', transactionLink.redeemedBy)
    }

    await transactionLink.softRemove().catch((e) => {
      throw new LogError('Transaction link could not be deleted', e)
    })
    // The greeting goes with its link, and its picture with it, in both renditions: the name of
    // a third person does not stay behind, and neither does their face. The link is deleted
    // either way -- a row that could not be removed is in the log, and nobody reaches it: a
    // deleted link never answers with a greeting, nor with a picture.
    await removeThankYouGreeting(transactionLink.code)

    transactionLink.user = user
    const dltTransactionPromise = redeemDeferredTransferTransaction(
      transactionLink,
      transactionLink.amount.toString(),
      transactionLink.deletedAt!,
      user,
      true,
    )

    await dbInsertEvent({
      type: EventType.TRANSACTION_LINK_DELETE,
      affectedUserId: user.id,
      actingUserId: user.id,
      involvedTransactionLinkId: transactionLink.id,
    })
    // wait for dlt transaction to be created
    const startTime = Date.now()
    const dltTransaction = await dltTransactionPromise
    const endTime = Date.now()
    createLogger('deleteTransactionLink').debug(
      `dlt transaction created in ${endTime - startTime} ms`,
    )
    if (dltTransaction) {
      dltTransaction.transactionLinkId = transactionLink.id
      await DbDltTransaction.save(dltTransaction)
    }

    return true
  }

  /**
   * The link a code opens, for its page: a contribution link (`CL-…`), a link of this community,
   * or -- with `codeCommunityUuid` naming another community this one knows through the handshake
   * -- a link of that community, as it answers for whoever holds the code (peer-api
   * transactionLink).
   */
  @Authorized([RIGHTS.QUERY_TRANSACTION_LINK])
  @Query(() => QueryLinkResult)
  async queryTransactionLink(
    @Arg('code') code: string,
    @Arg('codeCommunityUuid', () => String, { nullable: true }) codeCommunityUuid: string | null,
    @Ctx() context: Context,
  ): Promise<typeof QueryLinkResult> {
    const methodLogger = createLogger('queryTransactionLink')
    if (code.match(/^CL-/)) {
      const contributionLink = await DbContributionLink.findOneOrFail({
        where: { code: code.replace('CL-', '') },
        withDeleted: true,
      })
      return new ContributionLink(contributionLink)
    }
    // the home community is no foreign one: its links are read below
    const linkCom = codeCommunityUuid
      ? await dbFindAuthenticatedForeignCommunityByIdentifier(codeCommunityUuid)
      : null
    if (linkCom) {
      const { data, error } = await ApiClientCache.getInstance()
        .get(linkCom)
        .transactionLink({ code })
      if (error) {
        throw new LogError(
          `Transaction link of another community not read: ${error.value}`,
          error.status,
        )
      }
      return new ForeignTransactionLink(
        v.parse(transactionLinkWireSchema, data),
        code,
        new Community(linkCom),
      )
    }
    const dbTransactionLink = await findTransactionLinkByCode(code)
    const user = await DbUser.findOneOrFail({ where: { id: dbTransactionLink.userId } })
    let redeemedBy
    if (dbTransactionLink.redeemedBy) {
      redeemedBy = new User(
        await DbUser.findOneOrFail({ where: { id: dbTransactionLink.redeemedBy } }),
      )
    }
    const communities = await getAuthenticatedCommunities()
    // Readable by whoever holds the code, as the memo is. ⛔ Never for a deleted link:
    // this query finds those too, and what was taken back shows nothing any more.
    const [greeting] = dbTransactionLink.deletedAt
      ? []
      : await dbSelectThankYouGreetingsByLinkCodes([dbTransactionLink.code])
    // The face of the member who made the link (ZE-038), for whoever holds the code: of an
    // OPEN link only (showsSenderAvatar), and only where the member shows their face to
    // other members -- that guard stands in the query (dbFindMemberAvatarsSmall). One read
    // more for an open link: the picture lies in a table of its own, and its guard in that
    // query. ⛔ Counted in the HTTP request's budget before it is read, as a document may
    // name this query under any number of aliases, each with a code of its own; past the
    // cap the link comes without its face. So it does where the read fails: the face is one
    // part of the answer, and its failure goes into the log with the driver's code alone
    // (driverCodeOf) -- the message of a failed Drizzle query carries the statement and its
    // parameters, and this answer goes to whoever holds the code.
    let senderAvatar: Buffer | null = null
    if (showsSenderAvatar(dbTransactionLink, user.deletedAt, new Date())) {
      context.requestBudget.senderAvatarsServed += 1
      if (context.requestBudget.senderAvatarsServed <= SENDER_AVATARS_MAX_PER_REQUEST) {
        // The row of this member: the id is unique only per community.
        const rows = await dbFindMemberAvatarsSmall([user.gradidoID]).catch((e: unknown) => {
          methodLogger.error('sender avatar could not be read', driverCodeOf(e))
          return []
        })
        senderAvatar =
          rows.find((row) => row.communityUuid === user.communityUuid)?.avatarSmall ?? null
      }
    }
    return new TransactionLink(
      dbTransactionLink,
      new User(user),
      redeemedBy,
      communities,
      greeting ? new ThankYouGreeting(greeting) : null,
      senderAvatar,
    )
  }

  @Authorized([RIGHTS.REDEEM_TRANSACTION_LINK])
  @Mutation(() => Boolean)
  async redeemTransactionLink(
    @Arg('code', () => String) code: string,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const methodLogger = createLogger('redeemTransactionLink')
    methodLogger.addContext('code', code.substring(0, 6))
    const clientTimezoneOffset = getClientTimezoneOffset(context)
    // const homeCom = await DbCommunity.findOneOrFail({ where: { foreign: false } })
    const user = getUser(context)
    if (code.match(/^CL-/)) {
      // ES-021: a contribution link files a CREATION in the redeemer's name, and a project
      // account does not create. Guarded here, in this branch only, and not by putting
      // REDEEM_TRANSACTION_LINK on RESTRICTED_FOR_PROJECT_ACCOUNT: the same right covers
      // redeeming a plain transfer link and taking a thank-you card, and a project account
      // RECEIVES. Before the lock and the transaction, so a refusal costs neither.
      if (!user.creationAllowed) {
        throw new LogError(CREATION_NOT_ALLOWED, user.id)
      }
      // acquire lock
      // const releaseLock = await TRANSACTIONS_LOCK.acquire()
      const mutex = new Mutex(db.getRedisClient(), 'TRANSACTIONS_LOCK')
      await mutex.acquire()
      try {
        methodLogger.info('redeem contribution link...')
        const now = new Date()
        const queryRunner = db.getDataSource().createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction('REPEATABLE READ')
        try {
          const contributionLink = await queryRunner.manager
            .createQueryBuilder()
            .select('contributionLink')
            .from(DbContributionLink, 'contributionLink')
            .where('contributionLink.code = :code', { code: code.replace('CL-', '') })
            .getOne()
          if (!contributionLink) {
            throw new LogError('No contribution link found to given code', code)
          }
          methodLogger.info('...contribution link found with id', contributionLink.id)
          if (new Date(contributionLink.validFrom).getTime() > now.getTime()) {
            throw new LogError('Contribution link is not valid yet', contributionLink.validFrom)
          }
          if (contributionLink.validTo) {
            if (new Date(contributionLink.validTo).setHours(23, 59, 59) < now.getTime()) {
              throw new LogError('Contribution link is no longer valid', contributionLink.validTo)
            }
          }
          let alreadyRedeemed: DbContribution | null
          switch (contributionLink.cycle) {
            case ContributionCycleType.ONCE: {
              alreadyRedeemed = await queryRunner.manager
                .createQueryBuilder()
                .select('contribution')
                .from(DbContribution, 'contribution')
                .where('contribution.contributionLinkId = :linkId AND contribution.userId = :id', {
                  linkId: contributionLink.id,
                  id: user.id,
                })
                .getOne()
              if (alreadyRedeemed) {
                throw new LogError('Contribution link already redeemed', user.id)
              }
              break
            }
            case ContributionCycleType.DAILY: {
              const start = new Date()
              start.setHours(0, 0, 0, 0)
              const end = new Date()
              end.setHours(23, 59, 59, 999)
              alreadyRedeemed = await queryRunner.manager
                .createQueryBuilder()
                .select('contribution')
                .from(DbContribution, 'contribution')
                .where(
                  `contribution.contributionLinkId = :linkId AND contribution.userId = :id
                        AND Date(contribution.confirmedAt) BETWEEN :start AND :end`,
                  {
                    linkId: contributionLink.id,
                    id: user.id,
                    start,
                    end,
                  },
                )
                .getOne()
              if (alreadyRedeemed) {
                throw new LogError('Contribution link already redeemed today', user.id)
              }
              break
            }
            default: {
              throw new LogError('Contribution link has unknown cycle', contributionLink.cycle)
            }
          }
          const moderatorPromise = findModeratorCreatingContributionLink(contributionLink)
          const creations = await getUserCreation(user.id, clientTimezoneOffset)
          methodLogger.info('open creations', creations)
          validateContribution(creations, contributionLink.amount, now, clientTimezoneOffset)
          const contribution = new DbContribution()
          contribution.userId = user.id
          contribution.createdAt = now
          contribution.contributionDate = now
          contribution.memo = contributionLink.memo
          contribution.amount = contributionLink.amount
          contribution.contributionLinkId = contributionLink.id
          contribution.contributionType = ContributionType.LINK
          contribution.contributionStatus = ContributionStatus.CONFIRMED

          let dltTransactionPromise: Promise<DbDltTransaction | null> = Promise.resolve(null)
          const moderator = await moderatorPromise
          if (moderator) {
            dltTransactionPromise = contributionTransaction(contribution, moderator, now)
          }

          await queryRunner.manager.insert(DbContribution, contribution)

          const lastTransaction = await getLastTransaction(user.id)
          let newBalance = new GradidoUnit(0n)

          let decay: Decay | null = null
          if (lastTransaction) {
            decay = lastTransaction.balance.calculateDecay(lastTransaction.balanceDate, now)
            newBalance = decay.balance
          }
          newBalance = newBalance.add(contributionLink.amount)

          const transaction = new DbTransaction()
          transaction.typeId = TransactionTypeId.CREATION
          transaction.memo = contribution.memo
          transaction.userId = contribution.userId
          /* local transaction will not carry homeComUuid for local users 
          if (homeCom.communityUuid) {
            transaction.userCommunityUuid = homeCom.communityUuid
          }
          */
          transaction.userGradidoID = user.gradidoID
          // The alias, not the real name (NU-021): a booking is permanent. Same
          // convention as the send/receive path in TransactionResolver, and through the
          // shared rule so a member without a usable alias stores their gradidoID rather
          // than nothing at all.
          transaction.userName = user.alias
          transaction.previous = lastTransaction ? lastTransaction.id : null
          transaction.amount = contribution.amount
          transaction.creationDate = contribution.contributionDate
          transaction.balance = newBalance
          transaction.balanceDate = now
          transaction.decay = decay ? decay.decay : new GradidoUnit(0n)
          transaction.decayStart = decay ? decay.start : null
          transaction.decayCalculationType = DecayCalculationType.NATIVE_C_FIXED_FACTOR_INTEGER
          await queryRunner.manager.insert(DbTransaction, transaction)

          contribution.confirmedAt = now
          contribution.transactionId = transaction.id
          await queryRunner.manager.update(DbContribution, { id: contribution.id }, contribution)

          await queryRunner.commitTransaction()

          await dbInsertEvent({
            type: EventType.CONTRIBUTION_LINK_REDEEM,
            affectedUserId: user.id,
            actingUserId: user.id,
            involvedTransactionId: transaction.id,
            involvedContributionId: contribution.id,
            involvedContributionLinkId: contributionLink.id,
            amountGdd4: contributionLink.amount,
          })
          if (dltTransactionPromise) {
            const startTime = new Date()
            const dltTransaction = await dltTransactionPromise
            const endTime = new Date()
            methodLogger.info(
              `dlt-connector transaction finished in ${endTime.getTime() - startTime.getTime()} ms`,
            )
            if (dltTransaction) {
              dltTransaction.transactionId = transaction.id
              await dltTransaction.save()
            }
          }
        } catch (e) {
          await queryRunner.rollbackTransaction()
          throw new LogError('Creation from contribution link was not successful', e)
        } finally {
          await queryRunner.release()
        }
      } finally {
        // releaseLock()
        await mutex.release()
      }
      return true
    } else {
      // const releaseLinkLock = await TRANSACTION_LINK_LOCK.acquire()
      const mutex = new Mutex(db.getRedisClient(), 'TRANSACTION_LINK_LOCK')
      await mutex.acquire()
      const now = new Date()
      // The code of the link once it is booked, as its row has it.
      let acceptedLinkCode: string | null = null
      try {
        const transactionLink = await DbTransactionLink.findOne({ where: { code } })
        if (!transactionLink) {
          throw new LogError('Transaction link not found', code)
        }

        const linkedUser = await DbUser.findOne({
          where: {
            id: transactionLink.userId,
          },
          relations: ['emailContact'],
        })

        if (!linkedUser) {
          throw new LogError('Linked user not found for given link', transactionLink.userId)
        }

        if (user.id === linkedUser.id) {
          throw new LogError('Cannot redeem own transaction link', user.id)
        }

        if (transactionLink.validUntil.getTime() < now.getTime()) {
          throw new LogError('Transaction link is not valid anymore', transactionLink.validUntil)
        }

        if (transactionLink.redeemedBy) {
          throw new LogError('Transaction link already redeemed', transactionLink.redeemedBy)
        }
        await executeTransaction(
          transactionLink.amount,
          transactionLink.memo,
          linkedUser,
          user,
          methodLogger,
          transactionLink,
        )
        acceptedLinkCode = transactionLink.code
        await dbInsertEvent({
          type: EventType.TRANSACTION_LINK_REDEEM,
          affectedUserId: user.id,
          actingUserId: user.id,
          involvedUserId: transactionLink.userId,
          involvedTransactionLinkId: transactionLink.id,
          amountGdd4: transactionLink.amount,
        })
      } finally {
        // releaseLinkLock()
        await mutex.release()
        // The thank-you is accepted: the large rendition of a greeting's own picture has served
        // the page the link opened as, and goes; the small one stays with the booking. After
        // the booking and outside its lock, and it never throws -- a row left behind is handed
        // to nobody, the address serves the pictures of open links only. Most links have none.
        if (acceptedLinkCode) {
          await removeLargeThankYouGreetingPicture(acceptedLinkCode)
        }
      }
      return true
    }
  }

  /**
   * Accepts a link of another community for the signed-in member: the link's community pays it
   * out, as a transfer from the member who made it (peer-api disburseTransactionLink). Only the
   * code goes there, with whom it is for; amount, memo and maker the other community has itself.
   */
  @Authorized([RIGHTS.DISBURSE_TRANSACTION_LINK])
  @Mutation(() => Boolean)
  async disburseTransactionLink(
    @Ctx() context: Context,
    @Arg('senderCommunityUuid') senderCommunityUuid: string,
    @Arg('code') code: string,
  ): Promise<boolean> {
    const user = getUser(context)
    const senderCom = await dbFindAuthenticatedForeignCommunityByIdentifier(senderCommunityUuid)
    if (!senderCom) {
      throw new LogError('Sender community not found', senderCommunityUuid)
    }
    const { error } = await ApiClientCache.getInstance()
      .get(senderCom)
      .disburseTransactionLink({
        link: { code, communityUuid: senderCom.communityUuid },
        recipient: { communityUuid: user.communityUuid, identifier: user.gradidoID },
      })
    if (error) {
      throw new LogError(`Disbursement of the link failed: ${error.value}`, error.status)
    }
    return true
  }

  /**
   * Adds the large rendition to a greeting that carries a picture of the member's own (ZE-019):
   * the one the page of the open link shows, up to THANK_YOU_PICTURE_LARGE_MAX_BYTES. It comes
   * in a request of its own, after createTransactionLink brought the small one -- the two do not
   * fit one request.
   *
   * Only by the member who made the link, only while the link is open, only for a greeting with
   * a picture, and only once (mayAddLargePicture; the unique key refuses a second one). False
   * for every other case alike -- no such link, somebody else's, a greeting with a motif, a link
   * that is accepted, run out or deleted, a second upload --, with nothing that tells them
   * apart. The greeting stands without it: the page then shows the small rendition.
   *
   * Behind CREATE_TRANSACTION_LINK: it completes what that right made.
   *
   * One picture in an HTTP request, counted before anything else (countAcceptedPicture).
   *
   * What the picture has to be is checked first, and refused as THANK_YOU_PICTURE_NOT_ACCEPTED
   * with the reason -- EMPTY, TOO_LARGE, NOT_JPEG or SIZE; that says nothing about any link.
   * What is filed is the picture decoded and encoded again, at the size it really has.
   * Nothing of the picture is written to the log (plugins.ts masks `$picture`).
   */
  @Authorized([RIGHTS.CREATE_TRANSACTION_LINK])
  @Mutation(() => Boolean)
  async addThankYouGreetingPicture(
    @Arg('linkId', () => Int) linkId: number,
    @Arg('picture', () => ChatImageInput) picture: ChatImageInput,
    @Ctx() context: Context,
  ): Promise<boolean> {
    countAcceptedPicture(context)
    const user = getUser(context)
    const accepted = await acceptLargeThankYouGreetingPicture(picture)
    if (!accepted.success) {
      const { reason, bytes, width, height } = accepted.error
      throw new LogError(`THANK_YOU_PICTURE_NOT_ACCEPTED: ${reason}`, { bytes, width, height })
    }

    const found = await readPictures(dbSelectThankYouGreetingPicturesByLinkId(linkId))
    if (!found || !mayAddLargePicture(found, user.id, new Date())) {
      return false
    }
    const filed = await dbInsertThankYouGreetingPicture({
      transactionLinkCode: found.link.code,
      rendition: 'large',
      width: accepted.value.width,
      height: accepted.value.height,
      image: accepted.value.image,
      mimeType: 'image/jpeg',
    }).catch((e) => {
      // The driver's code, never the error: the picture is among the parameters in its message.
      throw new LogError('Unable to save thank-you greeting picture', driverCodeOf(e))
    })
    if (!filed.success) {
      return false
    }

    // ⛔ Looked at once more, now that the picture is filed: was the thank-you accepted, or the
    // link deleted, while it came in? Both write their mark first and take the large rendition
    // out afterwards; this files it first and reads the mark afterwards. So whichever comes
    // first, one of the two sees the other and takes the picture out. A read that fails, or
    // finds nothing, counts as "deleted". Should a row stay all the same -- the database not
    // doing as asked --, it is handed to nobody: the address serves open links only.
    const after = await dbSelectThankYouGreetingPicturesByLinkId(linkId).catch(() => null)
    if (!after || pictureLinkIsAcceptedOrDeleted(after.link)) {
      await removeLargeThankYouGreetingPicture(found.link.code)
      return false
    }
    return true
  }

  /**
   * The picture of a greeting that carries one, as base64: its small rendition, for the member
   * who made the link -- open, run out or accepted -- and for the member who accepted it
   * (pictureRenditionsForMember). Null for everything else -- no such link, a link without a
   * picture, a deleted one, a member who is neither of the two --, with nothing that tells
   * these apart.
   *
   * With `large` the member who MADE the link gets its large rendition instead -- and the small
   * one where no large one is filed --, while the link is neither accepted nor deleted
   * (pictureRenditionsForMemberAskingLarge): a duplicate of a greeting
   * carries the photo of the old one along (ZE-030). ⛔ For everybody else, and in every other
   * state, `large` changes nothing about the answer.
   *
   * By the link's id: the list of one's own links and the booking of an accepted greeting both
   * carry it. Who the two members are is read off the link's own row -- an id a client makes
   * up finds a link it is no party to, and gets null.
   *
   * The way a chat message's picture comes (chatMessageImage): GraphQL, base64, one picture a
   * call, and counted in the HTTP request's budget. The page of an OPEN link gets its picture
   * by an address instead, without anybody signed in (server/thankYouGreetingPicture.ts).
   *
   * Nothing of the picture is written to the log; the request log leaves the answer out
   * (plugins.ts).
   */
  @Authorized([RIGHTS.THANK_YOU_GREETING_PICTURE])
  @Query(() => String, { nullable: true })
  async thankYouGreetingPicture(
    @Arg('linkId', () => Int) linkId: number,
    @Arg('large', () => Boolean, { nullable: true, defaultValue: false }) large: boolean | null,
    @Ctx() context: Context,
  ): Promise<string | null> {
    // ⛔ Counted in the HTTP request's budget before anything is read: a document may repeat
    // this field under any number of aliases, up to 35 KB a picture (RequestBudget). A call
    // that asks for the large rendition, up to 72 KB, counts as three -- and a request may hold
    // one such call, counted in the budget as well: a number kept in here would start at zero
    // for every alias.
    const budget = context.requestBudget
    budget.thankYouGreetingPicturesServed += large ? THANK_YOU_GREETING_LARGE_PICTURE_COUNTS : 1
    if (large) {
      budget.thankYouGreetingLargePicturesServed += 1
    }
    if (
      budget.thankYouGreetingPicturesServed > THANK_YOU_GREETING_PICTURES_MAX_PER_REQUEST ||
      budget.thankYouGreetingLargePicturesServed > THANK_YOU_GREETING_LARGE_PICTURES_MAX_PER_REQUEST
    ) {
      throw new LogError(
        'Too many thank-you greeting pictures requested at once',
        budget.thankYouGreetingPicturesServed,
        budget.thankYouGreetingLargePicturesServed,
      )
    }
    const user = getUser(context)
    const found = await readPictures(dbSelectThankYouGreetingPicturesByLinkId(linkId))
    if (!found) {
      return null
    }
    const wanted = large
      ? pictureRenditionsForMemberAskingLarge(found.link, user.id)
      : pictureRenditionsForMember(found.link, user.id)
    const picture = pictureToServe(found.pictures, wanted)
    if (!picture) {
      return null
    }
    const image = await readPictures(dbSelectThankYouGreetingPictureImage(picture.id))
    return image.success ? image.value.toString('base64') : null
  }

  @Authorized([RIGHTS.LIST_TRANSACTION_LINKS])
  @Query(() => TransactionLinkResult)
  async listTransactionLinks(
    @Args()
    paginated: Paginated,
    @Ctx() context: Context,
  ): Promise<TransactionLinkResult> {
    return transactionLinkListDecayed(
      paginated,
      {
        withDeleted: false,
        withExpired: true,
        withRedeemed: false,
      },
      getUser(context),
    )
  }

  @Authorized([RIGHTS.LIST_TRANSACTION_LINKS_ADMIN])
  @Query(() => TransactionLinkResult)
  async listTransactionLinksAdmin(
    @Args()
    paginated: Paginated,
    @Arg('filters', () => TransactionLinkFilters, { nullable: true })
    filters: TransactionLinkFilters,
    @Arg('userId', () => Int)
    userId: number,
  ): Promise<TransactionLinkResult> {
    const user = await DbUser.findOne({ where: { id: userId } })
    if (!user) {
      throw new LogError('Could not find requested User', userId)
    }
    return transactionLinkListDecayed(paginated, filters, user)
  }
}
