/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Resolver, Query, Authorized, Arg, Mutation, Ctx } from 'type-graphql'

import {
  getKlickTippUser,
  getKlicktippTagMap,
  unsubscribe,
  klicktippSignIn,
} from '@/apis/KlicktippController'
import { RIGHTS } from '@/auth/RIGHTS'
import { Context, getUser } from '@/server/context'

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
  async unsubscribeNewsletter(@Ctx() context: Context): Promise<boolean> {
    const user = getUser(context)
    return await unsubscribe(user.emailContact.email)
  }

  @Authorized([RIGHTS.SUBSCRIBE_NEWSLETTER])
  @Mutation(() => Boolean)
  async subscribeNewsletter(
    @Arg('language') language: string,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const user = getUser(context)
    return await klicktippSignIn(user.emailContact.email, language)
  }
}
