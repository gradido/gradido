// AI-GENERATED — not an architecture reference

/**
 * How `thank_you_card_settings.pin` was derived. Stored per row so that the NEXT change of
 * derivation finds every row saying which one made its hash -- a hash cannot be converted,
 * and a column added only when it is needed would come too late.
 *
 * ⚠️ The value 1 is reserved and must not be reused: it named the password KDF (argon2id +
 * shorthash) the PIN used before Dario's finding of 20.08.2026 -- expensive by design,
 * pointless for a six digit space, and queued in the same worker pool the login waits in.
 * That derivation never reached a release, so no row carries a 1.
 */
export enum PinDerivation {
  /**
   * A keyed BLAKE2b -- microseconds instead of 32 MiB, no worker queue. The right cost for
   * a six digit space whose real protection is the three-attempt block, not the KDF.
   */
  KEYED_HASH = 2,
}
