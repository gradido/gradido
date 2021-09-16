/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Authorized, Arg, Mutation, Args } from 'type-graphql'
import {
  getKlickTippUser,
  getKlicktippTagMap,
  unsubscribe,
  signin,
} from '../../apis/KlicktippController'
import { SubscribeNewsletterArguments } from '../inputs/KlickTippInputs'

@Resolver()
export class KlicktippResolver {
  @Query(() => String)
  async getKlicktippUser(@Arg('email') email: string): Promise<string> {
    return await getKlickTippUser(email)
  }

  @Query(() => String)
  async getKlicktippTagMap(): Promise<string> {
    return await getKlicktippTagMap()
  }

  @Mutation(() => Boolean)
  async unsubscribeNewsletter(@Arg('email') email: string): Promise<boolean> {
    return await unsubscribe(email)
  }

  @Mutation(() => Boolean)
  async subscribeNewsletter(
    @Args() { email, language }: SubscribeNewsletterArguments,
  ): Promise<boolean> {
    return await signin(email, language)
  }
}
