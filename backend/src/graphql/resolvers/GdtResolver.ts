// import jwt from 'jsonwebtoken'
import { Resolver, Query, /* Mutation, */ Args } from 'type-graphql'
import CONFIG from '../../config'
import { GdtEntryList } from '../models/GdtEntryList'
import { GdtTransactionSessionIdInput } from '../inputs/GdtInputs'
import { apiGet } from '../../apis/loginAPI'

@Resolver()
export class GdtResolver {
  @Query(() => GdtEntryList)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async listGDTEntries(
    @Args()
    { currentPage = 1, pageSize = 5, order = 'DESC', sessionId }: GdtTransactionSessionIdInput,
  ): Promise<GdtEntryList> {
    const result = await apiGet(
      `${CONFIG.GDT_API_URL}/listGDTTransactions/${currentPage}/${pageSize}/${order}/${sessionId}`,
    )
    // console.log(result.data)
    if (!result.success) {
      throw new Error(result.data)
    }

    return new GdtEntryList(result.data)
  }
}
