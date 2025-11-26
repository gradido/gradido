import { AbstractLoggingView } from 'database'
import type { Decay as DecayInterface } from 'shared'
import { Decay } from '../model/Decay'

export class DecayLoggingView extends AbstractLoggingView {
  public constructor(private self: Decay | DecayInterface) {
    super()
  }

  public toJSON(): any {
    return {
      balance: this.decimalToString(this.self.balance),
      decay: this.decimalToString(this.self.decay),
      roundedDecay: this.decimalToString(this.self.roundedDecay),
      start: this.dateToString(this.self.start),
      end: this.dateToString(this.self.end),
      duration: this.self.duration,
    }
  }
}
