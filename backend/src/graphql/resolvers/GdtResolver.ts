/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Args, Ctx, Authorized } from 'type-graphql'
import CONFIG from '../../config'
import { GdtEntryList } from '../models/GdtEntryList'
import { GdtTransactionSessionIdInput } from '../inputs/GdtInputs'
import { apiGet } from '../../apis/HttpRequest'
import { User as dbUser } from '../../typeorm/entity/User'

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
    // get public key for current logged in user
    const result = await apiGet(CONFIG.LOGIN_API_URL + 'login?session_id=' + context.sessionId)
    if (!result.success) throw new Error(result.data)

    // load user
    const userEntity = await dbUser.findByPubkeyHex(result.data.user.public_hex)

    const resultGDT = await apiGet(
      `${CONFIG.GDT_API_URL}/GdtEntries/listPerEmailApi/${userEntity.email}/${currentPage}/${pageSize}/${order}`,
    )
    if (!resultGDT.success) {
      throw new Error(result.data)
    }

    return new GdtEntryList(resultGDT.data)
  }
}
