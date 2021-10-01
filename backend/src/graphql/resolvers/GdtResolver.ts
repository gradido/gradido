/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Args, Ctx, Authorized } from 'type-graphql'
import { getCustomRepository } from 'typeorm'
import CONFIG from '../../config'
import { GdtEntryList } from '../models/GdtEntryList'
import Paginated from '../args/Paginated'
import { apiGet } from '../../apis/HttpRequest'
import { UserRepository } from '../../typeorm/repository/User'
import { Order } from '../enum/Order'

@Resolver()
export class GdtResolver {
  @Authorized()
  @Query(() => GdtEntryList)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async listGDTEntries(
    @Args()
    { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
    @Ctx() context: any,
  ): Promise<GdtEntryList> {
    // load user
    const userRepository = getCustomRepository(UserRepository)
    const userEntity = await userRepository.findByPubkeyHex(context.pubKey)

    const resultGDT = await apiGet(
      `${CONFIG.GDT_API_URL}/GdtEntries/listPerEmailApi/${userEntity.email}/${currentPage}/${pageSize}/${order}`,
    )
    if (!resultGDT.success) {
      throw new Error(resultGDT.data)
    }

    return new GdtEntryList(resultGDT.data)
  }
}
