import { CommunityHandshakeState } from '..'
import { AbstractLoggingView } from './AbstractLogging.view'
import { FederatedCommunityLoggingView } from './FederatedCommunityLogging.view'

export class CommunityHandshakeStateLoggingView extends AbstractLoggingView {
  public constructor(private self: CommunityHandshakeState) {
    super()
  }

  public toJSON(): any {
    return {
      id: this.self.id,
      handshakeId: this.self.handshakeId,
      oneTimeCode: this.self.oneTimeCode,
      publicKey: this.self.publicKey.toString(this.bufferStringFormat),      
      status: this.self.status,
      lastError: this.self.lastError,
      createdAt: this.dateToString(this.self.createdAt),
      updatedAt: this.dateToString(this.self.updatedAt),
      federatedCommunity: this.self.federatedCommunity 
         ? new FederatedCommunityLoggingView(this.self.federatedCommunity) 
        : undefined,
    }
  }
}