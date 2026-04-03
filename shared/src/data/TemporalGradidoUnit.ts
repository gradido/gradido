import { GradidoUnit } from 'shared-native'

/**
 * TemporalGradidoUnit represents a GradidoUnit with a timestamp.
 * It is used to track the balance of a user at a specific point in time.
 */
export class TemporalGradidoUnit {
  public balance: GradidoUnit
  public balanceDate: Date

  constructor(balance: GradidoUnit, balanceDate: Date) {
    this.balance = balance
    this.balanceDate = balanceDate
  }

  public update(newBalanceDate: Date) {
    this.balance.decay(GradidoUnit.effectiveDecayDuration(this.balanceDate, newBalanceDate))
    this.balanceDate = newBalanceDate
  }

  /**
   * Adds another TemporalGradidoUnit. Mutate this instance.
   *
   * Assumes that `other.balance` is already valid at `other.balanceDate`.
   * This instance will be decayed forward to `other.balanceDate` before adding.
   *
   * @throws if other.balanceDate < this.balanceDate
   */
  public add(other: TemporalGradidoUnit): this {
    // effectiveDecayDuration will throw "End date must be after start date" if other.balanceDate is before this.balanceDate
    this.balance
      .decay(GradidoUnit.effectiveDecayDuration(this.balanceDate, other.balanceDate))
      .add(other.balance)
    this.balanceDate = other.balanceDate
    return this
  }

  /**
   * Returns add two TemporalGradidoUnit and return a new instance.
   *
   * Assumes that `other.balance` is already valid at `other.balanceDate`.
   * This instance will be decayed forward to `other.balanceDate` before adding.
   *
   * @throws if other.balanceDate < this.balanceDate
   */
  public plus(other: TemporalGradidoUnit): TemporalGradidoUnit {
    // effectiveDecayDuration will throw "End date must be after start date" if other.balanceDate is before this.balanceDate
    const newBalance = this.balance
      .decayed(GradidoUnit.effectiveDecayDuration(this.balanceDate, other.balanceDate))
      .add(other.balance)
    return new TemporalGradidoUnit(newBalance, other.balanceDate)
  }

  
  /**
   * Subtracts another TemporalGradidoUnit. Mutate this instance.
   *
   * Assumes that `other.balance` is already valid at `other.balanceDate`.
   * This instance will be decayed forward to `other.balanceDate` before adding.
   *
   * @throws if other.balanceDate < this.balanceDate
   * @throws if subtraction results in negative balance, when thrown balance was already decayed to other.balanceDate!
   */
  public sub(other: TemporalGradidoUnit): this {
    // effectiveDecayDuration will throw "End date must be after start date" if other.balanceDate is before this.balanceDate
    // extra step, extra new GradidoUnit call to able to check if subtraction would result in negative balance before mutating
    const decayedBalance = this.balance.decayed(GradidoUnit.effectiveDecayDuration(this.balanceDate, other.balanceDate))
    if (other.balance.gt(decayedBalance)) {
      throw new Error('Subtraction would result in negative balance.')
    }
    this.balance = decayedBalance.sub(other.balance)    
    this.balanceDate = other.balanceDate
    return this
  }

  /**
   * Subtracts another TemporalGradidoUnit and return a new instance.
   *
   * Assumes that `other.balance` is already valid at `other.balanceDate`.
   * This instance will be decayed forward to `other.balanceDate` before adding.
   *
   * @throws if other.balanceDate < this.balanceDate
   * @throws if subtraction results in negative balance
   */
  public minus(other: TemporalGradidoUnit): TemporalGradidoUnit {
    // effectiveDecayDuration will throw "End date must be after start date" if other.balanceDate is before this.balanceDate
    const newBalance = this.balance.decayed(GradidoUnit.effectiveDecayDuration(this.balanceDate, other.balanceDate))
    if (other.balance.gt(newBalance)) {
      throw new Error('Subtraction would result in negative balance.')
    }
    newBalance.sub(other.balance)    
    return new TemporalGradidoUnit(newBalance, other.balanceDate)
  }

  public equal(other: TemporalGradidoUnit): boolean {
    return this.balance.equal(other.balance) && this.balanceDate.getTime() === other.balanceDate.getTime()
  }
  public eq(other: TemporalGradidoUnit): boolean {
    return this.equal(other)
  }

  public notEqual(other: TemporalGradidoUnit): boolean {
    return !this.equal(other)
  }
  public ne(other: TemporalGradidoUnit): boolean {
    return this.notEqual(other)
  }

  public toString(): string {
    return `${this.balance.toString()} GDD at ${this.balanceDate.toISOString()}`
  }
  public toJSON(): object {
    return {
      balance: this.balance.toString(),
      balanceDate: this.balanceDate.toISOString(),
    }
  }
}
