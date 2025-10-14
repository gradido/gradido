import { Not, In } from 'typeorm'
import { CommunityHandshakeState, CommunityHandshakeStateType} from '..'
import { Ed25519PublicKey } from 'shared'

/**
 * Find a pending community handshake by public key.
 * @param publicKey The public key of the community.
 * @param apiVersion The API version of the community.
 * @returns The CommunityHandshakeState with associated federated community and community.
 */
export function findPendingCommunityHandshake(publicKey: Ed25519PublicKey, apiVersion: string): Promise<CommunityHandshakeState | null> {
  return CommunityHandshakeState.findOne({
    where: { 
      publicKey: publicKey.asBuffer(), 
      apiVersion,
      status: Not(In([
        CommunityHandshakeStateType.EXPIRED,
        CommunityHandshakeStateType.FAILED,
        CommunityHandshakeStateType.SUCCESS
      ]))
    },
  })
}

export function findPendingCommunityHandshakeOrFailByOneTimeCode(
  oneTimeCode: number
): Promise<CommunityHandshakeState> {
  return CommunityHandshakeState.findOneOrFail({
    where: { oneTimeCode },
  })
}
  