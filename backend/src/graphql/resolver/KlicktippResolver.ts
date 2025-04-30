import { Authorized, Ctx, Mutation, Resolver } from 'type-graphql'

import { subscribe, unsubscribe } from '@/apis/KlicktippController'
import { RIGHTS } from '@/auth/RIGHTS'
import { EVENT_NEWSLETTER_SUBSCRIBE, EVENT_NEWSLETTER_UNSUBSCRIBE } from '@/event/Events'
import { type Context, getUser } from '@/server/context'

@Resolver()
export class KlicktippResolver {
  @Authorized([RIGHTS.UNSUBSCRIBE_NEWSLETTER])
  @Mutation(() => Boolean)
  async unsubscribeNewsletter(@Ctx() context: Context): Promise<boolean> {
    const user = getUser(context)
    await EVENT_NEWSLETTER_UNSUBSCRIBE(user)
    return unsubscribe(user.emailContact.email)
  }

  @Authorized([RIGHTS.SUBSCRIBE_NEWSLETTER])
  @Mutation(() => Boolean)
  async subscribeNewsletter(@Ctx() context: Context): Promise<boolean> {
    const user = getUser(context)
    await EVENT_NEWSLETTER_SUBSCRIBE(user)
    return subscribe(user.emailContact.email, user.language)
  }
}
