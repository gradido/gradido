import { dbInsertEvent, EventType } from 'database'
import { Authorized, Ctx, Mutation, Resolver } from 'type-graphql'

import { subscribe, unsubscribe } from '@/apis/KlicktippController'
import { RIGHTS } from '@/auth/RIGHTS'
import { Context, getUser } from '@/server/context'

@Resolver()
export class KlicktippResolver {
  @Authorized([RIGHTS.UNSUBSCRIBE_NEWSLETTER])
  @Mutation(() => Boolean)
  async unsubscribeNewsletter(@Ctx() context: Context): Promise<boolean> {
    const user = getUser(context)
    await dbInsertEvent({
      type: EventType.NEWSLETTER_UNSUBSCRIBE,
      affectedUserId: user.id,
      actingUserId: user.id,
    })
    return unsubscribe(user.emailContact.email)
  }

  @Authorized([RIGHTS.SUBSCRIBE_NEWSLETTER])
  @Mutation(() => Boolean)
  async subscribeNewsletter(@Ctx() context: Context): Promise<boolean> {
    const user = getUser(context)
    await dbInsertEvent({
      type: EventType.NEWSLETTER_SUBSCRIBE,
      affectedUserId: user.id,
      actingUserId: user.id,
    })
    return subscribe(user.emailContact.email, user.language)
  }
}
