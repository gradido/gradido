import { Account } from '@entity/Account'
import { User } from '@entity/User'

import { ConfirmedTransaction } from '@/data/proto/3_3/ConfirmedTransaction'
import { RegisterAddress } from '@/data/proto/3_3/RegisterAddress'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { LogError } from '@/server/LogError'
import { getDataSource } from '@/typeorm/DataSource'
import { hardenDerivationIndex } from '@/utils/derivationHelper'
import { timestampSecondsToDate, timestampToDate, uuid4ToBuffer } from '@/utils/typeConverter'

import { KeyPair } from '../model/KeyPair'

import { getBody } from './GradidoTransaction'
import { KeyManager } from './KeyManager'


export const getKeyPair = (user: User): KeyPair => {
  if (!user.gradidoID) {
    throw new LogError('missing GradidoID for user.', { id: user.id })
  }

  // example gradido id: 03857ac1-9cc2-483e-8a91-e5b10f5b8d16 =>
  // wholeHex: '03857ac19cc2483e8a91e5b10f5b8d16']
  const wholeHex = uuid4ToBuffer(user.gradidoID)
  const parts = []
  for (let i = 0; i < 4; i++) {
    parts[i] = hardenDerivationIndex(wholeHex.subarray(i * 4, (i + 1) * 4).readUInt32BE())
  }
  // parts: [2206563009, 2629978174, 2324817329, 2405141782]
  const keyPair = KeyManager.getInstance().derive(parts)
  if (user.derive1Pubkey && user.derive1Pubkey.compare(keyPair.publicKey) !== 0) {
    throw new LogError(
      'The freshly derived public key does not correspond to the stored public key',
    )
  }
  return keyPair
}

export const confirm = async (
  registerAddress: RegisterAddress,
  confirmedAt: Date,
): Promise<boolean> => {
  const publicKey = Buffer.from(registerAddress.userPubkey)
  const result = await getDataSource()
    .createQueryBuilder()
    .update(User)
    .set({ confirmedAt })
    .where('derive1Pubkey = :publicKey', { publicKey })
    .execute()
  if (result.affected && result.affected > 1) {
    throw new LogError('more than one user matched by public key: %s', publicKey)
  }
  return result.affected === 1
}
