import { Account } from '@entity/Account'
import { User } from '@entity/User'

import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { getDataSource } from '@/typeorm/DataSource'

export const UserRepository = getDataSource()
  .getRepository(User)
  .extend({
    async findAccountByUserIdentifier({
      uuid,
      accountNr,
    }: UserIdentifier): Promise<Account | undefined> {
      const user = await this.findOne({
        where: { gradidoID: uuid, accounts: { derivationIndex: accountNr ?? 1 } },
        relations: { accounts: true },
      })
      if (user && user.accounts?.length === 1) {
        const account = user.accounts[0]
        account.user = user
        return account
      }
    },
  })
