import { Paginated } from '@arg/Paginated'
import { TransactionLinkArgs } from '@arg/TransactionLinkArgs'
import { TransactionLinkFilters } from '@arg/TransactionLinkFilters'
import { ContributionCycleType } from '@enum/ContributionCycleType'
import { ContributionStatus } from '@enum/ContributionStatus'
import { ContributionType } from '@enum/ContributionType'
import { Community } from '@model/Community'
import { ContributionLink } from '@model/ContributionLink'
import { RedeemJwtLink } from '@model/RedeemJwtLink'
import { TransactionLink, TransactionLinkResult } from '@model/TransactionLink'
import { User } from '@model/User'
import { QueryLinkResult } from '@union/QueryLinkResult'
import {
  Decay,
  EncryptedTransferArgs,
  fullName,
  interpretEncryptedTransferArgs,
  sendTransactionReceivedEmail,
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
  findModeratorCreatingContributionLink,
  findTransactionLinkByCode,
  findUserByIdentifier,
  getHomeCommunity,
  getLastTransaction,
} from 'database'
import { Decimal } from 'decimal.js-light'
import { Redis } from 'ioredis'
import { getLogger, Logger } from 'log4js'
import { Mutex } from 'redis-semaphore'
// import { TRANSACTION_LINK_LOCK, TRANSACTIONS_LOCK } from 'database'
import {
  calculateDecay,
  compoundInterest,
  DisburseJwtPayloadType,
  decode,
  encode,
  encryptAndSign,
  RedeemJwtPayloadType,
  SignedTransferPayloadType,
  verify,
} from 'shared'
import { randombytes_random } from 'sodium-native'
import { Arg, Args, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import {
  contributionTransaction,
  deferredTransferTransaction,
  redeemDeferredTransferTransaction,
} from '@/apis/dltConnector'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  EVENT_CONTRIBUTION_LINK_REDEEM,
  EVENT_TRANSACTION_LINK_CREATE,
  EVENT_TRANSACTION_LINK_DELETE,
  EVENT_TRANSACTION_LINK_REDEEM,
} from '@/event/Events'
import { DisbursementClient as V1_0_DisbursementClient } from '@/federation/client/1_0/DisbursementClient'
import { DisbursementClientFactory } from '@/federation/client/DisbursementClientFactory'
import { Context, getClientTimezoneOffset, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { calculateBalance } from '@/util/validate'
import { CODE_VALID_DAYS_DURATION } from './const/const'
import { executeTransaction } from './TransactionResolver'
import {
  getAuthenticatedCommunities,
  getCommunityByPublicKey,
  getCommunityByUuid,
} from './util/communities'
import { getUserCreation, validateContribution } from './util/creations'
import { transactionLinkList } from './util/transactionLinkList'

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

export const transactionLinkExpireDate = (date: Date): Date => {
  const validUntil = new Date(date)
  return new Date(validUntil.setDate(date.getDate() + CODE_VALID_DAYS_DURATION))
}

@Resolver()
export class TransactionLinkResolver {
  @Authorized([RIGHTS.CREATE_TRANSACTION_LINK])
  @Mutation(() => TransactionLink)
  async createTransactionLink(
    @Args() { amount, memo }: TransactionLinkArgs,
    @Ctx() context: Context,
  ): Promise<TransactionLink> {
    const user = getUser(context)

    const createdDate = new Date()
    const validUntil = transactionLinkExpireDate(createdDate)

    const holdAvailableAmount = compoundInterest(amount, CODE_VALID_DAYS_DURATION * 24 * 60 * 60)

    // validate amount
    const sendBalance = await calculateBalance(user.id, holdAvailableAmount.mul(-1), createdDate)

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
    const dltTransactionPromise = deferredTransferTransaction(user, transactionLink)
    await DbTransactionLink.save(transactionLink).catch((e) => {
      throw new LogError('Unable to save transaction link', e)
    })
    await EVENT_TRANSACTION_LINK_CREATE(user, transactionLink, amount)
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
    return new TransactionLink(transactionLink, new User(user))
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

    transactionLink.user = user
    const dltTransactionPromise = redeemDeferredTransferTransaction(
      transactionLink,
      transactionLink.amount.toString(),
      transactionLink.deletedAt!,
      user,
    )

    await EVENT_TRANSACTION_LINK_DELETE(user, transactionLink)
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
        return new TransactionLink(dbTransactionLink, new User(user), redeemedBy, communities)
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
          let newBalance = new Decimal(0)

          let decay: Decay | null = null
          if (lastTransaction) {
            decay = calculateDecay(lastTransaction.balance, lastTransaction.balanceDate, now)
            newBalance = decay.balance
          }
          newBalance = newBalance.add(contributionLink.amount.toString())

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
          transaction.userName = fullName(user.firstName, user.lastName)
          transaction.previous = lastTransaction ? lastTransaction.id : null
          transaction.amount = contribution.amount
          transaction.creationDate = contribution.contributionDate
          transaction.balance = newBalance
          transaction.balanceDate = now
          transaction.decay = decay ? decay.decay : new Decimal(0)
          transaction.decayStart = decay ? decay.start : null
          await queryRunner.manager.insert(DbTransaction, transaction)

          contribution.confirmedAt = now
          contribution.transactionId = transaction.id
          await queryRunner.manager.update(DbContribution, { id: contribution.id }, contribution)

          await queryRunner.commitTransaction()

          await EVENT_CONTRIBUTION_LINK_REDEEM(
            user,
            transaction,
            contribution,
            contributionLink,
            contributionLink.amount,
          )
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
        await EVENT_TRANSACTION_LINK_REDEEM(
          user,
          { id: transactionLink.userId } as DbUser,
          transactionLink,
          transactionLink.amount,
        )
      } finally {
        // releaseLinkLock()
        await mutex.release()
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
        alias ?? firstName ?? '',
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
      throw new LogError(errmsg)
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
      throw new LogError(errmsg)
    }
    const senderFedCom = await DbFederatedCommunity.findOneBy({ publicKey: senderCom.publicKey })
    if (!senderFedCom) {
      const errmsg = `Sender federated community not found with publicKey=${senderCom.publicKey}`
      methodLogger.error(errmsg)
      throw new LogError(errmsg)
    }
    const recipientCom = await getCommunityByUuid(recipientCommunityUuid)
    if (!recipientCom) {
      const errmsg = `Recipient community not found with uuid=${recipientCommunityUuid}`
      methodLogger.error(errmsg)
      throw new LogError(errmsg)
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
        const senderUser = await findUserByIdentifier(senderGradidoId, senderCommunityUuid)
        if (!senderUser) {
          const errmsg = `Sender user not found with identifier=${senderGradidoId}`
          methodLogger.error(errmsg)
          throw new LogError(errmsg)
        }
        const recipientUser = await findUserByIdentifier(recipientGradidoId, recipientCommunityUuid)
        if (!recipientUser) {
          const errmsg = `Recipient user not found with identifier=${recipientGradidoId}`
          methodLogger.error(errmsg)
          throw new LogError(errmsg)
        }
        try {
          await sendTransactionReceivedEmail({
            firstName: recipientFirstName,
            lastName: recipientUser.lastName,
            email: recipientUser.emailContact.email,
            language: recipientUser.language,
            memo,
            senderFirstName: senderUser.firstName,
            senderLastName: senderUser.lastName,
            senderEmail: senderUser.emailContact.email,
            transactionAmount: new Decimal(amount),
          })
        } catch (e) {
          const errmsg = `Send Transaction Received Email to recipient failed with error=${e}`
          methodLogger.error(errmsg)
          throw new Error(errmsg)
        }
      } catch (e) {
        const errmsg = `Disburse JWT was not sent successfully with error=${e}`
        methodLogger.error(errmsg)
        throw new Error(errmsg)
      }
    }
    return true
  }

  @Authorized([RIGHTS.LIST_TRANSACTION_LINKS])
  @Query(() => TransactionLinkResult)
  async listTransactionLinks(
    @Args()
    paginated: Paginated,
    @Ctx() context: Context,
  ): Promise<TransactionLinkResult> {
    return transactionLinkList(
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
    return transactionLinkList(paginated, filters, user)
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
      senderUser.firstName = verifiedRedeemJwtPayload.sendername
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
