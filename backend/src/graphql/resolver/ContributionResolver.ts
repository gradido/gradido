import { RIGHTS } from '@/auth/RIGHTS'
import {
  Context,
  getClientRequestTime,
  getClientRequestTimeAsString,
  getUser,
} from '@/server/context'
import { backendLogger as logger } from '@/server/logger'
import { Contribution as dbContribution } from '@entity/Contribution'
import { Arg, Args, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { FindOperator, IsNull, getConnection } from '@dbTools/typeorm'
import ContributionArgs from '@arg/ContributionArgs'
import Paginated from '@arg/Paginated'
import { Order } from '@enum/Order'
import { ContributionType } from '@enum/ContributionType'
import { ContributionStatus } from '@enum/ContributionStatus'
import { Contribution, ContributionListResult } from '@model/Contribution'
import { UnconfirmedContribution } from '@model/UnconfirmedContribution'
import { validateContribution, getUserCreation, updateCreations } from './util/creations'
import { MEMO_MAX_CHARS, MEMO_MIN_CHARS } from './const/const'
import {
  Event,
  EventContributionCreate,
  EventContributionDelete,
  EventContributionUpdate,
} from '@/event/Event'
import { eventProtocol } from '@/event/EventProtocolEmitter'
import { cutOffsetFromIsoDateString, isValidDate } from '@/util/utilities'
import { ContributionMonth } from '../model/ContributionMonth'

@Resolver()
export class ContributionResolver {
  @Authorized([RIGHTS.CREATE_CONTRIBUTION])
  @Mutation(() => UnconfirmedContribution)
  async createContribution(
    @Args() { amount, memo, creationDate }: ContributionArgs,
    @Ctx() context: Context,
  ): Promise<UnconfirmedContribution> {
    logger.info(`createContribution(${amount}, ${memo}, ${creationDate})`)
    if (!isValidDate(creationDate)) {
      logger.error(`invalid Date for creationDate=${creationDate}`)
      throw new Error(`invalid Date for creationDate=${creationDate}`)
    }
    const creationDateStringWithoutOffset = cutOffsetFromIsoDateString(
      new Date(creationDate).toISOString(),
    )
    if (memo.length > MEMO_MAX_CHARS) {
      logger.error(`memo text is too long: memo.length=${memo.length} > (${MEMO_MAX_CHARS})`)
      throw new Error(`memo text is too long (${MEMO_MAX_CHARS} characters maximum)`)
    }

    if (memo.length < MEMO_MIN_CHARS) {
      logger.error(`memo text is too short: memo.length=${memo.length} < (${MEMO_MIN_CHARS})`)
      throw new Error(`memo text is too short (${MEMO_MIN_CHARS} characters minimum)`)
    }

    const event = new Event()

    const user = getUser(context)
    logger.info(`by User: ${user.gradidoID}, ${user.firstName}, ${user.lastName})`)
    const clientRequestTimeString = getClientRequestTimeAsString(context)
    const clientRequestTime = new Date(cutOffsetFromIsoDateString(clientRequestTimeString))
    logger.info(
      `clientRequestTime: asString=${clientRequestTimeString}, asDate=${clientRequestTime.toISOString()}`,
    )
    const creations: ContributionMonth[] = await getUserCreation(user.id, clientRequestTime)
    logger.info(`creations: `, creations)
    const creationDateObj = new Date(creationDateStringWithoutOffset)
    validateContribution(creations, amount, creationDateObj, clientRequestTime)

    const contribution = dbContribution.create()
    contribution.userId = user.id
    contribution.amount = amount
    contribution.createdAt = new Date()
    contribution.clientRequestTime = clientRequestTimeString
    contribution.contributionDate = creationDateObj
    contribution.memo = memo
    contribution.contributionType = ContributionType.USER
    contribution.contributionStatus = ContributionStatus.PENDING

    logger.debug('contribution to save', contribution)
    await dbContribution.save(contribution)

    const eventCreateContribution = new EventContributionCreate()
    eventCreateContribution.userId = user.id
    eventCreateContribution.amount = amount
    eventCreateContribution.contributionId = contribution.id
    await eventProtocol.writeEvent(event.setEventContributionCreate(eventCreateContribution))

    return new UnconfirmedContribution(
      contribution,
      user,
      await getUserCreation(user.id, clientRequestTime),
    )
  }

  @Authorized([RIGHTS.DELETE_CONTRIBUTION])
  @Mutation(() => Boolean)
  async deleteContribution(
    @Arg('id', () => Int) id: number,
    @Ctx() context: Context,
  ): Promise<boolean> {
    logger.info(`deleteContribution(${id})`)
    const event = new Event()
    const user = getUser(context)
    logger.info(`by User: ${user.gradidoID}, ${user.firstName}, ${user.lastName})`)
    const contribution = await dbContribution.findOne(id)
    if (!contribution) {
      logger.error('Contribution not found for given id')
      throw new Error('Contribution not found for given id.')
    }
    if (contribution.userId !== user.id) {
      logger.error('Can not delete contribution of another user')
      throw new Error('Can not delete contribution of another user')
    }
    if (contribution.confirmedAt) {
      logger.error('A confirmed contribution can not be deleted')
      throw new Error('A confirmed contribution can not be deleted')
    }

    contribution.contributionStatus = ContributionStatus.DELETED
    contribution.deletedBy = user.id
    contribution.deletedAt = new Date()
    await contribution.save()

    const eventDeleteContribution = new EventContributionDelete()
    eventDeleteContribution.userId = user.id
    eventDeleteContribution.contributionId = contribution.id
    eventDeleteContribution.amount = contribution.amount
    await eventProtocol.writeEvent(event.setEventContributionDelete(eventDeleteContribution))

    const res = await contribution.softRemove()
    return !!res
  }

  @Authorized([RIGHTS.LIST_CONTRIBUTIONS])
  @Query(() => ContributionListResult)
  async listContributions(
    @Args()
    { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
    @Arg('filterConfirmed', () => Boolean)
    filterConfirmed: boolean | null,
    @Ctx() context: Context,
  ): Promise<ContributionListResult> {
    const user = getUser(context)
    const where: {
      userId: number
      confirmedBy?: FindOperator<number> | null
    } = { userId: user.id }

    if (filterConfirmed) where.confirmedBy = IsNull()

    const [contributions, count] = await getConnection()
      .createQueryBuilder()
      .select('c')
      .from(dbContribution, 'c')
      .leftJoinAndSelect('c.messages', 'm')
      .where(where)
      .withDeleted()
      .orderBy('c.createdAt', order)
      .limit(pageSize)
      .offset((currentPage - 1) * pageSize)
      .getManyAndCount()

    return new ContributionListResult(
      count,
      contributions.map((contribution) => new Contribution(contribution, user)),
    )
  }

  @Authorized([RIGHTS.LIST_ALL_CONTRIBUTIONS])
  @Query(() => ContributionListResult)
  async listAllContributions(
    @Args()
    { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
  ): Promise<ContributionListResult> {
    const [dbContributions, count] = await getConnection()
      .createQueryBuilder()
      .select('c')
      .from(dbContribution, 'c')
      .innerJoinAndSelect('c.user', 'u')
      .orderBy('c.createdAt', order)
      .limit(pageSize)
      .offset((currentPage - 1) * pageSize)
      .getManyAndCount()
    return new ContributionListResult(
      count,
      dbContributions.map((contribution) => new Contribution(contribution, contribution.user)),
    )
  }

  @Authorized([RIGHTS.UPDATE_CONTRIBUTION])
  @Mutation(() => UnconfirmedContribution)
  async updateContribution(
    @Arg('contributionId', () => Int)
    contributionId: number,
    @Args() { amount, memo, creationDate }: ContributionArgs,
    @Ctx() context: Context,
  ): Promise<UnconfirmedContribution> {
    logger.info(`updateContribution(${amount}, ${memo}, ${creationDate})`)
    const cutOffsetCreationDateString = cutOffsetFromIsoDateString(
      new Date(creationDate).toISOString(),
    )
    if (memo.length > MEMO_MAX_CHARS) {
      logger.error(`memo text is too long: memo.length=${memo.length} > (${MEMO_MAX_CHARS}`)
      throw new Error(`memo text is too long (${MEMO_MAX_CHARS} characters maximum)`)
    }

    if (memo.length < MEMO_MIN_CHARS) {
      logger.error(`memo text is too short: memo.length=${memo.length} < (${MEMO_MIN_CHARS}`)
      throw new Error(`memo text is too short (${MEMO_MIN_CHARS} characters minimum)`)
    }

    const user = getUser(context)
    logger.info(`by User: ${user.gradidoID}, ${user.firstName}, ${user.lastName})`)
    const clientRequestTimeString = cutOffsetFromIsoDateString(
      getClientRequestTimeAsString(context),
    )
    const clientRequestTime = new Date(clientRequestTimeString)
    logger.info(
      `clientRequestTime: asString=${clientRequestTimeString}, asDate=${clientRequestTime}`,
    )

    const contributionToUpdate = await dbContribution.findOne({
      where: { id: contributionId, confirmedAt: IsNull(), deniedAt: IsNull() },
    })
    if (!contributionToUpdate) {
      logger.error('No contribution found to given id')
      throw new Error('No contribution found to given id.')
    }
    if (contributionToUpdate.userId !== user.id) {
      logger.error('user of the pending contribution and send user does not correspond')
      throw new Error('user of the pending contribution and send user does not correspond')
    }

    const creationDateObj = new Date(cutOffsetCreationDateString)
    let creations = await getUserCreation(user.id, clientRequestTime)
    logger.debug(
      'update 1 creations:',
      creations[0].targetMonth,
      creations[0].amount.toString(),
      creations[1].targetMonth,
      creations[1].amount.toString(),
      creations[2].targetMonth,
      creations[2].amount.toString(),
      creations[3].targetMonth,
      creations[3].amount.toString(),
    )
    if (contributionToUpdate.contributionDate.getMonth() === creationDateObj.getMonth()) {
      creations = updateCreations(creations, contributionToUpdate)
    } else {
      logger.error('Currently the month of the contribution cannot be changed.')
      throw new Error('Currently the month of the contribution cannot be changed.')
    }
    logger.debug(
      'update 2 creations:',
      creations[0].targetMonth,
      creations[0].amount.toString(),
      creations[1].targetMonth,
      creations[1].amount.toString(),
      creations[2].targetMonth,
      creations[2].amount.toString(),
      creations[3].targetMonth,
      creations[3].amount.toString(),
    )

    // all possible cases not to be true are thrown in this function
    validateContribution(creations, amount, creationDateObj, clientRequestTime)
    contributionToUpdate.amount = amount
    contributionToUpdate.memo = memo
    contributionToUpdate.contributionDate = creationDateObj
    contributionToUpdate.clientRequestTime = clientRequestTimeString
    contributionToUpdate.contributionStatus = ContributionStatus.PENDING
    dbContribution.save(contributionToUpdate)

    const event = new Event()

    const eventUpdateContribution = new EventContributionUpdate()
    eventUpdateContribution.userId = user.id
    eventUpdateContribution.contributionId = contributionId
    eventUpdateContribution.amount = amount
    await eventProtocol.writeEvent(event.setEventContributionUpdate(eventUpdateContribution))

    return new UnconfirmedContribution(contributionToUpdate, user, creations)
  }
}
