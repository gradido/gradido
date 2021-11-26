/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Args, Ctx, Authorized, Arg } from 'type-graphql'
import { getCustomRepository } from 'typeorm'
import CONFIG from '../../config'
import { GdtEntryList } from '../model/GdtEntryList'
import Paginated from '../arg/Paginated'
import { apiGet } from '../../apis/HttpRequest'
import { UserRepository } from '../../typeorm/repository/User'
import { Order } from '../enum/Order'
import { RIGHTS } from '../../auth/RIGHTS'

@Resolver()
export class GdtResolver {
  @Authorized([RIGHTS.LIST_GDT_ENTRIES])
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

  @Authorized([RIGHTS.EXIST_PID])
  @Query(() => Number)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async existPid(@Arg('pid') pid: number): Promise<number> {
    // load user
    const resultPID = await apiGet(`${CONFIG.GDT_API_URL}/publishers/checkPidApi/${pid}`)
    if (!resultPID.success) {
      throw new Error(resultPID.data)
    }
    return resultPID.data.pid
  }
}
