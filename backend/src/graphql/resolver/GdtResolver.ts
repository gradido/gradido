/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Arg, Args, Authorized, Ctx, Float, Int, Query, Resolver } from 'type-graphql'

import { Paginated } from '@arg/Paginated'
import { Order } from '@enum/Order'
import { GdtEntry } from '@model/GdtEntry'
import { GdtEntryList } from '@model/GdtEntryList'

import { apiGet, apiPost } from '@/apis/HttpRequest'
import { RIGHTS } from '@/auth/RIGHTS'
import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'
import { Context, getUser } from '@/server/context'

@Resolver()
export class GdtResolver {
  @Authorized([RIGHTS.LIST_GDT_ENTRIES])
  @Query(() => GdtEntryList)
  async listGDTEntries(
    @Args()
    { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
    @Ctx() context: Context,
  ): Promise<GdtEntryList> {
    if (!CONFIG.GDT_ACTIVE) {
      return new GdtEntryList(
        'disabled',
        0,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
        [],
        0,
        0,
      )
    }
    const userEntity = getUser(context)

    try {
      const resultGDT = await apiGet(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `${CONFIG.GDT_API_URL}/GdtEntries/listPerEmailApi/${userEntity.emailContact.email}/${currentPage}/${pageSize}/${order}`,
      )
      if (!resultGDT.success) {
        return new GdtEntryList()
      }
      const { state, count, gdtEntries, gdtSum, timeUsed } = resultGDT.data
      return new GdtEntryList(
        state,
        count,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
        gdtEntries ? gdtEntries.map((data: any) => new GdtEntry(data)) : [],
        gdtSum,
        timeUsed,
      )
    } catch (err) {
      throw new LogError('GDT Server is not reachable')
    }
  }

  @Authorized([RIGHTS.GDT_BALANCE])
  @Query(() => Float, { nullable: true })
  async gdtBalance(@Ctx() context: Context): Promise<number | null> {
    if (!CONFIG.GDT_ACTIVE) {
      return null
    }
    const user = getUser(context)
    try {
      const resultGDTSum = await apiPost(`${CONFIG.GDT_API_URL}/GdtEntries/sumPerEmailApi`, {
        email: user.emailContact.email,
      })
      if (!resultGDTSum.success) {
        throw new LogError('Call not successful')
      }
      return Number(resultGDTSum.data.sum) || 0
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('Could not query GDT Server')
      return null
    }
  }

  @Authorized([RIGHTS.EXIST_PID])
  @Query(() => Int)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async existPid(@Arg('pid', () => Int) pid: number): Promise<number> {
    if (!CONFIG.GDT_ACTIVE) {
      return 0
    }
    // load user
    const resultPID = await apiGet(`${CONFIG.GDT_API_URL}/publishers/checkPidApi/${pid}`)
    if (!resultPID.success) {
      throw new LogError(resultPID.data)
    }
    return resultPID.data.pid
  }
}
