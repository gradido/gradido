// AI-GENERATED — not an architecture reference
import { ContributionStatus } from '@enum/ContributionStatus'
import { contributionTransaction, sendContributionConfirmedEmail, TransactionTypeId } from 'core'
import {
  AppDatabase,
  Contribution as DbContribution,
  Transaction as DbTransaction,
  User as DbUser,
  getLastTransaction,
} from 'database'
import { getLogger } from 'log4js'
import { Mutex } from 'redis-semaphore'
import { Decay, DecayCalculationType, GradidoUnit } from 'shared'

import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { PublishNameLogic } from '@/data/PublishName.logic'
import { EVENT_ADMIN_CONTRIBUTION_CONFIRM } from '@/event/Events'
import { LogError } from '@/server/LogError'

import { contributionFrontendLink } from './contributions'
import { getUserCreation, validateContribution } from './creations'

const db = AppDatabase.getInstance()

// Same log4js category as the resolver this was lifted out of, so the same lines keep
// arriving under the same name.
const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ContributionResolver`)

/**
 * Books a pending contribution and records `signer` as the one who confirmed it: on the
 * contribution row (`confirmedBy`), on both sides of the transaction, as the sender alias
 * of the confirmation email, and as the signer of the DLT transaction.
 *
 * The signer is a parameter, not something read off the GraphQL context, so a caller that
 * confirms in somebody else's name can say whose name that is. `confirmContribution`
 * passes the logged-in moderator and is the only caller today.
 *
 * Whether the signer is allowed to reach this contribution at all is the caller's
 * question — `confirmContribution` answers it with assertContributionInModeratorScope
 * before it calls here.
 */
export const confirmContributionAs = async (
  id: number,
  signer: DbUser,
  clientTimezoneOffset: number,
): Promise<void> => {
  const logger = createLogger()
  logger.addContext('contribution', id)
  // acquire lock
  const mutex = new Mutex(db.getRedisClient(), 'TRANSACTIONS_LOCK')
  await mutex.acquire()

  try {
    const contribution = await DbContribution.findOne({
      where: { id },
      relations: { user: { emailContact: true } },
    })
    if (!contribution) {
      throw new LogError('Contribution not found', id)
    }
    if (contribution.confirmedAt) {
      throw new LogError('Contribution already confirmed', id)
    }
    if (contribution.contributionStatus === 'DENIED') {
      throw new LogError('Contribution already denied', id)
    }

    if (signer.id === contribution.userId) {
      throw new LogError('Moderator can not confirm own contribution')
    }
    const user = contribution.user
    if (user.deletedAt) {
      throw new LogError('Can not confirm contribution since the user was deleted')
    }
    const receivedCallDate = new Date()
    const dltTransactionPromise = contributionTransaction(contribution, signer, receivedCallDate)
    const creations = await getUserCreation(contribution.userId, clientTimezoneOffset, false)
    validateContribution(
      creations,
      contribution.amount,
      contribution.contributionDate,
      clientTimezoneOffset,
    )

    const queryRunner = db.getDataSource().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('REPEATABLE READ') // 'READ COMMITTED')
    const lastTransaction = await getLastTransaction(contribution.userId)
    logger.info('lastTransaction ID', lastTransaction ? lastTransaction.id : 'undefined')

    try {
      let newBalance = new GradidoUnit(0n)
      let decay: Decay | null = null
      if (lastTransaction) {
        decay = lastTransaction.balance.calculateDecay(
          lastTransaction.balanceDate,
          receivedCallDate,
        )
        newBalance = decay.balance
      }
      newBalance = newBalance.add(contribution.amount)

      let transaction = new DbTransaction()
      transaction.typeId = TransactionTypeId.CREATION
      transaction.memo = contribution.memo
      transaction.userId = contribution.userId
      transaction.userGradidoID = user.gradidoID
      // The alias, not the real name (NU-020/NU-021): a booking is permanent, so a
      // name written here outlives every later display fix. Same convention as the
      // send/receive path in TransactionResolver. Through the shared rule rather than
      // read off the column: in production every local user has an alias (migration
      // 0116 filled them, createUser has assigned one since #3645), but a SEEDED
      // environment has moderators without -- and a booking that stored null there
      // would carry no public name for good.
      transaction.userName = new PublishNameLogic(user).getPublicAlias()
      transaction.userCommunityUuid = user.communityUuid
      transaction.linkedUserId = signer.id
      transaction.linkedUserGradidoID = signer.gradidoID
      transaction.linkedUserName = new PublishNameLogic(signer).getPublicAlias()
      transaction.linkedUserCommunityUuid = signer.communityUuid
      transaction.previous = lastTransaction ? lastTransaction.id : null
      transaction.amount = contribution.amount
      transaction.creationDate = contribution.contributionDate
      transaction.balance = newBalance
      transaction.balanceDate = receivedCallDate
      transaction.decay = decay ? decay.decay : new GradidoUnit(0n)
      transaction.decayStart = decay ? decay.start : null
      transaction.decayCalculationType = DecayCalculationType.NATIVE_C_FIXED_FACTOR_INTEGER
      transaction = await queryRunner.manager.save(DbTransaction, transaction)

      contribution.confirmedAt = receivedCallDate
      contribution.confirmedBy = signer.id
      contribution.transactionId = transaction.id
      contribution.contributionStatus = ContributionStatus.CONFIRMED
      await queryRunner.manager.update(DbContribution, { id: contribution.id }, contribution)

      await queryRunner.commitTransaction()

      logger.info('creation commited successfuly.')
      await sendContributionConfirmedEmail({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailContact.email,
        language: user.language,
        senderAlias: new PublishNameLogic(signer).getPublicAlias(),
        contributionMemo: contribution.memo,
        contributionAmount: contribution.amount,
        contributionFrontendLink: await contributionFrontendLink(
          contribution.id,
          contribution.createdAt,
        ),
      })

      // update transaction id in dlt transaction tables
      // wait for finishing transaction by dlt-connector/hiero
      const dltStartTime = new Date()
      const dltTransaction = await dltTransactionPromise
      if (dltTransaction) {
        dltTransaction.transactionId = transaction.id
        await dltTransaction.save()
      }
      const dltEndTime = new Date()
      logger.debug(
        `dlt-connector contribution finished in ${dltEndTime.getTime() - dltStartTime.getTime()} ms`,
      )
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw new LogError('Creation was not successful', e)
    } finally {
      await queryRunner.release()
    }
    await EVENT_ADMIN_CONTRIBUTION_CONFIRM(user, signer, contribution, contribution.amount)
  } finally {
    // releaseLock()
    await mutex.release()
  }
}
