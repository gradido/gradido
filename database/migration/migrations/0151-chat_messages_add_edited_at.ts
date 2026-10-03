// AI-GENERATED — not an architecture reference
// When the text of a message was changed last (Bernd, 01.10.2026, E-060): a member may change
// what they wrote, at any time, and the thread says "bearbeitet" beside it. The earlier text is
// not kept -- one column, no history.
//
// NULL for a message nobody changed, and that is the sentence every existing row needs: nothing
// was changed before.
//
// The index is for the wallet's beat (dbSelectChatMessagesEditedAfter): "what was changed since a
// moment ago" starts at that moment in the index and reads the few messages changed since --
// across the whole table, each then checked against the member's conversations. Measured on
// MariaDB 10.11 (01.10.2026): an index on (conversation_id, edited_at) was not used for this at
// all -- the member's conversations came first, and every message in them was read on every beat.
// Building the index reads the table once; the column itself is added without rewriting a row.
//
// `IF NOT EXISTS` / `IF EXISTS`: DDL does not roll back, and start.sh has already stopped the
// services.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `chat_messages` ADD COLUMN IF NOT EXISTS `edited_at` datetime(3) NULL DEFAULT NULL AFTER `created_at`, ADD INDEX IF NOT EXISTS `chat_messages_edited_at_idx` (`edited_at`);',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `chat_messages` DROP INDEX IF EXISTS `chat_messages_edited_at_idx`, DROP COLUMN IF EXISTS `edited_at`;',
  )
}
