/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Arg, Args, Authorized, Mutation, Ctx } from 'type-graphql'
import {
  getCustomRepository,
  IsNull,
  Not,
  ObjectLiteral,
  getConnection,
  In,
} from '@dbTools/typeorm'
import { UserAdmin, SearchUsersResult } from '../model/UserAdmin'
import { PendingCreation } from '../model/PendingCreation'
import { CreatePendingCreations } from '../model/CreatePendingCreations'
import { UpdatePendingCreation } from '../model/UpdatePendingCreation'
import { RIGHTS } from '../../auth/RIGHTS'
import { UserRepository } from '../../typeorm/repository/User'
import CreatePendingCreationArgs from '../arg/CreatePendingCreationArgs'
import UpdatePendingCreationArgs from '../arg/UpdatePendingCreationArgs'
import SearchUsersArgs from '../arg/SearchUsersArgs'
import { Transaction } from '@entity/Transaction'
import { UserTransaction } from '@entity/UserTransaction'
import { UserTransactionRepository } from '../../typeorm/repository/UserTransaction'
import { calculateDecay } from '../../util/decay'
import { AdminPendingCreation } from '@entity/AdminPendingCreation'
import { hasElopageBuys } from '../../util/hasElopageBuys'
import { LoginEmailOptIn } from '@entity/LoginEmailOptIn'
import { User } from '@entity/User'
import { TransactionTypeId } from '../enum/TransactionTypeId'
import { Balance } from '@entity/Balance'
// import { isNullableType } from 'graphql'

// const EMAIL_OPT_IN_REGISTER = 1
// const EMAIL_OPT_UNKNOWN = 3 // elopage?

@Resolver()
export class AdminResolver {
  @Authorized([RIGHTS.SEARCH_USERS])
  @Query(() => SearchUsersResult)
  async searchUsers(
    @Args()
    {
      searchText,
      currentPage = 1,
      pageSize = 25,
      notActivated = false,
      isDeleted = false,
    }: SearchUsersArgs,
  ): Promise<SearchUsersResult> {
    const userRepository = getCustomRepository(UserRepository)

    const filterCriteria: ObjectLiteral[] = []
    if (notActivated) {
      filterCriteria.push({ emailChecked: false })
    }

    if (isDeleted) {
      filterCriteria.push({ deletedAt: Not(IsNull()) })
    }

    const userFields = ['id', 'firstName', 'lastName', 'email', 'emailChecked', 'deletedAt']
    const [users, count] = await userRepository.findBySearchCriteriaPagedFiltered(
      userFields.map((fieldName) => {
        return 'user.' + fieldName
      }),
      searchText,
      filterCriteria,
      currentPage,
      pageSize,
    )

    const creations = await getUserCreations(users.map((u) => u.id))

    const adminUsers = await Promise.all(
      users.map(async (user) => {
        let emailConfirmationSend = ''
        if (!user.emailChecked) {
          const emailOptIn = await LoginEmailOptIn.findOne(
            {
              userId: user.id,
            },
            {
              order: {
                updatedAt: 'DESC',
                createdAt: 'DESC',
              },
              select: ['updatedAt', 'createdAt'],
            },
          )
          if (emailOptIn) {
            if (emailOptIn.updatedAt) {
              emailConfirmationSend = emailOptIn.updatedAt.toISOString()
            } else {
              emailConfirmationSend = emailOptIn.createdAt.toISOString()
            }
          }
        }
        const userCreations = creations.find((c) => c.id === user.id)
        const adminUser = new UserAdmin(
          user,
          userCreations ? userCreations.creations : [1000, 1000, 1000],
          await hasElopageBuys(user.email),
          emailConfirmationSend,
        )
        return adminUser
      }),
    )
    return {
      userCount: count,
      userList: adminUsers,
    }
  }

  @Authorized([RIGHTS.DELETE_USER])
  @Mutation(() => Date, { nullable: true })
  async deleteUser(@Arg('userId') userId: number, @Ctx() context: any): Promise<Date | null> {
    const user = await User.findOne({ id: userId })
    // user exists ?
    if (!user) {
      throw new Error(`Could not find user with userId: ${userId}`)
    }
    // moderator user disabled own account?
    const userRepository = getCustomRepository(UserRepository)
    const moderatorUser = await userRepository.findByPubkeyHex(context.pubKey)
    if (moderatorUser.id === userId) {
      throw new Error('Moderator can not delete his own account!')
    }
    // soft-delete user
    await user.softRemove()
    const newUser = await User.findOne({ id: userId }, { withDeleted: true })
    return newUser ? newUser.deletedAt : null
  }

  @Authorized([RIGHTS.UNDELETE_USER])
  @Mutation(() => Date, { nullable: true })
  async unDeleteUser(@Arg('userId') userId: number): Promise<Date | null> {
    const user = await User.findOne({ id: userId }, { withDeleted: true })
    // user exists ?
    if (!user) {
      throw new Error(`Could not find user with userId: ${userId}`)
    }
    // recover user account
    await user.recover()
    return null
  }

  @Authorized([RIGHTS.CREATE_PENDING_CREATION])
  @Mutation(() => [Number])
  async createPendingCreation(
    @Args() { email, amount, memo, creationDate, moderator }: CreatePendingCreationArgs,
  ): Promise<number[]> {
    const user = await User.findOne({ email }, { withDeleted: true })
    if (!user) {
      throw new Error(`Could not find user with email: ${email}`)
    }
    if (user.deletedAt) {
      throw new Error('This user was deleted. Cannot make a creation.')
    }
    if (!user.emailChecked) {
      throw new Error('Creation could not be saved, Email is not activated')
    }
    const creations = await getUserCreation(user.id)
    const creationDateObj = new Date(creationDate)
    if (isCreationValid(creations, amount, creationDateObj)) {
      const adminPendingCreation = AdminPendingCreation.create()
      adminPendingCreation.userId = user.id
      adminPendingCreation.amount = BigInt(amount * 10000)
      adminPendingCreation.created = new Date()
      adminPendingCreation.date = creationDateObj
      adminPendingCreation.memo = memo
      adminPendingCreation.moderator = moderator

      await AdminPendingCreation.save(adminPendingCreation)
    }
    return getUserCreation(user.id)
  }

  @Authorized([RIGHTS.CREATE_PENDING_CREATION])
  @Mutation(() => CreatePendingCreations)
  async createPendingCreations(
    @Arg('pendingCreations', () => [CreatePendingCreationArgs])
    pendingCreations: CreatePendingCreationArgs[],
  ): Promise<CreatePendingCreations> {
    let success = false
    const successfulCreation: string[] = []
    const failedCreation: string[] = []
    for (const pendingCreation of pendingCreations) {
      await this.createPendingCreation(pendingCreation)
        .then(() => {
          successfulCreation.push(pendingCreation.email)
          success = true
        })
        .catch(() => {
          failedCreation.push(pendingCreation.email)
        })
    }
    return {
      success,
      successfulCreation,
      failedCreation,
    }
  }

  @Authorized([RIGHTS.UPDATE_PENDING_CREATION])
  @Mutation(() => UpdatePendingCreation)
  async updatePendingCreation(
    @Args() { id, email, amount, memo, creationDate, moderator }: UpdatePendingCreationArgs,
  ): Promise<UpdatePendingCreation> {
    const user = await User.findOne({ email }, { withDeleted: true })
    if (!user) {
      throw new Error(`Could not find user with email: ${email}`)
    }
    if (user.deletedAt) {
      throw new Error(`User was deleted (${email})`)
    }

    const pendingCreationToUpdate = await AdminPendingCreation.findOneOrFail({ id })

    if (pendingCreationToUpdate.userId !== user.id) {
      throw new Error('user of the pending creation and send user does not correspond')
    }

    const creationDateObj = new Date(creationDate)
    let creations = await getUserCreation(user.id)
    if (pendingCreationToUpdate.date.getMonth() === creationDateObj.getMonth()) {
      creations = updateCreations(creations, pendingCreationToUpdate)
    }

    if (!isCreationValid(creations, amount, creationDateObj)) {
      throw new Error('Creation is not valid')
    }
    pendingCreationToUpdate.amount = BigInt(amount * 10000)
    pendingCreationToUpdate.memo = memo
    pendingCreationToUpdate.date = new Date(creationDate)
    pendingCreationToUpdate.moderator = moderator

    await AdminPendingCreation.save(pendingCreationToUpdate)
    const result = new UpdatePendingCreation()
    result.amount = parseInt(amount.toString())
    result.memo = pendingCreationToUpdate.memo
    result.date = pendingCreationToUpdate.date
    result.moderator = pendingCreationToUpdate.moderator

    result.creation = await getUserCreation(user.id)

    return result
  }

  @Authorized([RIGHTS.SEARCH_PENDING_CREATION])
  @Query(() => [PendingCreation])
  async getPendingCreations(): Promise<PendingCreation[]> {
    const pendingCreations = await AdminPendingCreation.find()
    if (pendingCreations.length === 0) {
      return []
    }

    const userIds = pendingCreations.map((p) => p.userId)
    const userCreations = await getUserCreations(userIds)
    const users = await User.find({ id: In(userIds) })

    return pendingCreations.map((pendingCreation) => {
      const user = users.find((u) => u.id === pendingCreation.userId)
      const creation = userCreations.find((c) => c.id === pendingCreation.userId)

      return {
        ...pendingCreation,
        amount: Number(parseInt(pendingCreation.amount.toString()) / 10000),
        firstName: user ? user.firstName : '',
        lastName: user ? user.lastName : '',
        email: user ? user.email : '',
        creation: creation ? creation.creations : [1000, 1000, 1000],
      }
    })
  }

  @Authorized([RIGHTS.DELETE_PENDING_CREATION])
  @Mutation(() => Boolean)
  async deletePendingCreation(@Arg('id') id: number): Promise<boolean> {
    const entity = await AdminPendingCreation.findOneOrFail(id)
    const res = await AdminPendingCreation.delete(entity)
    return !!res
  }

  @Authorized([RIGHTS.CONFIRM_PENDING_CREATION])
  @Mutation(() => Boolean)
  async confirmPendingCreation(@Arg('id') id: number, @Ctx() context: any): Promise<boolean> {
    const pendingCreation = await AdminPendingCreation.findOneOrFail(id)
    const userRepository = getCustomRepository(UserRepository)
    const moderatorUser = await userRepository.findByPubkeyHex(context.pubKey)
    if (moderatorUser.id === pendingCreation.userId)
      throw new Error('Moderator can not confirm own pending creation')

    const creations = await getUserCreation(pendingCreation.userId, false)
    if (!isCreationValid(creations, Number(pendingCreation.amount) / 10000, pendingCreation.date)) {
      throw new Error('Creation is not valid!!')
    }

    const receivedCallDate = new Date()
    let transaction = new Transaction()
    transaction.transactionTypeId = TransactionTypeId.CREATION
    transaction.memo = pendingCreation.memo
    transaction.received = receivedCallDate
    transaction.userId = pendingCreation.userId
    transaction.amount = BigInt(parseInt(pendingCreation.amount.toString()))
    transaction.creationDate = pendingCreation.date
    transaction = await transaction.save()
    if (!transaction) throw new Error('Could not create transaction')

    const userTransactionRepository = getCustomRepository(UserTransactionRepository)
    const lastUserTransaction = await userTransactionRepository.findLastForUser(
      pendingCreation.userId,
    )
    let newBalance = 0
    if (!lastUserTransaction) {
      newBalance = 0
    } else {
      newBalance = calculateDecay(
        lastUserTransaction.balance,
        lastUserTransaction.balanceDate,
        receivedCallDate,
      ).balance
    }
    newBalance = Number(newBalance) + Number(parseInt(pendingCreation.amount.toString()))

    const newUserTransaction = new UserTransaction()
    newUserTransaction.userId = pendingCreation.userId
    newUserTransaction.transactionId = transaction.id
    newUserTransaction.transactionTypeId = transaction.transactionTypeId
    newUserTransaction.balance = Number(newBalance)
    newUserTransaction.balanceDate = transaction.received

    await userTransactionRepository.save(newUserTransaction).catch((error) => {
      throw new Error('Error saving user transaction: ' + error)
    })

    let userBalance = await Balance.findOne({ userId: pendingCreation.userId })
    if (!userBalance) {
      userBalance = new Balance()
      userBalance.userId = pendingCreation.userId
    }
    userBalance.amount = Number(newBalance)
    userBalance.modified = receivedCallDate
    userBalance.recordDate = receivedCallDate
    await userBalance.save()
    await AdminPendingCreation.delete(pendingCreation)

    return true
  }
}

interface CreationMap {
  id: number
  creations: number[]
}

async function getUserCreation(id: number, includePending = true): Promise<number[]> {
  const creations = await getUserCreations([id], includePending)
  return creations[0] ? creations[0].creations : [1000, 1000, 1000]
}

async function getUserCreations(ids: number[], includePending = true): Promise<CreationMap[]> {
  const months = getCreationMonths()

  const queryRunner = getConnection().createQueryRunner()
  await queryRunner.connect()

  const dateFilter = 'last_day(curdate() - interval 3 month) + interval 1 day'

  const unionString = includePending
    ? `
    UNION
      SELECT date AS date, amount AS amount, userId AS userId FROM admin_pending_creations
        WHERE userId IN (${ids.toString()})
        AND date >= ${dateFilter}`
    : ''

  const unionQuery = await queryRunner.manager.query(`
    SELECT MONTH(date) AS month, sum(amount) AS sum, userId AS id FROM
      (SELECT creation_date AS date, amount AS amount, user_id AS userId FROM transactions
        WHERE user_id IN (${ids.toString()})
        AND transaction_type_id = ${TransactionTypeId.CREATION}
        AND creation_date >= ${dateFilter}
      ${unionString}) AS result
    GROUP BY month, userId
    ORDER BY date DESC
  `)

  await queryRunner.release()

  return ids.map((id) => {
    return {
      id,
      creations: months.map((month) => {
        const creation = unionQuery.find(
          (raw: { month: string; id: string; creation: number[] }) =>
            parseInt(raw.month) === month && parseInt(raw.id) === id,
        )
        return 1000 - (creation ? Number(creation.sum) / 10000 : 0)
      }),
    }
  })
}

function updateCreations(creations: number[], pendingCreation: AdminPendingCreation): number[] {
  const index = getCreationIndex(pendingCreation.date.getMonth())

  if (index < 0) {
    throw new Error('You cannot create GDD for a month older than the last three months.')
  }
  creations[index] += parseInt(pendingCreation.amount.toString())
  return creations
}

function isCreationValid(creations: number[], amount: number, creationDate: Date) {
  const index = getCreationIndex(creationDate.getMonth())

  if (index < 0) {
    throw new Error(`No Creation found!`)
  }

  if (amount > creations[index]) {
    throw new Error(
      `The amount (${amount} GDD) to be created exceeds the available amount (${creations[index]} GDD) for this month.`,
    )
  }

  return true
}

const getCreationMonths = (): number[] => {
  const now = new Date(Date.now())
  return [
    now.getMonth() + 1,
    new Date(now.getFullYear(), now.getMonth() - 1, 1).getMonth() + 1,
    new Date(now.getFullYear(), now.getMonth() - 2, 1).getMonth() + 1,
  ].reverse()
}

const getCreationIndex = (month: number): number => {
  return getCreationMonths().findIndex((el) => el === month + 1)
}
