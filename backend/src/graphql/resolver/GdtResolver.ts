import { Paginated } from '@arg/Paginated'
import { Order } from '@enum/Order'
import { GdtEntry } from '@model/GdtEntry'
import { GdtEntryList } from '@model/GdtEntryList'
import { getLogger } from 'log4js'
import { Arg, Args, Authorized, Ctx, Float, Int, Query, Resolver } from 'type-graphql'
import { apiGet, apiPost } from '@/apis/HttpRequest'
import { RIGHTS } from '@/auth/RIGHTS'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.GdtResolver`)

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
      return new GdtEntryList('disabled', 0, [], 0, 0)
    }
    const userEntity = getUser(context)

    try {
      const resultGDT = await apiGet(
        `${CONFIG.GDT_API_URL}/GdtEntries/listPerEmailApi/${userEntity.emailContact.email}/${currentPage}/${pageSize}/${order}`,
      )
      if (!resultGDT.success) {
        return new GdtEntryList()
      }
      const { state, count, gdtEntries, gdtSum, timeUsed } = resultGDT.data
      return new GdtEntryList(
        state,
        count,
        gdtEntries ? gdtEntries.map((data: any) => new GdtEntry(data)) : [],
        gdtSum,
        timeUsed,
      )
    } catch (err) {
      logger.error('GDT Server is not reachable', err)
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
      logger.error('Could not query GDT Server', err)
      return null
    }
  }

  @Authorized([RIGHTS.EXIST_PID])
  @Query(() => Int)
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
