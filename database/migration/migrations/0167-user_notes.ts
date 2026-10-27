// AI-GENERATED — not an architecture reference
// A member's own notes (Bernd, 27.10.2026): beside the magnifier of a contact's or a group's chat
// window, a note only the member sees -- somebody's full name, where they met, what a group is for.
//
// `user_notes`, one row for a note a member keeps:
//
//   user_id                 whose note it is: the member who writes and reads it. Nobody else
//                           reads it -- not the person or the group it is about, not a moderator.
//   subject_kind            what it is about: 'member' or 'group'.
//   subject_community_uuid  'member': the person's community, as a heart names it (0128).
//                           'group': '' -- a group is named by its uuid alone, as the wallet and
//                           chat_conversations.conversation_uuid name it. Empty rather than NULL:
//                           the column is part of the primary key.
//   subject_uuid            'member': the person's gradido id. 'group': the group's uuid.
//   note                    the words, as long as a chat message may be (MESSAGE_MAX_CHARS); a
//                           `text` of 65,535 bytes holds the heaviest of them.
//   created_at, updated_at  as the other tables of a member's own settings have them.
//
// PRIMARY KEY (user_id, subject_kind, subject_community_uuid, subject_uuid): one note per member
// and subject. Writing it again replaces it, and an emptied note is no row.
//
// No foreign key, as for the hearts (0128): users are soft-deleted, and the person a note is about
// may belong to another community.
//
// `IF NOT EXISTS` / `IF EXISTS`: DDL does not roll back, and start.sh has already stopped the
// services.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS user_notes (
      user_id int(10) unsigned NOT NULL,
      subject_kind varchar(16) NOT NULL,
      subject_community_uuid varchar(36) NOT NULL,
      subject_uuid varchar(36) NOT NULL,
      note text NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (user_id, subject_kind, subject_community_uuid, subject_uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS user_notes;')
}
