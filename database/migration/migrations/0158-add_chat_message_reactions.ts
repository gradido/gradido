// AI-GENERATED — not an architecture reference
// Reactions to chat messages (Bernd, 11.10.2026): a member of a conversation answers a message
// with an emoji -- one of the wallet's forty-eight --, and everybody in the conversation sees it
// under the message. One reaction a member and message: another one takes its place, the same
// one again takes it back.
//
// `chat_message_reactions`, one row for a member's reaction to a message:
//
//   message_id      the message, by its id on this server -- unlike a picture (0146), a reaction
//                   is written long after its message, so the id is there.
//   community_uuid  the member who reacted, by their pair, as chat_conversation_members names
//   gradido_id      a member. UNIQUE with message_id: one reaction a member and message.
//   emoji           the reaction. Taken back, the row is deleted.
//   id              the order the members reacted in; a changed reaction keeps its place.
//   created_at      when the row was written, as every chat table has it (0142): the member's
//                   first reaction to the message -- another emoji in its place keeps it. Read
//                   by nobody; when the reactions to a message changed last is on the message.
//
// ⛔ `emoji` is compared byte by byte (utf8mb4_bin). The tables' own collation,
// utf8mb4_unicode_ci, gives every character beyond the Basic Multilingual Plane the same weight
// -- and that is where most emoji are: a thumb and a seedling are equal to it (measured on
// MariaDB 10.11, 11.10.2026), and so are a heart with and without the selector for its coloured
// drawing. A comparison, a GROUP BY or a key on the column would take them for one.
//
// `chat_messages.reacted_at`: when the reactions to a message were changed last -- set, replaced
// or taken back --, by the database's clock in utc, as `edited_at` (0151) is for its text. NULL
// for a message nobody reacted to, and that is the sentence every existing row needs.
//
// The index is for the wallet's beat (dbSelectChatMessagesReactedAfter), as the one on
// `edited_at` is: "where did the reactions change since a moment ago" starts at that moment in
// the index and reads the few messages touched since -- measured on MariaDB 10.11 with 36,000
// messages: 5 rows on a beat, against 6,000 without it. Building it reads the table once; the
// column itself is added without rewriting a row.
//
// No foreign keys, like the other chat tables (0142): a message is soft-deleted, and a cascade
// would never fire.
//
// `IF NOT EXISTS` / `IF EXISTS`: DDL does not roll back, and start.sh has already stopped the
// services.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS chat_message_reactions (
      id int(10) unsigned NOT NULL AUTO_INCREMENT,
      message_id int(10) unsigned NOT NULL,
      community_uuid char(36) NOT NULL,
      gradido_id char(36) NOT NULL,
      emoji varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY chat_message_reactions_message_member_unique (message_id, community_uuid, gradido_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
  await queryFn(
    'ALTER TABLE `chat_messages` ADD COLUMN IF NOT EXISTS `reacted_at` datetime(3) NULL DEFAULT NULL AFTER `edited_at`, ADD INDEX IF NOT EXISTS `chat_messages_reacted_at_idx` (`reacted_at`);',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `chat_messages` DROP INDEX IF EXISTS `chat_messages_reacted_at_idx`, DROP COLUMN IF EXISTS `reacted_at`;',
  )
  await queryFn('DROP TABLE IF EXISTS chat_message_reactions;')
}
