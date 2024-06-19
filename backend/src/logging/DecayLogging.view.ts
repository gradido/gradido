import { Decay } from '@/graphql/model/Decay'
import { AbstractLoggingView } from '@logging/AbstractLogging.view'

export class DecayLoggingView extends AbstractLoggingView {
  public constructor(private self: Decay) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      balance: this.decimalToString(this.self.balance),
      decay: this.decimalToString(this.self.decay),
      roundedDecay: this.decimalToString(this.self.roundedDecay),
      start: this.dateToString(this.self.start),
      end: this.dateToString(this.self.end),
      duration: this.self.duration
    }
  }
}
