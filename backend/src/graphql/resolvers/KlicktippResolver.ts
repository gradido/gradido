/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Authorized, Arg } from 'type-graphql'
import { userTags, getKlicktippTagMap } from '../../apis/KlicktippController'
import CONFIG from '../../config'
import { TransactionList } from '../models/Transaction'

@Resolver()
export class KlicktippResolver {
  @Query(() => String)
  async getKlicktippUser(@Arg('email') email: string): Promise<string> {
    const userTagList = await userTags(email)
    console.log('userTags', userTagList)
    return userTagList
  }

  @Query(() => String)
  async getKlicktippTagMap(): Promise<string> {
    const klicktippTagMap = await getKlicktippTagMap()
    console.log('klicktippTagMap', klicktippTagMap)
    return 'klicktippTagMap'
  }
}
