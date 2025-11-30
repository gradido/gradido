import { Community as DbCommunity } from 'database'

import { CONFIG } from '@/config'


export async function writeHomeCommunityEntry(): Promise<DbCommunity> {
  try {
    // check for existing homeCommunity entry
    let homeCom = await DbCommunity.findOne({ where: { foreign: false } })
    if (!homeCom) {
      // insert a new homecommunity entry including a new ID and a new but ensured unique UUID
      homeCom = new DbCommunity()
      homeCom.foreign = false
      homeCom.publicKey = Buffer.from('public-key-data-seeding') // keyPair.publicKey
      // homeCom.privateKey = keyPair.secretKey
      homeCom.communityUuid = 'beac216d-73ae-427f-9678-0209af4936ce' // await newCommunityUuid()
      homeCom.url = 'http://localhost/api/'
      homeCom.name = CONFIG.COMMUNITY_NAME
      homeCom.description = CONFIG.COMMUNITY_DESCRIPTION
      homeCom.creationDate = new Date()
      await DbCommunity.insert(homeCom)
    }
    return homeCom
  } catch (_err) {
    throw new Error(`Seeding: Error writing HomeCommunity-Entry`) // : ${err}`)
  }
}
