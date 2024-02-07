import { AbstractLoggingView } from '@logging/AbstractLogging.view'

import { SendCoinsResult } from '@/federation/client/1_0/model/SendCoinsResult'

export class SendCoinsResultLoggingView extends AbstractLoggingView {
  public constructor(private self: SendCoinsResult) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      vote: this.self.vote,
      recipGradidoID: this.self.recipGradidoID,
      recipFirstName: this.self.recipFirstName?.substring(0, 3),
      recipLastName: this.self.recipLastName?.substring(0, 3),
      recipAlias: this.self.recipAlias?.substring(0, 3),
    }
  }
}
