/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Arg, Args, Authorized, Mutation, Ctx } from 'type-graphql'
import { getCustomRepository, Raw } from '@dbTools/typeorm'
import { UserAdmin, SearchUsersResult } from '../model/UserAdmin'
import { PendingCreation } from '../model/PendingCreation'
import { CreatePendingCreations } from '../model/CreatePendingCreations'
import { UpdatePendingCreation } from '../model/UpdatePendingCreation'
import { RIGHTS } from '../../auth/RIGHTS'
import { TransactionRepository } from '../../typeorm/repository/Transaction'
import { TransactionCreationRepository } from '../../typeorm/repository/TransactionCreation'
import { UserRepository } from '../../typeorm/repository/User'
import CreatePendingCreationArgs from '../arg/CreatePendingCreationArgs'
import UpdatePendingCreationArgs from '../arg/UpdatePendingCreationArgs'
import SearchUsersArgs from '../arg/SearchUsersArgs'
import moment from 'moment'
import { Transaction } from '@entity/Transaction'
import { TransactionCreation } from '@entity/TransactionCreation'
import { UserTransaction } from '@entity/UserTransaction'
import { UserTransactionRepository } from '../../typeorm/repository/UserTransaction'
import { BalanceRepository } from '../../typeorm/repository/Balance'
import { calculateDecay } from '../../util/decay'
import { LoginUserRepository } from '../../typeorm/repository/LoginUser'
import { AdminPendingCreation } from '@entity/AdminPendingCreation'

@Resolver()
export class AdminResolver {
  @Authorized([RIGHTS.SEARCH_USERS])
  @Query(() => SearchUsersResult)
  async searchUsers(
    @Args() { searchText, currentPage = 1, pageSize = 25, notActivated = false }: SearchUsersArgs,
  ): Promise<SearchUsersResult> {
    const userRepository = getCustomRepository(UserRepository)
    const users = await userRepository.findBySearchCriteria(searchText)
    let adminUsers = await Promise.all(
      users.map(async (user) => {
        const adminUser = new UserAdmin()
        adminUser.userId = user.id
        adminUser.firstName = user.firstName
        adminUser.lastName = user.lastName
        adminUser.email = user.email
        adminUser.creation = await getUserCreations(user.id)
        adminUser.emailChecked = await hasActivatedEmail(user.email)
        return adminUser
      }),
    )
    if (notActivated) adminUsers = adminUsers.filter((u) => !u.emailChecked)
    const first = (currentPage - 1) * pageSize
    return {
      userCount: adminUsers.length,
      userList: adminUsers.slice(first, first + pageSize),
    }
  }

  @Authorized([RIGHTS.CREATE_PENDING_CREATION])
  @Mutation(() => [Number])
  async createPendingCreation(
    @Args() { email, amount, memo, creationDate, moderator }: CreatePendingCreationArgs,
  ): Promise<number[]> {
    const userRepository = getCustomRepository(UserRepository)
    const user = await userRepository.findByEmail(email)
    const isActivated = await hasActivatedEmail(user.email)
    if (!isActivated) {
      throw new Error('Creation could not be saved, Email is not activated')
    }
    const creations = await getUserCreations(user.id)
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
    return getUserCreations(user.id)
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
    const userRepository = getCustomRepository(UserRepository)
    const user = await userRepository.findByEmail(email)

    const pendingCreationToUpdate = await AdminPendingCreation.findOneOrFail({ id })

    if (pendingCreationToUpdate.userId !== user.id) {
      throw new Error('user of the pending creation and send user does not correspond')
    }

    const creationDateObj = new Date(creationDate)
    let creations = await getUserCreations(user.id)
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
    result.creation = await getUserCreations(user.id)

    return result
  }

  @Authorized([RIGHTS.SEARCH_PENDING_CREATION])
  @Query(() => [PendingCreation])
  async getPendingCreations(): Promise<PendingCreation[]> {
    const pendingCreations = await AdminPendingCreation.find()

    const pendingCreationsPromise = await Promise.all(
      pendingCreations.map(async (pendingCreation) => {
        const userRepository = getCustomRepository(UserRepository)
        const user = await userRepository.findOneOrFail({ id: pendingCreation.userId })

        const parsedAmount = Number(parseInt(pendingCreation.amount.toString()) / 10000)
        // pendingCreation.amount = parsedAmount
        const newPendingCreation = {
          ...pendingCreation,
          amount: parsedAmount,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          creation: await getUserCreations(user.id),
        }

        return newPendingCreation
      }),
    )
    return pendingCreationsPromise.reverse()
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

    const transactionRepository = getCustomRepository(TransactionRepository)
    const receivedCallDate = new Date()
    let transaction = new Transaction()
    transaction.transactionTypeId = 1
    transaction.memo = pendingCreation.memo
    transaction.received = receivedCallDate
    transaction = await transactionRepository.save(transaction)
    if (!transaction) throw new Error('Could not create transaction')

    const transactionCreationRepository = getCustomRepository(TransactionCreationRepository)
    let transactionCreation = new TransactionCreation()
    transactionCreation.transactionId = transaction.id
    transactionCreation.userId = pendingCreation.userId
    transactionCreation.amount = parseInt(pendingCreation.amount.toString())
    transactionCreation.targetDate = pendingCreation.date
    transactionCreation = await transactionCreationRepository.save(transactionCreation)
    if (!transactionCreation) throw new Error('Could not create transactionCreation')

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

    const balanceRepository = getCustomRepository(BalanceRepository)
    let userBalance = await balanceRepository.findByUser(pendingCreation.userId)

    if (!userBalance) userBalance = balanceRepository.create()
    userBalance.userId = pendingCreation.userId
    userBalance.amount = Number(newBalance)
    userBalance.modified = receivedCallDate
    userBalance.recordDate = receivedCallDate
    await balanceRepository.save(userBalance)
    await AdminPendingCreation.delete(pendingCreation)

    return true
  }
}

async function getUserCreations(id: number): Promise<number[]> {
  const dateNextMonth = moment().add(1, 'month').format('YYYY-MM') + '-01'
  const dateBeforeLastMonth = moment().subtract(2, 'month').format('YYYY-MM') + '-01'
  const beforeLastMonthNumber = moment().subtract(2, 'month').format('M')
  const lastMonthNumber = moment().subtract(1, 'month').format('M')
  const currentMonthNumber = moment().format('M')

  const transactionCreationRepository = getCustomRepository(TransactionCreationRepository)
  const createdAmountsQuery = await transactionCreationRepository
    .createQueryBuilder('transaction_creations')
    .select('MONTH(transaction_creations.target_date)', 'target_month')
    .addSelect('SUM(transaction_creations.amount)', 'sum')
    .where('transaction_creations.state_user_id = :id', { id })
    .andWhere({
      targetDate: Raw((alias) => `${alias} >= :date and ${alias} < :endDate`, {
        date: dateBeforeLastMonth,
        endDate: dateNextMonth,
      }),
    })
    .groupBy('target_month')
    .orderBy('target_month', 'ASC')
    .getRawMany()

  const pendingAmountsQuery = await AdminPendingCreation.createQueryBuilder(
    'admin_pending_creations',
  )
    .select('MONTH(admin_pending_creations.date)', 'target_month')
    .addSelect('SUM(admin_pending_creations.amount)', 'sum')
    .where('admin_pending_creations.userId = :id', { id })
    .andWhere({
      date: Raw((alias) => `${alias} >= :date and ${alias} < :endDate`, {
        date: dateBeforeLastMonth,
        endDate: dateNextMonth,
      }),
    })
    .groupBy('target_month')
    .orderBy('target_month', 'ASC')
    .getRawMany()

  const map = new Map()
  if (Array.isArray(createdAmountsQuery) && createdAmountsQuery.length > 0) {
    createdAmountsQuery.forEach((createdAmount) => {
      if (!map.has(createdAmount.target_month)) {
        map.set(createdAmount.target_month, createdAmount.sum)
      } else {
        const store = map.get(createdAmount.target_month)
        map.set(createdAmount.target_month, Number(store) + Number(createdAmount.sum))
      }
    })
  }

  if (Array.isArray(pendingAmountsQuery) && pendingAmountsQuery.length > 0) {
    pendingAmountsQuery.forEach((pendingAmount) => {
      if (!map.has(pendingAmount.target_month)) {
        map.set(pendingAmount.target_month, pendingAmount.sum)
      } else {
        const store = map.get(pendingAmount.target_month)
        map.set(pendingAmount.target_month, Number(store) + Number(pendingAmount.sum))
      }
    })
  }
  const usedCreationBeforeLastMonth = map.get(Number(beforeLastMonthNumber))
    ? Number(map.get(Number(beforeLastMonthNumber))) / 10000
    : 0
  const usedCreationLastMonth = map.get(Number(lastMonthNumber))
    ? Number(map.get(Number(lastMonthNumber))) / 10000
    : 0

  const usedCreationCurrentMonth = map.get(Number(currentMonthNumber))
    ? Number(map.get(Number(currentMonthNumber))) / 10000
    : 0

  return [
    1000 - usedCreationBeforeLastMonth,
    1000 - usedCreationLastMonth,
    1000 - usedCreationCurrentMonth,
  ]
}

function updateCreations(creations: number[], pendingCreation: AdminPendingCreation): number[] {
  const dateMonth = moment().format('YYYY-MM')
  const dateLastMonth = moment().subtract(1, 'month').format('YYYY-MM')
  const dateBeforeLastMonth = moment().subtract(2, 'month').format('YYYY-MM')
  const creationDateMonth = moment(pendingCreation.date).format('YYYY-MM')

  switch (creationDateMonth) {
    case dateMonth:
      creations[2] += parseInt(pendingCreation.amount.toString())
      break
    case dateLastMonth:
      creations[1] += parseInt(pendingCreation.amount.toString())
      break
    case dateBeforeLastMonth:
      creations[0] += parseInt(pendingCreation.amount.toString())
      break
    default:
      throw new Error('UpdatedCreationDate is not in the last three months')
  }
  return creations
}

function isCreationValid(creations: number[], amount: number, creationDate: Date) {
  const dateMonth = moment().format('YYYY-MM')
  const dateLastMonth = moment().subtract(1, 'month').format('YYYY-MM')
  const dateBeforeLastMonth = moment().subtract(2, 'month').format('YYYY-MM')
  const creationDateMonth = moment(creationDate).format('YYYY-MM')

  let openCreation
  switch (creationDateMonth) {
    case dateMonth:
      openCreation = creations[2]
      break
    case dateLastMonth:
      openCreation = creations[1]
      break
    case dateBeforeLastMonth:
      openCreation = creations[0]
      break
    default:
      throw new Error('CreationDate is not in last three months')
  }

  if (openCreation < amount) {
    throw new Error(`Open creation (${openCreation}) is less than amount (${amount})`)
  }
  return true
}

async function hasActivatedEmail(email: string): Promise<boolean> {
  const repository = getCustomRepository(LoginUserRepository)
  const user = await repository.findByEmail(email)
  return user ? user.emailChecked : false
}
