/// <reference types="node" />

/**
 * Represents a single Gradido unit, which internally stores amounts as integer-based units.
 * Provides methods for arithmetic, decay calculation, and conversion to string representations.
 *
 * @example
 * ```ts
 * const gdd = new GradidoUnit(100.25);
 * gdd.calculateDecay(3600); // decay of 1 hour in seconds
 * gdd.add(new GradidoUnit(50));
 * console.log(gdd.toString(4)); // "150.2500"
 * ```
 */
export class GradidoUnit {
  /**
   * Create a new GradidoUnit instance.
   * @param value - Initial value, either as number or string. Strings must be valid decimal representations. Optional.
   */
  constructor(value?: number | string)

  /**
   * Convert the GradidoUnit to a string representation with optional precision.
   * @param precision - Number of decimal places (default: 4, max: 4)
   * @returns Decimal string representation of the unit
   */
  toString(precision?: number): string

  /**
   * Convert the GradidoUnit to a number representation.
   * @returns Number representation of the unit
   */
  toNumber(): number

  /**
   * Negate the current value of this GradidoUnit.
   * @returns Returns `this` for chaining
   */
  negate(): this

  /**
   * Create new GradidoUnit with negated value from this
   * Does NOT modify the current instance.
   * @returns Returns new GradidoUnit instance
   */
  negated(): GradidoUnit

  /**
   * Round the current value of this GradidoUnit to the specified precision.
   * @param precision - Number of decimal places to round to (default: 2)
   * @returns Returns `this` for chaining
   */
  round(precision?: number): this

  /**
   * Create new GradidoUnit with rounded value from this
   * Does NOT modify the current instance.
   * @param precision - Number of decimal places to round to (default: 2)
   * @returns Returns new GradidoUnit instance
   */
  rounded(precision?: number): GradidoUnit

  /**
   * Apply decay to the current unit for a given duration in seconds.
   * The decay formula uses a compound-interest-like algorithm (e.g., 50% decay per year).
   * @param duration - Duration in seconds for decay
   * @returns Returns `this` for chaining
   */
  decay(duration: number): this

  /**
   * Create new GradidoUnit with decay from this for duration
   * The decay formula uses a compound-interest-like algorithm (e.g., 50% decay per year).
   * @param duration - Duration in seconds for decay
   * @returns Returns new GradidoUnit instance
   */
  decayed(duration: number): GradidoUnit

  /**
   * Apply reverse decay / compound interest (negative duration) to the current unit.
   * Used to calculate future decay, like by the transaction links.
   * @param duration - Duration in seconds to "grow" the unit
   * @returns Returns `this` for chaining
   */
  compoundInterest(duration: number): this

  /**
   * Create new GradidoUnit with reverse decay / compound interest (negative duration) from this
   * Used to calculate future decay, like by the transaction links.
   * @param duration - Duration in seconds to "grow" the unit
   * @returns Returns new GradidoUnit instance
   */
  compoundInterested(duration: number): GradidoUnit

  /**
   * Add another GradidoUnit value to this.
   * @param other - Another GradidoUnit instance
   * @returns Returns a this GradidoUnit instance with value from other added
   */
  add(other: GradidoUnit): this

  /**
   * Add this GradidoUnit with another GradidoUnit.
   * @param other - Another GradidoUnit instance
   * @returns Returns a new GradidoUnit instance with the sum of the two values
   */
  plus(other: GradidoUnit): GradidoUnit

  /**
   * Subtract another GradidoUnit from this one.
   * @param other - Another GradidoUnit instance
   * @returns Returns a new GradidoUnit instance with the difference of the two values
   */
  minus(other: GradidoUnit): GradidoUnit

  /**
   * Subtract another GradidoUnit from this one.
   * @param other - Another GradidoUnit instance
   * @returns Returns this GradidoUnit instance after subtract the value of other
   */
  sub(other: GradidoUnit): this

  /**
   * Calculates the effective decay duration in seconds between two dates.
   *
   * The decay starts at the global fixed decay start time.
   *
   * - If both start and end are before the decay start time -> returns 0
   * - If start is before the decay start time -> returns duration from decay start time to end
   * - Otherwise -> returns duration from start to end
   *
   * Delegates to the underlying C implementation for accurate handling.
   *
   * @param startTime - Start Date
   * @param endTime - End Date
   * @returns Duration in seconds
   * @throws EndTimeBeforeStartTime if startTime > endTime
   *
   * @example
   * ```ts
   * const duration = GradidoUnit.effectiveDecayDuration(
   *   new Date('2026-01-01'),
   *   new Date('2026-01-02')
   * )
   * console.log(duration) // 86400
   * ```
   */
  static effectiveDecayDuration(startTime: Date, endTime: Date): number

  /**
   * Returns the decay start time as a JavaScript Date object.
   */
  static getDecayStartTime(): Date

  /**
   * Returns true if this value is equal to the other.
   */
  equal(other: GradidoUnit): boolean

  /**
   * Alias for {@link equal}
   */
  eq(other: GradidoUnit): boolean

  // --------------------------------------------------

  /**
   * Returns true if this value is not equal to the other.
   */
  notEqual(other: GradidoUnit): boolean

  /**
   * Alias for {@link notEqual}
   */
  ne(other: GradidoUnit): boolean

  // --------------------------------------------------

  /**
   * Returns true if this value is greater than the other.
   */
  greaterThan(other: GradidoUnit): boolean

  /**
   * Alias for {@link greaterThan}
   */
  gt(other: GradidoUnit): boolean

  // --------------------------------------------------

  /**
   * Returns true if this value is less than the other.
   */
  lessThan(other: GradidoUnit): boolean

  /**
   * Alias for {@link lessThan}
   */
  lt(other: GradidoUnit): boolean

  // --------------------------------------------------

  /**
   * Returns true if this value is greater than or equal to the other.
   */
  greaterOrEqual(other: GradidoUnit): boolean

  /**
   * Alias for {@link greaterOrEqual}
   */
  gte(other: GradidoUnit): boolean

  // --------------------------------------------------

  /**
   * Returns true if this value is less than or equal to the other.
   */
  lessOrEqual(other: GradidoUnit): boolean

  /**
   * Alias for {@link lessOrEqual}
   */
  lte(other: GradidoUnit): boolean
}
