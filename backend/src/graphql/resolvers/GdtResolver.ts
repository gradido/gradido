// import jwt from 'jsonwebtoken'
import { Resolver, Query, /* Mutation, */ Args } from 'type-graphql'
import CONFIG from '../../config'
import { GdtEntryList } from '../models/GdtEntryList'
import { GdtTransactionInput } from '../inputs/GdtInputs'
import { apiGet } from '../../apis/loginAPI'

@Resolver()
export class GdtResolver {
  @Query(() => GdtEntryList)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async listGDTEntries(
    @Args() { email, currentPage = 1, pageSize = 5, order = 'DESC' }: GdtTransactionInput,
  ): Promise<GdtEntryList> {
    email = email.trim().toLowerCase()
    const result = await apiGet(
      `${CONFIG.GDT_API_URL}/GdtEntries/listPerEmailApi/${email}/${currentPage}/${pageSize}/${order}`,
    )

    if (!result.success) {
      throw new Error(result.data)
    }

    return new GdtEntryList(result.data)
  }
}
