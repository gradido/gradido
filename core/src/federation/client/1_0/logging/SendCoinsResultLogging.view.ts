import { AbstractLoggingView } from 'database'

import { SendCoinsResult } from '../model/SendCoinsResult'

export class SendCoinsResultLoggingView extends AbstractLoggingView {
  public constructor(private self: SendCoinsResult) {
    super()
  }

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
