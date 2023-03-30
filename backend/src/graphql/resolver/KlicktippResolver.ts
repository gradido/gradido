import { Resolver, Authorized, Mutation, Ctx } from 'type-graphql'

import {
  unsubscribe,
  klicktippSignIn,
} from '@/apis/KlicktippController'
import { EVENT_UNSUBSCRIBE_NEWSLETTER, EVENT_SUBSCRIBE_NEWSLETTER } from '@/event/Event'
import { RIGHTS } from '@/auth/RIGHTS'
import { Context, getUser } from '@/server/context'

@Resolver()
export class KlicktippResolver {
  @Authorized([RIGHTS.UNSUBSCRIBE_NEWSLETTER])
  @Mutation(() => Boolean)
  async unsubscribeNewsletter(@Ctx() context: Context): Promise<boolean> {
    const user = getUser(context)
    await EVENT_UNSUBSCRIBE_NEWSLETTER(user)
    return unsubscribe(user.emailContact.email)
  }

  @Authorized([RIGHTS.SUBSCRIBE_NEWSLETTER])
  @Mutation(() => Boolean)
  async subscribeNewsletter(@Ctx() context: Context): Promise<boolean> {
    const user = getUser(context)
    await EVENT_SUBSCRIBE_NEWSLETTER(user)
    return klicktippSignIn(user.emailContact.email, user.language)
  }
}
