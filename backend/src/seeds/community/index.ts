import { Community as DbCommunity } from 'database'
import { v4 as uuidv4 } from 'uuid'

import { CONFIG } from '@/config'

export async function writeHomeCommunityEntry(): Promise<DbCommunity> {
  try {
    // check for existing homeCommunity entry
    let homeCom = await DbCommunity.findOne({ where: { foreign: false } })
    if (homeCom) {
      // simply update the existing entry, but it MUST keep the ID and UUID because of possible relations
      homeCom.publicKey = Buffer.from('public-key-data-seeding') // keyPair.publicKey
      // homeCom.privateKey = keyPair.secretKey
      homeCom.url = 'http://localhost/api/'
      homeCom.name = CONFIG.COMMUNITY_NAME
      homeCom.description = CONFIG.COMMUNITY_DESCRIPTION
      await DbCommunity.save(homeCom)
    } else {
      // insert a new homecommunity entry including a new ID and a new but ensured unique UUID
      homeCom = new DbCommunity()
      homeCom.foreign = false
      homeCom.publicKey = Buffer.from('public-key-data-seeding') // keyPair.publicKey
      // homeCom.privateKey = keyPair.secretKey
      homeCom.communityUuid = uuidv4() // await newCommunityUuid()
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
