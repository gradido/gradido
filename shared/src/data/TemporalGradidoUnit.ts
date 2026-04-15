import { Duration } from './Duration'
import { GradidoUnit } from './GradidoUnit'

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

  /**
   * Returns a new TemporalGradidoUnit where the balance has been decayed
   * from the current balanceDate to the provided newBalanceDate.
   *
   * This represents the value of the unit after time-based decay has been
   * applied over the elapsed duration.
   *
   * The original instance remains unchanged.
   *
   * @param newBalanceDate The target timestamp to which the balance is decayed.
   * @returns A new TemporalGradidoUnit with the decayed balance at newBalanceDate.
   */
  public decayedTo(newBalanceDate: Date) {
    return new TemporalGradidoUnit(
      this.balance.decayed(this.balanceDate, newBalanceDate),
      newBalanceDate,
    )
  }
  /**
   * Returns a new TemporalGradidoUnit where the balance has been decayed
   * forward by the given duration starting from the current balanceDate.
   *
   * This is a convenience wrapper around `decayedTo`, converting a relative
   * duration into an absolute target timestamp.
   *
   * The original instance remains unchanged.
   *
   * @param duration The time span to decay the balance forward.
   * @returns A new TemporalGradidoUnit with the decayed balance at (balanceDate + duration).
   */
  public decayedFor(duration: Duration) {
    return this.decayedTo(new Date(this.balanceDate.getTime() + Number(duration.seconds) * 1000))
  }

  /**
   * Returns add two TemporalGradidoUnit and return a new instance.
   *
   * Assumes that `other.balance` is already valid at `other.balanceDate`.
   * This instance will be decayed forward to `other.balanceDate` before adding.
   *
   * @throws if other.balanceDate < this.balanceDate
   */
  public add(other: TemporalGradidoUnit): TemporalGradidoUnit {
    // effectiveDecayDuration will throw "End date must be after start date" if other.balanceDate is before this.balanceDate
    const newBalance = this.balance.decayed(this.balanceDate, other.balanceDate).add(other.balance)
    return new TemporalGradidoUnit(newBalance, other.balanceDate)
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
  public subtract(other: TemporalGradidoUnit): TemporalGradidoUnit {
    // effectiveDecayDuration will throw "End date must be after start date" if other.balanceDate is before this.balanceDate
    const newBalance = this.balance.decayed(this.balanceDate, other.balanceDate)
    if (other.balance.gddCent > newBalance.gddCent) {
      throw new Error('Subtraction would result in negative balance.')
    }
    return new TemporalGradidoUnit(newBalance.subtract(other.balance), other.balanceDate)
  }

  public equal(other: TemporalGradidoUnit): boolean {
    return (
      this.balance.gddCent === other.balance.gddCent &&
      this.balanceDate.getTime() === other.balanceDate.getTime()
    )
  }

  public notEqual(other: TemporalGradidoUnit): boolean {
    return !this.equal(other)
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
