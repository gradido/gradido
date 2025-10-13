import { CommunityHandshakeState, CommunityHandshakeStateType } from 'database'
import { FEDERATION_AUTHENTICATION_TIMEOUT_MS } from 'shared'

export class CommunityHandshakeStateLogic {
  public constructor(private communityHandshakeStateEntity: CommunityHandshakeState) {}

  /**
   * Check for expired state and if not, check timeout and update (write into db) to expired state
   * @returns true if the community handshake state is expired
   */
  public async isTimeoutUpdate(): Promise<boolean> {
    if (this.communityHandshakeStateEntity.status === CommunityHandshakeStateType.EXPIRED) {
      return true
    }
    if (Date.now() - this.communityHandshakeStateEntity.updatedAt.getTime() > FEDERATION_AUTHENTICATION_TIMEOUT_MS) {
      this.communityHandshakeStateEntity.status = CommunityHandshakeStateType.EXPIRED
      await this.communityHandshakeStateEntity.save()
      return true
    }
    return false
  }
}
