import { User } from '@entity/User'
import { createCache, Cache } from 'cache-manager'
import { CacheableMemory, Keyv } from 'cacheable'

import { readAccountState } from '@/apis/humhub/readAccountState'
import { KlickTipp } from '@/graphql/model/KlickTipp'
import { getKlicktippState } from '@/graphql/resolver/util/getKlicktippState'

export class CacheManager {
  // eslint-disable-next-line no-use-before-define
  private static instance: CacheManager
  private cache: Cache

  private constructor() {
    this.cache = createCache({
      stores: [
        new Keyv({
          store: new CacheableMemory({ ttl: '10m', lruSize: 100000 }),
        }),
      ],
    })
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  protected getKlicktippKey(email: string): string {
    return 'klicktipp_' + email
  }

  protected getHumhubKey(user: User): string {
    return 'humhub_' + user.gradidoID
  }

  public async getKlicktippState(email: string): Promise<KlickTipp> {
    const klicktippKey = this.getKlicktippKey(email)
    const value: boolean | null = await this.cache.get(klicktippKey)
    if (value === null) {
      const result = await getKlicktippState(email)
      await this.cache.set(klicktippKey, result.newsletterState)
      return Promise.resolve(result)
    }
    return Promise.resolve(new KlickTipp(value))
  }

  public async setKlicktippState(email: string, state: KlickTipp): Promise<void> {
    await this.cache.set(this.getKlicktippKey(email), state.newsletterState)
  }

  public async getHumhubUserAccountState(user: User): Promise<boolean> {
    const humhubKey = this.getHumhubKey(user)

    let value: boolean | null = await this.cache.get(humhubKey)
    if (value === null) {
      value = await readAccountState(user)
      await this.cache.set(humhubKey, value)
    }
    return Promise.resolve(value)
  }

  public async setHumhubAccountState(user: User, accountState: boolean): Promise<void> {
    await this.cache.set(this.getHumhubKey(user), accountState)
  }
}
