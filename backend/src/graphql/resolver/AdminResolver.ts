import { Resolver, Query, Arg, Args, Authorized } from 'type-graphql'
import { getCustomRepository, Raw, Any } from 'typeorm'
import { UserAdmin } from '../model/UserAdmin'
import { LoginUserRepository } from '../../typeorm/repository/LoginUser'
import { RIGHTS } from '../../auth/RIGHTS'
import { TransactionCreationRepository } from '../../typeorm/repository/TransactionCreation'
import { PendingCreationRepository } from '../../typeorm/repository/PendingCreation'
import { UserRepository } from '../../typeorm/repository/User'
import CreatePendingCreationArgs from '../arg/CreatePendingCreationArgs'
import { LoginPendingTasksAdmin } from '@entity/LoginPendingTasksAdmin'
import moment from 'moment'

@Resolver()
export class AdminResolver {
  @Authorized([RIGHTS.SEARCH_USERS])
  @Query(() => [UserAdmin])
  async searchUsers(@Arg('searchText') searchText: string): Promise<UserAdmin[]> {
    const loginUserRepository = getCustomRepository(LoginUserRepository)
    const loginUsers = await loginUserRepository.findBySearchCriteria(searchText)
    const users = await Promise.all(
      loginUsers.map(async (loginUser) => {
        const user = new UserAdmin()
        user.firstName = loginUser.firstName
        user.lastName = loginUser.lastName
        user.email = loginUser.email
        user.creation = await getUserCreations(loginUser.id)
        return user
      }),
    )
    return users
  }

  @Query(() => [Number])
  async createPendingCreation(
    @Args() { email, amount, note, creationDate, moderator }: CreatePendingCreationArgs,
  ): Promise<number[]> {
    const userRepository = getCustomRepository(UserRepository)
    const user = await userRepository.findByEmail(email)

    const creations = await getUserCreations(user.id)
    const creationDateObj = new Date(creationDate)
    if (isCreationValid(creations, amount, creationDateObj)) {
      const pendingCreationRepository = getCustomRepository(PendingCreationRepository)
      const loginPendingTaskAdmin = pendingCreationRepository.create()
      loginPendingTaskAdmin.userId = user.id
      loginPendingTaskAdmin.amount = BigInt(amount * 10000)
      loginPendingTaskAdmin.created = new Date()
      loginPendingTaskAdmin.date = creationDateObj
      loginPendingTaskAdmin.note = note
      loginPendingTaskAdmin.moderator = moderator

      pendingCreationRepository.save(loginPendingTaskAdmin)
    }
    return await getUserCreations(user.id)
  }

  @Query(() => String)
  async getPendingCreations(): Promise<string> {
    const pendingCreationRepository = getCustomRepository(PendingCreationRepository)
    const pendingCreations = await pendingCreationRepository.find()
    console.log('pendingCreations', pendingCreations)
    return pendingCreations.toString()
  }
}

async function getUserCreations(id: number): Promise<number[]> {
  const dateNextMonth = moment().add(1, 'month').format('YYYY-MM') + '-01'
  const dateMonth = moment().format('YYYY-MM') + '-01'
  const dateLastMonth = moment().subtract(1, 'month').format('YYYY-MM') + '-01'
  const dateBeforeLastMonth = moment().subtract(2, 'month').format('YYYY-MM') + '-01'

  const transactionCreationRepository = getCustomRepository(TransactionCreationRepository)
  const createdAmountBeforeLastMonth = await transactionCreationRepository
    .createQueryBuilder('transaction_creations')
    .select('SUM(transaction_creations.amount)', 'sum')
    .where('transaction_creations.state_user_id = :id', { id })
    .andWhere({
      targetDate: Raw((alias) => `${alias} >= :date and ${alias} < :enddate`, {
        date: dateBeforeLastMonth,
        enddate: dateLastMonth,
      }),
    })
    .getRawOne()

  const createdAmountLastMonth = await transactionCreationRepository
    .createQueryBuilder('transaction_creations')
    .select('SUM(transaction_creations.amount)', 'sum')
    .where('transaction_creations.state_user_id = :id', { id })
    .andWhere({
      targetDate: Raw((alias) => `${alias} >= :date and ${alias} < :enddate`, {
        date: dateLastMonth,
        enddate: dateMonth,
      }),
    })
    .getRawOne()

  const createdAmountMonth = await transactionCreationRepository
    .createQueryBuilder('transaction_creations')
    .select('SUM(transaction_creations.amount)', 'sum')
    .where('transaction_creations.state_user_id = :id', { id })
    .andWhere({
      targetDate: Raw((alias) => `${alias} >= :date and ${alias} < :enddate`, {
        date: dateMonth,
        enddate: dateNextMonth,
      }),
    })
    .getRawOne()

  const pendingCreationRepository = getCustomRepository(PendingCreationRepository)
  const pendingAmountMounth = await pendingCreationRepository
    .createQueryBuilder('login_pending_tasks_admin')
    .select('SUM(login_pending_tasks_admin.amount)', 'sum')
    .where('login_pending_tasks_admin.userId = :id', { id })
    .andWhere({
      date: Raw((alias) => `${alias} >= :date and ${alias} < :enddate`, {
        date: dateMonth,
        enddate: dateNextMonth,
      }),
    })
    .getRawOne()

  const pendingAmountLastMounth = await pendingCreationRepository
    .createQueryBuilder('login_pending_tasks_admin')
    .select('SUM(login_pending_tasks_admin.amount)', 'sum')
    .where('login_pending_tasks_admin.userId = :id', { id })
    .andWhere({
      date: Raw((alias) => `${alias} >= :date and ${alias} < :enddate`, {
        date: dateLastMonth,
        enddate: dateMonth,
      }),
    })
    .getRawOne()

  const pendingAmountBeforeLastMounth = await pendingCreationRepository
    .createQueryBuilder('login_pending_tasks_admin')
    .select('SUM(login_pending_tasks_admin.amount)', 'sum')
    .where('login_pending_tasks_admin.userId = :id', { id })
    .andWhere({
      date: Raw((alias) => `${alias} >= :date and ${alias} < :enddate`, {
        date: dateBeforeLastMonth,
        enddate: dateLastMonth,
      }),
    })
    .getRawOne()

  // COUNT amount from 2 tables
  const usedCreationBeforeLastMonth =
    (Number(createdAmountBeforeLastMonth.sum) + Number(pendingAmountBeforeLastMounth.sum)) / 10000
  const usedCreationLastMonth =
    (Number(createdAmountLastMonth.sum) + Number(pendingAmountLastMounth.sum)) / 10000
  const usedCreationMonth =
    (Number(createdAmountMonth.sum) + Number(pendingAmountMounth.sum)) / 10000
  return [
    1000 - usedCreationBeforeLastMonth,
    1000 - usedCreationLastMonth,
    1000 - usedCreationMonth,
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
