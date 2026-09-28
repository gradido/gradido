// AI-GENERATED — not an architecture reference
// Whether the transfers between this member and somebody else stand in their conversation, and
// whether this member gets a mail about a transfer they receive -- one switch for both, under
// Einstellungen › Nachrichten (Bernd, 28.09.2026: "Ein Schalter, dass Transaktionen auch
// Chatnachrichten und E-Mails auslösen" -- "vom Werk aus, also default, auf „an“"). A shop with
// many bookings switches it off, and its conversations keep to the messages.
//
// DEFAULT 1, and that is the sentence every existing account needs: the mail about a received
// transfer keeps going out as it always has, and the transfers stand in the conversations. Only
// the account holder switches it off. NOT NULL: on or off, there is no third state.
//
// `IF NOT EXISTS`: DDL does not roll back, and start.sh has already stopped the services.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `transfers_in_chat` tinyint(1) NOT NULL DEFAULT 1 AFTER `creation_allowed`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `users` DROP COLUMN IF EXISTS `transfers_in_chat`;')
}
