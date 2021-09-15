/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Authorized, Arg } from 'type-graphql'
import { getKlickTippUser, getKlicktippTagMap } from '../../apis/KlicktippController'
import CONFIG from '../../config'
import { TransactionList } from '../models/Transaction'

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
}
