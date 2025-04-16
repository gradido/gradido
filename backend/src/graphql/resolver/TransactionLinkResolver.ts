import { randomBytes } from 'crypto'

import { getConnection } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'
import { Contribution as DbContribution } from '@entity/Contribution'
import { ContributionLink as DbContributionLink } from '@entity/ContributionLink'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { TransactionLink as DbTransactionLink } from '@entity/TransactionLink'
import { User as DbUser } from '@entity/User'
import { Decimal } from 'decimal.js-light'
import { Resolver, Args, Arg, Authorized, Ctx, Mutation, Query, Int } from 'type-graphql'

import { Paginated } from '@arg/Paginated'
import { TransactionLinkArgs } from '@arg/TransactionLinkArgs'
import { TransactionLinkFilters } from '@arg/TransactionLinkFilters'
import { ContributionCycleType } from '@enum/ContributionCycleType'
import { ContributionStatus } from '@enum/ContributionStatus'
import { ContributionType } from '@enum/ContributionType'
import { TransactionTypeId } from '@enum/TransactionTypeId'
import { ContributionLink } from '@model/ContributionLink'
import { Decay } from '@model/Decay'
import { TransactionLink, TransactionLinkResult } from '@model/TransactionLink'
import { User } from '@model/User'
import { QueryLinkResult } from '@union/QueryLinkResult'

import { verify, encode, decode } from '@/auth/jwt/JWT'
import { DisbursementJwtPayloadType } from '@/auth/jwt/payloadtypes/DisbursementJwtPayloadType'
import { RIGHTS } from '@/auth/RIGHTS'
import {
  EVENT_CONTRIBUTION_LINK_REDEEM,
  EVENT_TRANSACTION_LINK_CREATE,
  EVENT_TRANSACTION_LINK_DELETE,
  EVENT_TRANSACTION_LINK_REDEEM,
} from '@/event/Events'
import { Context, getUser, getClientTimezoneOffset } from '@/server/context'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'
import { calculateDecay } from '@/util/decay'
import { TRANSACTION_LINK_LOCK } from '@/util/TRANSACTION_LINK_LOCK'
import { TRANSACTIONS_LOCK } from '@/util/TRANSACTIONS_LOCK'
import { fullName } from '@/util/utilities'
import { calculateBalance } from '@/util/validate'

import { executeTransaction } from './TransactionResolver'
import {
  getAuthenticatedCommunities,
  getCommunityByUuid,
  getHomeCommunity,
} from './util/communities'
import { getUserCreation, validateContribution } from './util/creations'
import { getLastTransaction } from './util/getLastTransaction'
import { sendTransactionsToDltConnector } from './util/sendTransactionsToDltConnector'
import { transactionLinkList } from './util/transactionLinkList'

// TODO: do not export, test it inside the resolver
export const transactionLinkCode = (date: Date): string => {
  const time = date.getTime().toString(16)
  return (
    randomBytes(12)
      .toString('hex')
      .substring(0, 24 - time.length) + time
  )
}

const CODE_VALID_DAYS_DURATION = 14

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

    const holdAvailableAmount = amount.minus(calculateDecay(amount, createdDate, validUntil).decay)

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
    await DbTransactionLink.save(transactionLink).catch((e) => {
      throw new LogError('Unable to save transaction link', e)
    })
    await EVENT_TRANSACTION_LINK_CREATE(user, transactionLink, amount)

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

    await EVENT_TRANSACTION_LINK_DELETE(user, transactionLink)

    return true
  }

  @Authorized([RIGHTS.QUERY_TRANSACTION_LINK])
  @Query(() => QueryLinkResult)
  async queryTransactionLink(@Arg('code') code: string): Promise<typeof QueryLinkResult> {
    logger.debug('TransactionLinkResolver.queryTransactionLink... code=', code)
    const transactionLink = new TransactionLink()
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
        dbTransactionLink = await DbTransactionLink.findOneOrFail({
          where: { code },
          withDeleted: true,
        })
        txLinkFound = true
      } catch (err) {
        txLinkFound = false
      }
      // normal redeem code
      if (txLinkFound) {
        logger.debug(
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
        // disbursement jwt-token
        logger.debug('TransactionLinkResolver.queryTransactionLink... disbursement jwt-token found')
        const payload = decode(code)
        if (payload.tokentype === DisbursementJwtPayloadType.REDEEM_ACTIVATION_TYPE) {
          const disburseJwtPayload = new DisbursementJwtPayloadType(
            payload.sendercommunityuuid as string,
            payload.sendergradidoid as string,
            payload.sendername as string,
            payload.redeemcode as string,
            payload.amount as string,
            payload.memo as string,
          )
          logger.debug(
            'TransactionLinkResolver.queryTransactionLink... disburseJwtPayload=',
            disburseJwtPayload,
          )
          const senderCom = await getCommunityByUuid(disburseJwtPayload.sendercommunityuuid)
          if (!senderCom) {
            throw new LogError(
              'Sender community not found:',
              disburseJwtPayload.sendercommunityuuid,
            )
          }
          if (!senderCom.communityUuid) {
            throw new LogError('Sender community UUID is not set')
          }
          // now with the sender community UUID the jwt token can be verified
          let jwtPayload = await verify(code, senderCom.communityUuid)
          // TODO: as long as the verification fails, fallback to decode
          if (jwtPayload === null) {
            jwtPayload = decode(code)
          }
          logger.debug('TransactionLinkResolver.queryTransactionLink... jwtPayload=', jwtPayload)
          if (jwtPayload !== null && jwtPayload instanceof DisbursementJwtPayloadType) {
            const disburseJwtPayload = new DisbursementJwtPayloadType(jwtPayload.sendercommunityuuid,
              jwtPayload.sendergradidoid,
              jwtPayload.sendername,
              jwtPayload.redeemcode,
              jwtPayload.amount,
              jwtPayload.memo,
            )
            logger.debug(
              'TransactionLinkResolver.queryTransactionLink... disburseJwtPayload=',
              disburseJwtPayload,
            )
            transactionLink.communityName = senderCom.name !== null ? senderCom.name : 'unknown'
            transactionLink.user = new User(null)
            transactionLink.user.alias = disburseJwtPayload.sendername
            transactionLink.amount = new Decimal(disburseJwtPayload.amount)
            transactionLink.memo = disburseJwtPayload.memo
            transactionLink.code = disburseJwtPayload.redeemcode
            logger.debug(
              'TransactionLinkResolver.queryTransactionLink... transactionLink=',
              transactionLink,
            )
            return transactionLink
          }
        } else {
          throw new LogError('Redeem with wrong type of JWT-Token! payload=', payload)
        }
      }
    }
    return transactionLink
  }

  @Authorized([RIGHTS.REDEEM_TRANSACTION_LINK])
  @Mutation(() => Boolean)
  async redeemTransactionLink(
    @Arg('code', () => String) code: string,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const clientTimezoneOffset = getClientTimezoneOffset(context)
    // const homeCom = await DbCommunity.findOneOrFail({ where: { foreign: false } })
    const user = getUser(context)

    if (code.match(/^CL-/)) {
      // acquire lock
      const releaseLock = await TRANSACTIONS_LOCK.acquire()
      try {
        logger.info('redeem contribution link...')
        const now = new Date()
        const queryRunner = getConnection().createQueryRunner()
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
          logger.info('...contribution link found with id', contributionLink.id)
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

          const creations = await getUserCreation(user.id, clientTimezoneOffset)
          logger.info('open creations', creations)
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
        } catch (e) {
          await queryRunner.rollbackTransaction()
          throw new LogError('Creation from contribution link was not successful', e)
        } finally {
          await queryRunner.release()
        }
      } finally {
        releaseLock()
      }
      // trigger to send transaction via dlt-connector
      void sendTransactionsToDltConnector()
      return true
    } else {
      const now = new Date()
      const releaseLinkLock = await TRANSACTION_LINK_LOCK.acquire()
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
          transactionLink,
        )
        await EVENT_TRANSACTION_LINK_REDEEM(
          user,
          { id: transactionLink.userId } as DbUser,
          transactionLink,
          transactionLink.amount,
        )
      } finally {
        releaseLinkLock()
      }
      return true
    }
  }

  @Authorized([RIGHTS.QUERY_REDEEM_JWT])
  @Mutation(() => String)
  async createRedeemJwt(
    @Arg('gradidoID') gradidoID: string,
    @Arg('senderCommunityUuid') senderCommunityUuid: string,
    @Arg('senderCommunityName') senderCommunityName: string,
    @Arg('receiverCommunityUuid') receiverCommunityUuid: string,
    @Arg('code') code: string,
    @Arg('amount') amount: string,
    @Arg('memo') memo: string,
    @Arg('firstName', { nullable: true }) firstName?: string,
    @Arg('alias', { nullable: true }) alias?: string,
  ): Promise<string> {
    logger.debug('TransactionLinkResolver.queryRedeemJwt... args=', {
      gradidoID,
      senderCommunityUuid,
      senderCommunityName,
      receiverCommunityUuid,
      code,
      amount,
      memo,
      firstName,
      alias,
    })

    const disbursementJwtPayloadType = new DisbursementJwtPayloadType(
      senderCommunityUuid,
      gradidoID,
      alias ?? firstName ?? '',
      code,
      amount,
      memo,
    )
    // TODO:encode/sign the jwt normally with the private key of the sender/home community, but interims with uuid
    const homeCom = await getHomeCommunity()
    if (!homeCom.communityUuid) {
      throw new LogError('Home community UUID is not set')
    }
    const redeemJwt = await encode(disbursementJwtPayloadType, homeCom.communityUuid)
    // TODO: encrypt the payload with the public key of the target community
    return redeemJwt
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
    // eslint-disable-next-line type-graphql/wrong-decorator-signature
    @Arg('filters', () => TransactionLinkFilters, { nullable: true })
    filters: TransactionLinkFilters | null, // eslint-disable-line type-graphql/invalid-nullable-input-type
    @Arg('userId', () => Int)
    userId: number,
  ): Promise<TransactionLinkResult> {
    const user = await DbUser.findOne({ where: { id: userId } })
    if (!user) {
      throw new LogError('Could not find requested User', userId)
    }
    return transactionLinkList(paginated, filters, user)
  }
}
