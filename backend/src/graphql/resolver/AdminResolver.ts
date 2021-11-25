import { Resolver, Query, Arg, Args } from 'type-graphql'
import { getCustomRepository, Raw } from 'typeorm'
import { UserAdmin } from '../model/UserAdmin'
import { LoginUserRepository } from '../../typeorm/repository/LoginUser'
import { TransactionCreationRepository } from '../../typeorm/repository/TransactionCreation'
import { PendingCreationRepository } from '../../typeorm/repository/PendingCreation'
import { UserRepository } from '../../typeorm/repository/User'
import CreatePendingCreationArgs from '../arg/CreatePendingCreationArgs'
import moment from 'moment'

@Resolver()
export class AdminResolver {
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

  @Query(() => Boolean)
  async createPendingCreation(
    @Args() { email, amount, note, creationDate }: CreatePendingCreationArgs,
  ): Promise<boolean> {
    // TODO: Check user validity
    const userRepository = getCustomRepository(UserRepository)
    const user = await userRepository.findByEmail(email)
    // TODO: Check user open creation state (Open creation)
    const creations = await getUserCreations(user.id)
    console.log('creations', creations)
    if (isCreationValid(creations, amount, creationDate)) {
      // UserAdmin.creations()
      // TODO: Write pending creation to DB
    }
    return false
  }
}

async function getUserCreations(id: number): Promise<number[]> {
  const dateNextMonth = moment().add(1, 'month').format('YYYY-MM') + '-01'
  const dateMonth = moment().format('YYYY-MM') + '-01'
  const dateLastMonth = moment().subtract(1, 'month').format('YYYY-MM') + '-01'
  const dateBeforeLastMonth = moment().subtract(2, 'month').format('YYYY-MM') + '-01'
  console.log('Searching creation amount for: ', dateNextMonth, dateMonth, dateLastMonth, dateBeforeLastMonth)

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
  console.log('createdAmountBeforeLastMonth.sum', Number(createdAmountBeforeLastMonth.sum))

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
  console.log('createdAmountLastMonth.sum', Number(createdAmountLastMonth.sum))

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
  console.log('createdAmountMonth.sum', Number(createdAmountMonth.sum))

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
  console.log('pendingAmountMounth', Number(pendingAmountMounth.sum))

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
  console.log('pendingAmountLastMounth', Number(pendingAmountLastMounth.sum))

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
  console.log('pendingAmountBeforeLastMounth', Number(pendingAmountBeforeLastMounth.sum))

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

function isCreationValid(creations: number[], amount: number, creationDate: any) {
  return true
}
