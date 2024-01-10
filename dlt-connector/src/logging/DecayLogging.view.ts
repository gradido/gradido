import { Decay } from '@/graphql/model/Decay'

import { AbstractLoggingView } from './AbstractLogging.view'

export class DecayLoggingView extends AbstractLoggingView {
  public constructor(private self: Decay) {
    super()
  }

  public toJSON() {
    return {
      balance: this.decimalToString(this.self.balance),
      decay: this.decimalToString(this.self.decay),
      roundedDecay: this.decimalToString(this.self.roundedDecay),
      start: this.dateToString(this.self.start),
      end: this.dateToString(this.self.end),
      duration: this.self.duration + 's',
    }
  }
}
