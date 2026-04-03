import { GradidoUnit } from 'shared-native'

const decayStartTime = GradidoUnit.getDecayStartTime()

export class Decay {
  public balance: GradidoUnit
  public decay: GradidoUnit
  public roundedDecay: GradidoUnit
  public start: Date | null
  public end: Date | null
  public duration: number | null

  public constructor(amount: GradidoUnit) {
    this.balance = amount
    this.decay = new GradidoUnit(0)
    this.roundedDecay = new GradidoUnit(0)
    this.start = null
    this.end = null
    this.duration = null
  }

  public calculateDecay(from: Date, to: Date): this {
    // will throw an exception, if from > to
    const duration = GradidoUnit.effectiveDecayDuration(from, to)
    if (duration <= 0) {
      return this
    }

    if (decayStartTime > from) {
      this.start = decayStartTime
    } else {
      this.start = from
    }
    const decayedBalance = this.balance.decayed(duration)
    this.end = to
    this.duration = duration
    // minus return new GradidoUnit Instance
    this.decay = decayedBalance.minus(this.balance)
    // sub mutate the instance (new) returned from rounded and return this
    this.roundedDecay = decayedBalance.rounded(2).sub(this.balance.rounded(2))
    this.balance = decayedBalance
    return this
  }

  public toString(): string {
    if (this.duration) {
      return `${this.start?.toISOString()} -> ${this.end?.toISOString()} = ${this.duration} seconds, ${this.balance.toString()} GDD - ${this.decay.toString()} GDD (${this.roundedDecay.toString(2)} GDD)`
    } else {
      return `${this.balance.toString()} GDD - No decay calculated`
    }
  }

  public toJSON(): object {
    return {
      balance: this.balance.toString(),
      decay: this.decay.toString(),
      roundedDecay: this.roundedDecay.toString(2),
      start: this.start?.toISOString(),
      end: this.end?.toISOString(),
      duration: this.duration,
    }
  }
}
