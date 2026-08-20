// AI-GENERATED — not an architecture reference
// HOW the stored PIN hash was derived. Today there is exactly one answer -- 2, a keyed
// BLAKE2b -- and the column exists for the NEXT change of derivation: a hash cannot be
// converted, so the day one arrives, every row must already say which derivation made its
// hash. Adding the column then would be too late; adding it now costs one tinyint.
//
// The value 1 stays reserved: it named the password KDF (argon2id + shorthash) the PIN
// used before Dario's finding of 20.08.2026 -- a six digit space is brute-forced in
// minutes whatever the KDF costs, while every check spent 32 MiB and a slot in the same
// worker queue the login waits in. That derivation never reached a release, so no row
// carries a 1; the few PINs set on the test servers before this migration simply stop
// matching and are set anew.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `thank_you_card_settings` ADD COLUMN `pin_derivation` tinyint unsigned NOT NULL DEFAULT 2 AFTER `pin_salt`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `thank_you_card_settings` DROP COLUMN `pin_derivation`;')
}
