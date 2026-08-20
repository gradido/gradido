// AI-GENERATED — not an architecture reference
// HOW the stored PIN hash was derived: 1 = the password KDF (argon2id + shorthash), 2 = a
// keyed BLAKE2b. A hash cannot be converted, so every existing row keeps the value 1 --
// which is exactly how its hash was made -- and is upgraded in place the next time its PIN
// is proved right. New rows are written with 2 from the start.
//
// ⚠️ Why the PIN leaves the password KDF (Dario, 20.08.2026): a six digit space is
// brute-forced in minutes whatever the KDF costs, so the expensive derivation bought no
// safety -- but every check spent 32 MiB and a slot in the same worker queue the login
// waits in, and a market day of card payments could fill that queue for everyone. The
// keyed hash costs microseconds and needs no queue; the server secrets still make a
// database dump unreadable on its own.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `thank_you_card_settings` ADD COLUMN `pin_derivation` tinyint unsigned NOT NULL DEFAULT 1 AFTER `pin_salt`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `thank_you_card_settings` DROP COLUMN `pin_derivation`;')
}
