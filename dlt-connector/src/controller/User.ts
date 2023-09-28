import { User } from '@entity/User'
import { KeyPair } from '../model/KeyPair'
import { LogError } from '@/server/LogError'
import { KeyManager } from './KeyManager'
import { uuid4ToBuffer } from '@/utils/typeConverter'
import { hardenDerivationIndex } from '@/utils/derivationHelper'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'

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
  if (user.derive1Pubkey.compare(keyPair.publicKey) !== 0) {
    throw new LogError(
      'The freshly derived public key does not correspond to the stored public key',
    )
  }
  return keyPair
}

export const findByGradidoId = ({ uuid }: UserIdentifier): Promise<User | null> => {
  return User.findOneBy({ gradidoID: uuid })
}

export const create = (userAccountDraft: UserAccountDraft): User => {
  const user = User.create()
  user.createdAt = new Date(userAccountDraft.createdAt)
  user.gradidoID = userAccountDraft.user.uuid
  user.derive1Pubkey = getKeyPair(user).publicKey
  return user
}
