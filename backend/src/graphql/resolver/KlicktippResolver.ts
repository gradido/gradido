import { Resolver, Authorized, Mutation, Ctx } from 'type-graphql'

import { unsubscribe, subscribe } from '@/apis/KlicktippController'
import { RIGHTS } from '@/auth/RIGHTS'
import { CacheManager } from '@/cache/CacheManager'
import { EVENT_NEWSLETTER_SUBSCRIBE, EVENT_NEWSLETTER_UNSUBSCRIBE } from '@/event/Events'
import { KlickTipp } from '@/graphql/model/KlickTipp'
import { Context, getUser } from '@/server/context'

@Resolver()
export class KlicktippResolver {
  @Authorized([RIGHTS.UNSUBSCRIBE_NEWSLETTER])
  @Mutation(() => Boolean)
  async unsubscribeNewsletter(@Ctx() context: Context): Promise<boolean> {
    const user = getUser(context)
    const email = user.emailContact.email
    await EVENT_NEWSLETTER_UNSUBSCRIBE(user)
    const result = await unsubscribe(email)
    if (result) {
      await CacheManager.getInstance().setKlicktippState(email, new KlickTipp(false))
    }
    return result
  }

  @Authorized([RIGHTS.SUBSCRIBE_NEWSLETTER])
  @Mutation(() => Boolean)
  async subscribeNewsletter(@Ctx() context: Context): Promise<boolean> {
    const user = getUser(context)
    const email = user.emailContact.email
    await EVENT_NEWSLETTER_SUBSCRIBE(user)
    const result = await subscribe(email, user.language)
    if (result) {
      await CacheManager.getInstance().setKlicktippState(email, new KlickTipp(true))
    }
    return result
  }
}
