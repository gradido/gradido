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

    findByGradidoId({ uuid }: UserIdentifier): Promise<User | null> {
      return User.findOneBy({ gradidoID: uuid })
    },

    findByPublicKey(publicKey: Buffer): Promise<User | null> {
      return User.findOneBy({ derive1Pubkey: Buffer.from(publicKey) })
    },

    // TODO: adjust after implement AccountCommunity
    findUserByIdentifier({ uuid }: UserIdentifier): Promise<User | null> {
      return User.findOne({ where: { gradidoID: uuid }, relations: { accounts: true } })
    },

    findByPublicKeyWithAccount(publicKey: Buffer, derivationIndex: number): Promise<User | null> {
      return User.findOne({
        relations: { accounts: true },
        where: { derive1Pubkey: Buffer.from(publicKey), accounts: { derivationIndex } },
      })
    },
  })
