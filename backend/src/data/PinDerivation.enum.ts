// AI-GENERATED — not an architecture reference

/**
 * How `thank_you_card_settings.pin` was derived. Stored per row, because a hash cannot be
 * converted: existing rows keep saying how theirs was made and are upgraded in place the
 * next time their PIN is proved right.
 */
export enum PinDerivation {
  /** The password KDF (argon2id + shorthash) -- the original way, expensive by design. */
  PASSWORD_KDF = 1,
  /**
   * A keyed BLAKE2b -- microseconds instead of 32 MiB, no worker queue. The right cost for
   * a six digit space whose real protection is the three-attempt block, not the KDF.
   */
  KEYED_HASH = 2,
}
