// AI-GENERATED — not an architecture reference
// A member's own picture of a contact (Bernd, 10.11.2026, AS-023/AS-024): a picture only the
// member sees, wherever that contact stands in their wallet -- as the contacts of a phone have one.
//
// `user_kept_pictures`, one row for a picture a member keeps of a person:
//
//   user_id                 whose picture it is: the member who set it and alone reads it. Nobody
//                           else reads it -- not the person it shows, not a moderator, not another
//                           community.
//   subject_community_uuid  the person's community, as a heart and a note name it (0128, 0167).
//   subject_gradido_id      the person's gradido id.
//   picture_small           128x128 JPEG, the rendition every list draws (as avatar_small, 0114).
//   picture_full            512x512 JPEG, for the enlarged view (as avatar_full).
//   mime_type               as user_avatars has it.
//   created_at, updated_at  as the other tables of a member's own things have them.
//
// PRIMARY KEY (user_id, subject_community_uuid, subject_gradido_id): one picture per member and
// person. Setting it again replaces it.
//
// No foreign key, as for the hearts and the notes: users are soft-deleted, and the person a
// picture is of may belong to another community. The picture stays when that person withdraws
// their own or closes their account (AS-023: it is the member's memory of them, as the note is).
//
// `IF NOT EXISTS` / `IF EXISTS`: DDL does not roll back, and start.sh has already stopped the
// services.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS user_kept_pictures (
      user_id int(10) unsigned NOT NULL,
      subject_community_uuid varchar(36) NOT NULL,
      subject_gradido_id varchar(36) NOT NULL,
      picture_small mediumblob NOT NULL,
      picture_full mediumblob NOT NULL,
      mime_type varchar(32) NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (user_id, subject_community_uuid, subject_gradido_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS user_kept_pictures;')
}
