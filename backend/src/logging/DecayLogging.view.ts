import { Decay } from '@model/Decay'
import { AbstractLoggingView } from 'database'
import type { Decay as DecayInterface } from 'shared'

export class DecayLoggingView extends AbstractLoggingView {
  public constructor(private self: Decay | DecayInterface) {
    super()
  }

  public toJSON(): any {
    return {
      balance: this.self.balance,
      decay: this.self.decay,
      start: this.dateToString(this.self.start),
      end: this.dateToString(this.self.end),
      duration: this.self.duration,
    }
  }
}
