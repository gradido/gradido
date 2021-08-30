/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Args, Ctx, Authorized } from 'type-graphql'
import CONFIG from '../../config'
import { GdtEntryList } from '../models/GdtEntryList'
import { GdtTransactionSessionIdInput } from '../inputs/GdtInputs'
import { apiGet } from '../../apis/loginAPI'

@Resolver()
export class GdtResolver {
  @Authorized()
  @Query(() => GdtEntryList)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async listGDTEntries(
    @Args()
    { currentPage = 1, pageSize = 5, order = 'DESC' }: GdtTransactionSessionIdInput,
    @Ctx() context: any,
  ): Promise<GdtEntryList> {
    const result = await apiGet(
      `${CONFIG.COMMUNITY_API_URL}listGDTTransactions/${currentPage}/${pageSize}/${order}/${context.sessionId}`,
    )
    if (!result.success) {
      throw new Error(result.data)
    }

    return new GdtEntryList(result.data)
  }
}
