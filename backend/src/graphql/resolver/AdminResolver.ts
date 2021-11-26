import { Resolver, Query, Arg, Authorized } from 'type-graphql'
import { getCustomRepository } from 'typeorm'
import { UserAdmin } from '../model/UserAdmin'
import { LoginUserRepository } from '../../typeorm/repository/LoginUser'
import { RIGHTS } from '../../auth/RIGHTS'
import { proto } from '../../proto/gradido.proto'

const pendingTasksRequestProto = (
  amount: number,
  memo: string,
  receiverPubKey: Buffer,
  date: Date,
) => {
  const receiver = new proto.gradido.TransferAmount({
    amount,
    pubkey: receiverPubKey,
  })

  const targetDate = new proto.gradido.TimestampSeconds({
    seconds: date.getTime() / 1000,
  })

  const creation = new proto.gradido.GradidoCreation({
    receiver,
    targetDate,
  })

  const transactionBody = new proto.gradido.TransactionBody({
    memo,
    created: { seconds: new Date().getTime() / 1000 },
    creation,
  })

  const bodyBytes = proto.gradido.TransactionBody.encode(transactionBody).finish()

  return bodyBytes // not sure this is the correct value yet
}

@Resolver()
export class AdminResolver {
  @Authorized([RIGHTS.SEARCH_USERS])
  @Query(() => [UserAdmin])
  async searchUsers(@Arg('searchText') searchText: string): Promise<UserAdmin[]> {
    const loginUserRepository = getCustomRepository(LoginUserRepository)
    const loginUsers = await loginUserRepository.findBySearchCriteria(searchText)
    const users = loginUsers.map((loginUser) => {
      const user = new UserAdmin()
      user.firstName = loginUser.firstName
      user.lastName = loginUser.lastName
      user.email = loginUser.email
      user.creation = [
        (Math.floor(Math.random() * 50) + 1) * 20,
        (Math.floor(Math.random() * 50) + 1) * 20,
        (Math.floor(Math.random() * 50) + 1) * 20,
      ]
      return user
    })
    return users
  }
}
