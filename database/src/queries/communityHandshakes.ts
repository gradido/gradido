import { Ed25519PublicKey } from 'shared'
import { In, Not } from 'typeorm'
import { CommunityHandshakeState, CommunityHandshakeStateType } from '..'

/**
 * Find a pending community handshake by public key.
 * @param publicKey The public key of the community.
 * @param apiVersion The API version of the community.
 * @param status The status of the community handshake. Optional, if not set, it will find a pending community handshake.
 * @returns The CommunityHandshakeState with associated federated community and community.
 */
export function findPendingCommunityHandshake(
  publicKey: Ed25519PublicKey,
  apiVersion: string,
  status?: CommunityHandshakeStateType,
): Promise<CommunityHandshakeState | null> {
  return CommunityHandshakeState.findOne({
    where: {
      publicKey: publicKey.asBuffer(),
      apiVersion,
      status:
        status ||
        Not(
          In([
            CommunityHandshakeStateType.EXPIRED,
            CommunityHandshakeStateType.FAILED,
            CommunityHandshakeStateType.SUCCESS,
          ]),
        ),
    },
  })
}

export function findPendingCommunityHandshakeOrFailByOneTimeCode(
  oneTimeCode: number,
): Promise<CommunityHandshakeState> {
  return CommunityHandshakeState.findOneOrFail({
    where: { oneTimeCode },
  })
}
