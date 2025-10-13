import { Not, In } from 'typeorm'
import { CommunityHandshakeState, CommunityHandshakeStateType} from '..'

/**
 * Find a pending community handshake by public key.
 * @param publicKey The public key of the community.
 * @param withRelations Whether to include the federated community and community in the result, default true.
 * @returns The CommunityHandshakeState with associated federated community and community.
 */
export function findPendingCommunityHandshake(
  publicKey: Buffer, apiVersion: string, withRelations = true
): Promise<CommunityHandshakeState | null> {
  return CommunityHandshakeState.findOne({
    where: { 
      publicKey, 
      apiVersion,
      status: Not(In([
        CommunityHandshakeStateType.EXPIRED,
        CommunityHandshakeStateType.FAILED,
        CommunityHandshakeStateType.SUCCESS
      ]))
    },
    relations: withRelations ? { federatedCommunity: { community: true } } : undefined,
  })
}

export function findPendingCommunityHandshakeOrFailByOneTimeCode(
  oneTimeCode: number
): Promise<CommunityHandshakeState> {
  return CommunityHandshakeState.findOneOrFail({
    where: { oneTimeCode },
    relations: { federatedCommunity: { community: true } },
  })
}
  