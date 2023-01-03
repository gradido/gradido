import { Community as DbCommunity } from '@entity/Community'
import { IsNull, LessThan, Raw } from '@dbTools/typeorm'
import { requestGetPublicKey } from './client/1_0/FederationClient'
import { FdCommunity } from './graphql/1_0/model/FdCommunity'

export async function startValidateCommunities(timerInterval: number): Promise<void> {
  while (true) {
    const dbCommunities: DbCommunity[] = await DbCommunity.find({
      where: [{ verifiedAt: IsNull() }, { verifiedAt: LessThan(`last_announced_at:`) }],
    })
    if (dbCommunities) {
      dbCommunities.forEach(async function (dbCom) {
        const fdCom = new FdCommunity(dbCom)
        const pubKey = await requestGetPublicKey(fdCom)
        if (pubKey && pubKey === dbCom.publicKey.toString('hex')) {
          DbCommunity.update({ verifiedAt: new Date() }, { id: dbCom.id })
        }
      })
    }
    await sleep(timerInterval)
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
