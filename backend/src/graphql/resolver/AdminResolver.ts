import { Resolver, Query, Arg, Args, Authorized, Mutation } from 'type-graphql'
import { getCustomRepository, Raw } from 'typeorm'
import { UserAdmin } from '../model/UserAdmin'
import { PendingCreation } from '../model/PendingCreation'
import { CreatePendingCreations } from '../model/CreatePendingCreations'
import { UpdatePendingCreation } from '../model/UpdatePendingCreation'
import { RIGHTS } from '../../auth/RIGHTS'
import { TransactionRepository } from '../../typeorm/repository/Transaction'
import { TransactionCreationRepository } from '../../typeorm/repository/TransactionCreation'
import { LoginPendingTasksAdminRepository } from '../../typeorm/repository/LoginPendingTasksAdmin'
import { UserRepository } from '../../typeorm/repository/User'
import CreatePendingCreationArgs from '../arg/CreatePendingCreationArgs'
import UpdatePendingCreationArgs from '../arg/UpdatePendingCreationArgs'
import moment from 'moment'
import { Transaction } from '@entity/Transaction'
import { TransactionCreation } from '@entity/TransactionCreation'
import { UserTransaction } from '@entity/UserTransaction'
import { UserTransactionRepository } from '../../typeorm/repository/UserTransaction'
import { BalanceRepository } from '../../typeorm/repository/Balance'
import { calculateDecay } from '../../util/decay'
import { LoginUserRepository } from '../../typeorm/repository/LoginUser'

@Resolver()
export class AdminResolver {
  @Authorized([RIGHTS.SEARCH_USERS])
  @Query(() => [UserAdmin])
  async searchUsers(@Arg('searchText') searchText: string): Promise<UserAdmin[]> {
    const userRepository = getCustomRepository(UserRepository)
    const users = await userRepository.findBySearchCriteria(searchText)
    const adminUsers = await Promise.all(
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
    return adminUsers
  }

  @Authorized([RIGHTS.CREATE_PENDING_CREATION])
  @Mutation(() => [Number])
  async createPendingCreation(
    @Args() { email, amount, memo, creationDate, moderator }: CreatePendingCreationArgs,
  ): Promise<number[]> {
    const userRepository = getCustomRepository(UserRepository)
    const user = await userRepository.findByEmail(email)

    const creations = await getUserCreations(user.id)
    const creationDateObj = new Date(creationDate)
    if (isCreationValid(creations, amount, creationDateObj)) {
      const loginPendingTasksAdminRepository = getCustomRepository(LoginPendingTasksAdminRepository)
      const loginPendingTaskAdmin = loginPendingTasksAdminRepository.create()
      loginPendingTaskAdmin.userId = user.id
      loginPendingTaskAdmin.amount = BigInt(amount * 10000)
      loginPendingTaskAdmin.created = new Date()
      loginPendingTaskAdmin.date = creationDateObj
      loginPendingTaskAdmin.memo = memo
      loginPendingTaskAdmin.moderator = moderator

      loginPendingTasksAdminRepository.save(loginPendingTaskAdmin)
    }
    return await getUserCreations(user.id)
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

    const loginPendingTasksAdminRepository = getCustomRepository(LoginPendingTasksAdminRepository)
    const updatedCreation = await loginPendingTasksAdminRepository.findOneOrFail({ id })

    if (updatedCreation.userId !== user.id)
      throw new Error('user of the pending creation and send user does not correspond')

    updatedCreation.amount = BigInt(amount * 10000)
    updatedCreation.memo = memo
    updatedCreation.date = new Date(creationDate)
    updatedCreation.moderator = moderator

    await loginPendingTasksAdminRepository.save(updatedCreation)
    const result = new UpdatePendingCreation()
    result.amount = parseInt(amount.toString())
    result.memo = updatedCreation.memo
    result.date = updatedCreation.date
    result.moderator = updatedCreation.moderator
    result.creation = await getUserCreations(user.id)

    return result
  }

  @Authorized([RIGHTS.SEARCH_PENDING_CREATION])
  @Query(() => [PendingCreation])
  async getPendingCreations(): Promise<PendingCreation[]> {
    const loginPendingTasksAdminRepository = getCustomRepository(LoginPendingTasksAdminRepository)
    const pendingCreations = await loginPendingTasksAdminRepository.find()

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
    const loginPendingTasksAdminRepository = getCustomRepository(LoginPendingTasksAdminRepository)
    const entity = await loginPendingTasksAdminRepository.findOneOrFail(id)
    const res = await loginPendingTasksAdminRepository.delete(entity)
    return !!res
  }

  @Mutation(() => Boolean)
  async confirmPendingCreation(@Arg('id') id: number): Promise<boolean> {
    const loginPendingTasksAdminRepository = getCustomRepository(LoginPendingTasksAdminRepository)
    const pendingCreation = await loginPendingTasksAdminRepository.findOneOrFail(id)

    const transactionRepository = getCustomRepository(TransactionRepository)
    const receivedCallDate = new Date()
    let transaction = new Transaction()
    transaction.transactionTypeId = 1
    transaction.memo = pendingCreation.memo
    transaction.received = receivedCallDate
    transaction.blockchainTypeId = 1
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
      newBalance = await calculateDecay(
        lastUserTransaction.balance,
        lastUserTransaction.balanceDate,
        receivedCallDate,
      )
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
    await loginPendingTasksAdminRepository.delete(pendingCreation)

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

  const loginPendingTasksAdminRepository = getCustomRepository(LoginPendingTasksAdminRepository)
  const pendingAmountsQuery = await loginPendingTasksAdminRepository
    .createQueryBuilder('login_pending_tasks_admin')
    .select('MONTH(login_pending_tasks_admin.date)', 'target_month')
    .addSelect('SUM(login_pending_tasks_admin.amount)', 'sum')
    .where('login_pending_tasks_admin.userId = :id', { id })
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
  let emailActivate = false
  if (user) emailActivate = user.emailChecked
  return user ? user.emailChecked : false
}
