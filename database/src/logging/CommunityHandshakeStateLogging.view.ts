import { CommunityHandshakeStateSelect, CommunityHandshakeStateInsert } from '..'
import { AbstractLoggingView } from './AbstractLogging.view'

export class CommunityHandshakeStateLoggingView extends AbstractLoggingView {
  public constructor(private self: CommunityHandshakeStateSelect | CommunityHandshakeStateInsert) {
    super()
  }

  public toJSON(): any {
    return {
      id: this.self.id,
      handshakeId: this.self.handshakeId,
      oneTimeCode: this.self.oneTimeCode,
      publicKey: this.self.publicKey.toString(),
      status: this.self.status,
      lastError: this.self.lastError,
      createdAt: this.dateToString(this.self.createdAt),
      updatedAt: this.dateToString(this.self.updatedAt),
    }
  }
}
