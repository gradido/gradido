import { Resolver, Query, Authorized, Arg, Mutation, Args } from 'type-graphql'
import {
  getKlickTippUser,
  getKlicktippTagMap,
  unsubscribe,
  klicktippSignIn,
} from '@/apis/KlicktippController'
import { RIGHTS } from '@/auth/RIGHTS'
import SubscribeNewsletterArgs from '@arg/SubscribeNewsletterArgs'
import { User } from '@entity/User'
import { backendLogger } from '@/server/logger'

@Resolver()
export class KlicktippResolver {
  @Authorized([RIGHTS.GET_KLICKTIPP_USER])
  @Query(() => String)
  async getKlicktippUser(@Arg('email') email: string): Promise<string> {
    return await getKlickTippUser(email)
  }

  @Authorized([RIGHTS.GET_KLICKTIPP_TAG_MAP])
  @Query(() => String)
  async getKlicktippTagMap(): Promise<string> {
    return await getKlicktippTagMap()
  }

  @Authorized([RIGHTS.UNSUBSCRIBE_NEWSLETTER])
  @Mutation(() => Boolean)
  async unsubscribeNewsletter(@Arg('email') email: string): Promise<boolean> {
    return await unsubscribe(email)
  }

  @Authorized([RIGHTS.SUBSCRIBE_NEWSLETTER])
  @Mutation(() => Boolean)
  async subscribeNewsletter(
    @Args() { email, language }: SubscribeNewsletterArgs,
  ): Promise<boolean> {
    return await klicktippSignIn(email, language)
  }

  @Authorized([RIGHTS.ADMIN_RETRIEVE_NOT_REGISTERED_EMAILS])
  @Query(() => [String])
  async retrieveNotRegisteredEmails(): Promise<string[]> {
    const users = await User.find()
    const notRegisteredUser = []
    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      try {
        await getKlickTippUser(user.email)
      } catch (err) {
        notRegisteredUser.push(user.email)
        backendLogger.error(`Error with email: ${user.email}; ${err}`)
      }
    }
    return notRegisteredUser
  }
}
