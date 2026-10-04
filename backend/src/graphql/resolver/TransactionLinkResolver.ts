import { Paginated } from '@arg/Paginated'
import { TransactionLinkArgs } from '@arg/TransactionLinkArgs'
import { TransactionLinkFilters } from '@arg/TransactionLinkFilters'
import { ContributionCycleType } from '@enum/ContributionCycleType'
import { ContributionStatus } from '@enum/ContributionStatus'
import { ContributionType } from '@enum/ContributionType'
import { ChatImageInput } from '@input/ChatImageInput'
import { Community } from '@model/Community'
import { ContributionLink } from '@model/ContributionLink'
import { RedeemJwtLink } from '@model/RedeemJwtLink'
import { ThankYouGreeting } from '@model/ThankYouGreeting'
import { TransactionLink, TransactionLinkResult } from '@model/TransactionLink'
import { User } from '@model/User'
import { QueryLinkResult } from '@union/QueryLinkResult'
import {
  acceptLargeThankYouGreetingPicture,
  acceptSmallThankYouGreetingPicture,
  ChatMessageImageAccepted,
  contributionTransaction,
  deferredTransferTransaction,
  EncryptedTransferArgs,
  interpretEncryptedTransferArgs,
  redeemDeferredTransferTransaction,
  removeLargeThankYouGreetingPicture,
  removeThankYouGreetingPictures,
  TransactionTypeId,
} from 'core'
import { randomBytes } from 'crypto'
import {
  AppDatabase,
  Contribution as DbContribution,
  ContributionLink as DbContributionLink,
  DltTransaction as DbDltTransaction,
  FederatedCommunity as DbFederatedCommunity,
  Transaction as DbTransaction,
  TransactionLink as DbTransactionLink,
  User as DbUser,
  dbDeleteThankYouGreetingByLinkCode,
  dbInsertEvent,
  dbInsertThankYouGreeting,
  dbInsertThankYouGreetingPicture,
  dbSelectThankYouGreetingPictureImage,
  dbSelectThankYouGreetingPicturesByLinkId,
  dbSelectThankYouGreetingsByLinkCodes,
  EventType,
  findModeratorCreatingContributionLink,
  findTransactionLinkByCode,
  getHomeCommunity,
  getLastTransaction,
} from 'database'
import { getLogger, Logger } from 'log4js'
import { Mutex } from 'redis-semaphore'
import {
  CODE_VALID_DAYS_DURATION,
  Decay,
  DecayCalculationType,
  DisburseJwtPayloadType,
  Duration,
  decode,
  encode,
  encryptAndSign,
  GradidoUnit,
  parseOrThrowFirstIssue,
  RedeemJwtPayloadType,
  SignedTransferPayloadType,
  verify,
} from 'shared'
import { randombytes_random } from 'sodium-native'
import { Arg, Args, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { CREATION_NOT_ALLOWED } from '@/data/ProjectAccount.logic'
import { PublishNameLogic } from '@/data/PublishName.logic'
import { transactionLinkGreetingSchema } from '@/data/ThankYouGreeting.schema'
import {
  mayAddLargePicture,
  pictureLinkIsAcceptedOrDeleted,
  pictureRenditionsForMember,
  pictureToServe,
  THANK_YOU_GREETING_PICTURES_MAX_PER_REQUEST,
} from '@/data/ThankYouGreetingPicture.logic'
import { DisbursementClient as V1_0_DisbursementClient } from '@/federation/client/1_0/DisbursementClient'
import { DisbursementClientFactory } from '@/federation/client/DisbursementClientFactory'
import { Context, getClientTimezoneOffset, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { calculateBalance } from '@/util/validate'
import { executeTransaction } from './TransactionResolver'
import {
  getAuthenticatedCommunities,
  getCommunityByPublicKey,
  getCommunityByUuid,
} from './util/communities'
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

  @Authorized([RIGHTS.QUERY_TRANSACTION_LINK])
  @Query(() => QueryLinkResult)
  async queryTransactionLink(@Arg('code') code: string): Promise<typeof QueryLinkResult> {
    const methodLogger = createLogger('queryTransactionLink')
    methodLogger.addContext('handshakeID', randombytes_random().toString())
    methodLogger.debug('queryTransactionLink...')
    if (code.match(/^CL-/)) {
      const contributionLink = await DbContributionLink.findOneOrFail({
        where: { code: code.replace('CL-', '') },
        withDeleted: true,
      })
      return new ContributionLink(contributionLink)
    } else {
      let txLinkFound = false
      let dbTransactionLink!: DbTransactionLink
      try {
        dbTransactionLink = await findTransactionLinkByCode(code)
        txLinkFound = true
      } catch (_err) {
        txLinkFound = false
      }
      // normal redeem code
      if (txLinkFound) {
        methodLogger.debug(
          'TransactionLinkResolver.queryTransactionLink... normal redeem code found=',
          txLinkFound,
        )
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
        return new TransactionLink(
          dbTransactionLink,
          new User(user),
          redeemedBy,
          communities,
          greeting ? new ThankYouGreeting(greeting) : null,
        )
      } else {
        // redeem jwt-token
        return await this.queryRedeemJwtLink(code, methodLogger)
      }
    }
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
          transaction.userName = new PublishNameLogic(user).getPublicAlias()
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

  @Authorized([RIGHTS.QUERY_REDEEM_JWT])
  @Mutation(() => String)
  async createRedeemJwt(
    @Arg('gradidoId') gradidoId: string,
    @Arg('senderCommunityUuid') senderCommunityUuid: string,
    @Arg('senderCommunityName') senderCommunityName: string,
    @Arg('recipientCommunityUuid') recipientCommunityUuid: string,
    @Arg('code') code: string,
    @Arg('amount') amount: string,
    @Arg('memo') memo: string,
    @Arg('firstName', { nullable: true }) firstName?: string,
    @Arg('alias', { nullable: true }) alias?: string,
    @Arg('validUntil', { nullable: true }) validUntil?: string,
  ): Promise<string> {
    const methodLogger = createLogger('createRedeemJwt')
    methodLogger.addContext('code', code.substring(0, 6))
    methodLogger.debug('args=', {
      gradidoId,
      senderCommunityUuid,
      senderCommunityName,
      recipientCommunityUuid,
      code,
      amount,
      memo,
      firstName,
      alias,
      validUntil,
    })
    try {
      const redeemJwtPayloadType = new RedeemJwtPayloadType(
        senderCommunityUuid,
        gradidoId,
        // The ALIAS, never the first name (NU-019). This token crosses a community
        // border and is read by a stranger, so a real name signed here would leave our
        // reach entirely -- and the redeem page displays it unguarded on the other side.
        // Empty for a member without one; the receiving page falls back to the gradidoID.
        //
        // ⚠️ Measured, so nobody reads more into this than it says: it used to be
        // `alias ?? firstName ?? ''`, but the ONLY caller (RedeemCommunitySelection.vue)
        // has never filled the `firstName` argument, so no real name was travelling.
        // This closes the possibility, not a live leak. The argument itself stays for
        // now -- an old wallet bundle still in someone's browser may name it, and a
        // rejected variable would break their redeem in the deploy window.
        alias ?? '',
        code,
        amount,
        memo,
        validUntil ?? '',
      )
      // encode/sign the jwt with the private key of the sender/home community
      const senderCom = await getCommunityByUuid(senderCommunityUuid)
      if (!senderCom) {
        throw new LogError('Sender community not found')
      }
      if (!senderCom.privateJwtKey) {
        throw new LogError('Sender community privateJwtKey is not set')
      }
      const recipientCom = await getCommunityByUuid(recipientCommunityUuid)
      if (!recipientCom) {
        throw new LogError('Recipient community not found')
      }
      if (!recipientCom.publicJwtKey) {
        throw new LogError('Recipient community publicJwtKey is not set')
      }
      const redeemJwt = await encryptAndSign(
        redeemJwtPayloadType,
        senderCom.privateJwtKey!,
        recipientCom.publicJwtKey!,
      )
      if (!redeemJwt) {
        throw new LogError('Redeem JWT was not created successfully')
      }
      // prepare the args for the client invocation
      const args = new EncryptedTransferArgs()
      args.publicKey = senderCom.publicKey.toString('hex')
      args.jwt = redeemJwt
      args.handshakeID = randombytes_random().toString()
      if (methodLogger.isDebugEnabled()) {
        methodLogger.debug('successfully created RedeemJWT-Response with args:', args)
      }
      const signedTransferPayload = new SignedTransferPayloadType(
        args.publicKey,
        args.jwt,
        args.handshakeID,
      )
      if (methodLogger.isDebugEnabled()) {
        methodLogger.debug(
          'successfully created RedeemJWT-Response with signedTransferPayload:',
          signedTransferPayload,
        )
      }
      const signedTransferJwt = await encode(signedTransferPayload, senderCom.privateJwtKey!)
      if (!signedTransferJwt) {
        throw new LogError('SignedTransfer JWT was not created successfully')
      }
      if (methodLogger.isDebugEnabled()) {
        methodLogger.debug(
          'successfully created RedeemJWT-Response with signedTransferJwt:',
          signedTransferJwt,
        )
      }

      return signedTransferJwt
    } catch (e) {
      const errmsg = `Error on creating Redeem JWT: error=${e}`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
  }

  @Authorized([RIGHTS.DISBURSE_TRANSACTION_LINK])
  @Mutation(() => Boolean)
  async disburseTransactionLink(
    @Ctx() _context: Context,
    @Arg('senderCommunityUuid') senderCommunityUuid: string,
    @Arg('senderGradidoId') senderGradidoId: string,
    @Arg('recipientCommunityUuid') recipientCommunityUuid: string,
    @Arg('recipientCommunityName') recipientCommunityName: string,
    @Arg('recipientGradidoId') recipientGradidoId: string,
    @Arg('recipientFirstName') recipientFirstName: string,
    @Arg('code') code: string,
    @Arg('amount') amount: string,
    @Arg('memo') memo: string,
    @Arg('validUntil', { nullable: true }) validUntil?: string,
    @Arg('recipientAlias', { nullable: true }) recipientAlias?: string,
  ): Promise<boolean> {
    const handshakeID = randombytes_random().toString()
    const methodLogger = createLogger(`disburseTransactionLink`)
    methodLogger.addContext('handshakeID', handshakeID)
    if (methodLogger.isDebugEnabled()) {
      methodLogger.debug('args=', {
        senderGradidoId,
        senderCommunityUuid,
        recipientCommunityUuid,
        recipientCommunityName,
        recipientGradidoId,
        recipientFirstName,
        code,
        amount,
        memo,
        validUntil,
        recipientAlias,
      })
    }
    const senderCom = await getCommunityByUuid(senderCommunityUuid)
    if (!senderCom) {
      const errmsg = `Sender community not found with uuid=${senderCommunityUuid}`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
    const senderFedCom = await DbFederatedCommunity.findOneBy({ publicKey: senderCom.publicKey })
    if (!senderFedCom) {
      const errmsg = `Sender federated community not found with publicKey=${senderCom.publicKey}`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
    const recipientCom = await getCommunityByUuid(recipientCommunityUuid)
    if (!recipientCom) {
      const errmsg = `Recipient community not found with uuid=${recipientCommunityUuid}`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
    const client = DisbursementClientFactory.getInstance(senderFedCom)
    if (client instanceof V1_0_DisbursementClient) {
      const disburseJwtPayload = new DisburseJwtPayloadType(
        handshakeID,
        senderCommunityUuid,
        senderGradidoId,
        recipientCommunityUuid,
        recipientCommunityName,
        recipientGradidoId,
        recipientFirstName,
        code,
        amount,
        memo,
        validUntil!,
        recipientAlias!,
      )
      if (methodLogger.isDebugEnabled()) {
        methodLogger.debug('disburseJwtPayload=', disburseJwtPayload)
      }
      const jws = await encryptAndSign(
        disburseJwtPayload,
        recipientCom.privateJwtKey!,
        senderCom.publicJwtKey!,
      )
      if (methodLogger.isDebugEnabled()) {
        methodLogger.debug('jws=', jws)
      }
      const args = new EncryptedTransferArgs()
      args.publicKey = recipientCom.publicKey.toString('hex')
      args.jwt = jws
      args.handshakeID = handshakeID
      try {
        // now send the disburseJwt to the sender community to invoke a x-community-tx to disbures the redeemLink
        const result = await client.sendDisburseJwtToSenderCommunity(args)
        if (methodLogger.isDebugEnabled()) {
          methodLogger.debug('Disburse JWT was sent successfully with result=', result)
        }
        /* don't send email here, because it is sent by the sender community
        const senderUser = await findUserByIdentifier(senderGradidoId, senderCommunityUuid)
        if (!senderUser) {
          const errmsg = `Sender user not found with identifier=${senderGradidoId}`
          methodLogger.error(errmsg)
          throw new Error(errmsg)
        }
        const recipientUser = await findUserByIdentifier(recipientGradidoId, recipientCommunityUuid)
        if (!recipientUser) {
          const errmsg = `Recipient user not found with identifier=${recipientGradidoId}`
          methodLogger.error(errmsg)
          throw new Error(errmsg)
        }
        if (recipientUser.emailContact?.email !== null) {
          if (methodLogger.isDebugEnabled()) {
            methodLogger.debug(
              'Sending TransactionLinkRedeem Email to recipient=' +
                recipientUser.firstName +
                ' ' +
                recipientUser.lastName +
                'sender=' +
                senderUser.firstName +
                ' ' +
                senderUser.lastName,
            )
          }
          try {
            await sendTransactionLinkRedeemedEmail({
              firstName: recipientUser.firstName,
              lastName: recipientUser.lastName,
              email: recipientUser.emailContact.email,
              language: recipientUser.language,
              senderAlias: new PublishNameLogic(senderUser).getPublicAlias(),
              // ⛔ A COMMUNITY name, and never an address: this sentence is read by a THIRD
              //    PARTY, which is the whole reason the alias replaced the real name here.
              //    The live callers pass `getCommunityName(...)`; see TransactionResolver.
              //    Left unfillable on purpose -- reviving this block must not be a matter of
              //    deleting the comment markers.
              senderCommunity: <community name>,
              transactionMemo: memo,
              transactionAmount: new Decimal(amount),
            })
          } catch (e) {
            const errmsg = `Send TransactionLinkRedeem Email to recipient failed with error=${e}`
            methodLogger.error(errmsg)
            throw new Error(errmsg)
          }
        } else {
          if (methodLogger.isDebugEnabled()) {
            methodLogger.debug(
              'Sender or Recipient are foreign users with no email contact, not sending Transaction Received Email: recipient=' +
                recipientUser.firstName +
                ' ' +
                recipientUser.lastName +
                'sender=' +
                senderUser.firstName +
                ' ' +
                senderUser.lastName,
            )
          }
        }
        */
      } catch (e) {
        const errmsg = `Disburse JWT was not sent successfully with error=${e}`
        methodLogger.error(errmsg)
        throw new Error(errmsg)
      }
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
    @Ctx() context: Context,
  ): Promise<string | null> {
    // ⛔ Counted in the HTTP request's budget before anything is read: a document may repeat
    // this field under any number of aliases, up to 35 KB a picture (RequestBudget).
    context.requestBudget.thankYouGreetingPicturesServed += 1
    const served = context.requestBudget.thankYouGreetingPicturesServed
    if (served > THANK_YOU_GREETING_PICTURES_MAX_PER_REQUEST) {
      throw new LogError('Too many thank-you greeting pictures requested at once', served)
    }
    const user = getUser(context)
    const found = await readPictures(dbSelectThankYouGreetingPicturesByLinkId(linkId))
    if (!found) {
      return null
    }
    const picture = pictureToServe(found.pictures, pictureRenditionsForMember(found.link, user.id))
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

  async queryRedeemJwtLink(code: string, logger: Logger): Promise<RedeemJwtLink> {
    logger.debug('queryRedeemJwtLink... redeem jwt-token found')

    // decode token first to get the EncryptedTransferArgs with the senderCommunity.publicKey as input to verify token
    const decodedPayload = decode(code) as SignedTransferPayloadType
    logger.debug('queryRedeemJwtLink... decodedPayload=', decodedPayload)
    logger.debug(
      'switch logger-context to received token-handshakeID:' + decodedPayload.handshakeID,
    )
    logger.addContext('handshakeID', decodedPayload.handshakeID)
    if (
      decodedPayload !== null &&
      decodedPayload.tokentype === SignedTransferPayloadType.SIGNED_TRANSFER_TYPE
    ) {
      const signedTransferPayload = new SignedTransferPayloadType(
        decodedPayload.publicKey,
        decodedPayload.jwt,
        decodedPayload.handshakeID,
      )
      logger.debug('queryRedeemJwtLink... signedTransferPayload=', signedTransferPayload)
      const senderCom = await getCommunityByPublicKey(
        Buffer.from(signedTransferPayload.publicKey, 'hex'),
      )
      if (!senderCom) {
        const errmsg = `Sender community not found with publicKey=${signedTransferPayload.publicKey}`
        logger.error(errmsg)
        throw new Error(errmsg)
      }
      logger.debug('queryRedeemJwtLink... senderCom=', senderCom)
      const jweVerifyResult = await verify(
        signedTransferPayload.handshakeID,
        signedTransferPayload.jwt,
        senderCom.publicJwtKey!,
      )
      logger.debug('queryRedeemJwtLink... jweVerifyResult=', jweVerifyResult)
      let verifiedRedeemJwtPayload: RedeemJwtPayloadType | null = null
      if (jweVerifyResult === null) {
        const errmsg = `Error on verify transferred redeem token with publicKey=${signedTransferPayload.publicKey}`
        logger.error(errmsg)
        throw new Error(errmsg)
      } else {
        const encryptedTransferArgs = new EncryptedTransferArgs()
        encryptedTransferArgs.publicKey = signedTransferPayload.publicKey
        encryptedTransferArgs.jwt = signedTransferPayload.jwt
        encryptedTransferArgs.handshakeID = signedTransferPayload.handshakeID

        verifiedRedeemJwtPayload = (await interpretEncryptedTransferArgs(
          encryptedTransferArgs,
        )) as RedeemJwtPayloadType
        if (logger.isDebugEnabled()) {
          logger.debug(`queryRedeemJwtLink() ...`, verifiedRedeemJwtPayload)
        }
        if (!verifiedRedeemJwtPayload) {
          const errmsg =
            `invalid authentication payload of requesting community with publicKey` +
            signedTransferPayload.publicKey
          logger.error(errmsg)
          throw new Error(errmsg)
        }
        if (verifiedRedeemJwtPayload.tokentype !== RedeemJwtPayloadType.REDEEM_ACTIVATION_TYPE) {
          const errmsg =
            `Wrong tokentype in redeem JWT: type=` +
            verifiedRedeemJwtPayload.tokentype +
            ' vs expected ' +
            RedeemJwtPayloadType.REDEEM_ACTIVATION_TYPE
          logger.error(errmsg)
          throw new Error(errmsg)
        }
        if (senderCom?.communityUuid !== verifiedRedeemJwtPayload.sendercommunityuuid) {
          const errmsg =
            `Mismatch of sender community UUID in redeem JWT against transfer JWT: uuid=` +
            senderCom.communityUuid +
            ' vs ' +
            verifiedRedeemJwtPayload.sendercommunityuuid
          logger.error(errmsg)
          throw new Error(errmsg)
        }
        if (verifiedRedeemJwtPayload.exp !== undefined) {
          const expDate = new Date(verifiedRedeemJwtPayload.exp * 1000)
          logger.debug(
            'queryRedeemJwtLink... expDate, exp =',
            expDate,
            verifiedRedeemJwtPayload.exp,
          )
          if (expDate < new Date()) {
            const errmsg = `Redeem JWT-Token expired! jwtPayload.exp=${expDate}`
            logger.error(errmsg)
            throw new Error(errmsg)
          }
        }
      }
      const homeCommunity = await getHomeCommunity()
      if (!homeCommunity) {
        const errmsg = `Home community not found`
        logger.error(errmsg)
        throw new Error(errmsg)
      }
      const recipientCommunity = new Community(homeCommunity)
      const senderCommunity = new Community(senderCom)
      const senderUser = new User(null)
      senderUser.gradidoID = verifiedRedeemJwtPayload.sendergradidoid
      // The signed name lands in BOTH fields, and the alias is the one that survives:
      // `firstName` is read through the real-name guard (NU-019) and reads as null to
      // the stranger who is redeeming, which left the redeem page with no name at all.
      //
      // ⚠️ The payload cannot say WHICH of the two it carries -- the field is one string.
      // Our own side no longer signs anything but the alias (see queryTransactionLink
      // above), so no real name of ours travels this way any more. A link minted by a
      // community still running the older code can still carry that community's member's
      // first name, and it is displayed. Ending that needs a distinct, versioned field in
      // the redeem payload, which is a change to the federation contract and belongs with
      // the rest of KLAR-11 rather than here.
      senderUser.firstName = verifiedRedeemJwtPayload.sendername
      senderUser.alias = verifiedRedeemJwtPayload.sendername
      const redeemJwtLink = new RedeemJwtLink(
        verifiedRedeemJwtPayload,
        senderCommunity,
        senderUser,
        recipientCommunity,
      )
      logger.debug('TransactionLinkResolver.queryRedeemJwtLink... redeemJwtLink=', redeemJwtLink)
      return redeemJwtLink
    } else {
      const errmsg = `transfer of redeem JWT with wrong envelope! code=${code}`
      logger.error(errmsg)
      throw new Error(errmsg)
    }
  }
}
