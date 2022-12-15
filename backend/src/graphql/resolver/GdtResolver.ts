import { Resolver, Query, Args, Ctx, Authorized, Arg } from 'type-graphql'

import { GdtEntryList } from '@model/GdtEntryList'
import { Order } from '@enum/Order'
import Paginated from '@arg/Paginated'

import { Context, getUser } from '@/server/context'
import CONFIG from '@/config'
import { apiGet, apiPost } from '@/apis/HttpRequest'
import { RIGHTS } from '@/auth/RIGHTS'

@Resolver()
export class GdtResolver {
  @Authorized([RIGHTS.LIST_GDT_ENTRIES])
  @Query(() => GdtEntryList)
  async listGDTEntries(
    @Args()
    { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
    @Ctx() context: Context,
  ): Promise<GdtEntryList> {
    const userEntity = getUser(context)

    try {
      const resultGDT = await apiGet(
        `${CONFIG.GDT_API_URL}/GdtEntries/listPerEmailApi/${userEntity.emailContact.email}/${currentPage}/${pageSize}/${order}`,
      )
      if (!resultGDT.success) {
        throw new Error(resultGDT.data)
      }
      return new GdtEntryList(resultGDT.data)
    } catch (err) {
      throw new Error('GDT Server is not reachable.')
    }
  }

  @Authorized([RIGHTS.GDT_BALANCE])
  @Query(() => Number)
  async gdtBalance(@Ctx() context: Context): Promise<number | null> {
    const user = getUser(context)
    try {
      const resultGDTSum = await apiPost(`${CONFIG.GDT_API_URL}/GdtEntries/sumPerEmailApi`, {
        email: user.emailContact.email,
      })
      if (!resultGDTSum.success) {
        throw new Error('Call not successful')
      }
      return Number(resultGDTSum.data.sum) || 0
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('Could not query GDT Server')
      return null
    }
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
