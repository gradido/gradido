// AI-GENERATED — not an architecture reference
// Paying with a printed card ("Dank-Karte"). The card is shown to a device, the way an
// EC card is; the person who scans it is the RECIPIENT and is logged in, while the payer
// only holds paper and confirms with a PIN on the recipient's screen.
//
// Three tables, split along who owns what:
//
//   thank_you_card_settings  what belongs to the PERSON  — PIN and the two limits.
//   thank_you_cards          what belongs to the CARD    — code, label, failed attempts.
//   thank_you_card_payments  the short-lived request     — amount, recipient, state.
//
// Why the PIN sits with the person and the failure counter with the card: one human
// remembers one PIN, so storing it per card would mean remembering two. The counter is
// the opposite — once more than one card may be valid, guessing at one must not kill the
// other.
//
// The existence of a settings row IS the on/off switch. Enabling means setting a PIN,
// disabling means deleting it, so the state "enabled but without a PIN" cannot exist.
// Every account that exists today has no row, so card payment is off for everyone.
//
// ⛔ A blocked card is never deleted. The row has to survive so that scanning an old
// card can say "this card is blocked" instead of running into nothing, so that the list
// of past cards exists at all, and so that a receipt for an old payment can still name
// the card it was made with.
//
// The code is 16 random bytes with a DK- prefix and carries NO timestamp. The house's
// transaction links spend part of their 24 characters on the creation time, which leaves
// 52 bits of randomness and prints the creation date in clear. That is fine for a link
// that lives days; a card lives years in a wallet, and length inside a QR is free.
//
// Security model: limits and the failed-attempt block, not the secrecy of the PIN. The
// PIN travels over the recipient's screen, so it can be watched — it must therefore never
// protect more than one is willing to lose. See the project notes (PS-016, PS-017).
//
// ⚠️ payments.state is written BEFORE the booking runs, deliberately. A TypeORM
// transaction does not cover Drizzle writes (AGENTS.md), so the two cannot be atomic.
// Consuming first means a crash in between leaves "request used, no money moved" rather
// than "money moved, request still open" — the second one would allow a double booking.
//
// No foreign keys, following user_avatars: users are soft-deleted, so ON DELETE CASCADE
// would never fire and would only look like protection.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE thank_you_card_settings (
      user_id int(10) unsigned NOT NULL,
      pin bigint NOT NULL,
      pin_salt varchar(64) NOT NULL,
      max_per_payment_gdd4 bigint NOT NULL,
      max_per_day_gdd4 bigint NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE thank_you_cards (
      id int(10) unsigned NOT NULL AUTO_INCREMENT,
      user_id int(10) unsigned NOT NULL,
      code varchar(40) NOT NULL,
      label varchar(64) NOT NULL,
      failed_attempts int(10) unsigned NOT NULL DEFAULT 0,
      blocked_at datetime(3) DEFAULT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY thank_you_cards_code_unique (code),
      KEY thank_you_cards_user_id_idx (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE thank_you_card_payments (
      id int(10) unsigned NOT NULL AUTO_INCREMENT,
      card_id int(10) unsigned NOT NULL,
      recipient_id int(10) unsigned NOT NULL,
      amount_gdd4 bigint NOT NULL,
      memo varchar(512) NOT NULL,
      state varchar(16) NOT NULL DEFAULT 'open',
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      valid_until datetime(3) NOT NULL,
      PRIMARY KEY (id),
      KEY thank_you_card_payments_card_id_idx (card_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS thank_you_card_payments;')
  await queryFn('DROP TABLE IF EXISTS thank_you_cards;')
  await queryFn('DROP TABLE IF EXISTS thank_you_card_settings;')
}
