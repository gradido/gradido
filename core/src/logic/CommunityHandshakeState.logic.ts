import { CommunityHandshakeState, CommunityHandshakeStateType } from 'database'
import { FEDERATION_AUTHENTICATION_TIMEOUT_MS } from 'shared'

export class CommunityHandshakeStateLogic {
  public constructor(private self: CommunityHandshakeState) {}

  /**
   * Check for expired state and if not, check timeout and update (write into db) to expired state
   * @returns true if the community handshake state is expired
   */
  public async isTimeoutUpdate(): Promise<boolean> {
    const timeout = this.isTimeout()
    if (timeout && this.self.status !== CommunityHandshakeStateType.EXPIRED) {
      this.self.status = CommunityHandshakeStateType.EXPIRED
      await this.self.save()
    }
    return timeout
  }

  public isTimeout(): boolean {
    if (this.self.status === CommunityHandshakeStateType.EXPIRED) {
      return true
    }
    if ((Date.now() - this.self.updatedAt.getTime()) > FEDERATION_AUTHENTICATION_TIMEOUT_MS) {
      return true
    }
    return false
  }

  public isFailed(): boolean {
    return this.self.status === CommunityHandshakeStateType.FAILED
  }
}
