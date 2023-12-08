import { Account } from '@entity/Account'
import { User } from '@entity/User'
import { In } from 'typeorm'

import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { getDataSource } from '@/typeorm/DataSource'

export const AccountRepository = getDataSource()
  .getRepository(Account)
  .extend({
    findByPublicKeys(publicKeys: Buffer[]): Promise<Account[]> {
      return this.findBy({ derive2Pubkey: In(publicKeys) })
    },

    async findByPublicKey(publicKey: Buffer | undefined): Promise<Account | undefined> {
      if (!publicKey) return undefined
      return (await this.findOneBy({ derive2Pubkey: Buffer.from(publicKey) })) ?? undefined
    },

    async findByUserIdentifier({ uuid, accountNr }: UserIdentifier): Promise<Account | undefined> {
      const user = await User.findOne({
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
