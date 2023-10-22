import { Community } from '@entity/Community'
import { KeyPair } from '@/model/KeyPair'
import { LogError } from '@/server/LogError'

export const confirm = async (iotaTopic: string, confirmedAt: Date): Promise<boolean> => {
  const query = `
    UPDATE communities c
    LEFT JOIN accounts gmw ON c.gmw_account_id = gmw.id
    LEFT JOIN accounts auf ON c.auf_account_id = auf.id
    SET c.confirmed_at = ?,
        gmw.confirmed_at = ?,
        auf.confirmed_at = ?
    WHERE c.iota_topic = ?
  `

  const entityManager = Community.getRepository().manager // getDataSource().manager
  const result = await entityManager.query(query, [
    confirmedAt,
    confirmedAt,
    confirmedAt,
    iotaTopic,
  ])

  if (result.affected && result.affected > 1) {
    throw new LogError('more than one community matched by topic: %s', iotaTopic)
  }
  return result.affected === 1
}

export const loadHomeCommunityKeyPair = async (): Promise<KeyPair> => {
  const community = await Community.findOneOrFail({
    where: { foreign: false },
    select: { rootChaincode: true, rootPubkey: true, rootPrivkey: true },
  })
  if (!community.rootChaincode || !community.rootPrivkey) {
    throw new Error('Missing chaincode or private key for home community')
  }
  return new KeyPair(community)
}
