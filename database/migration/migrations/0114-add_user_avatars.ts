// AI-GENERATED — not an architecture reference
// The profile picture a member sets for their own account. Two JPEGs from one upload:
// the browser crops once and encodes the same square twice.
//
//   avatar_small  128x128, ~4-6 KB. The everyday picture -- navbar, lists, chat,
//                 transactions. This is the one that is shown to OTHER people and the
//                 one that will cross community borders once foreign avatars exist.
//   avatar_full   512x512, ~55 KB. The full crop, kept for the printed member card and
//                 for the member looking at their own picture.
//
// ⛔ avatar_full is own-view only and must never leave the community. It has exactly one
// viewer -- the member themselves -- which is why it needs no disclosure decision. The
// day someone hands it to a third party, or ships it in a federation payload, that
// stops being true. Anything shown to others reads avatar_small.
//
// Why two stored renditions rather than one plus resizing on demand: resizing on the
// server would mean an image library in the backend and CPU per request, and deriving
// the small one later would leave a window where the two disagree. Encoding both in the
// browser costs one extra canvas draw and keeps image handling out of the deployment.
//
// Its own table rather than a column on `users`, for one reason: `users` is read on
// nearly every request, and an image in it makes every one of those reads heavier.
// A side table is only touched when someone actually wants to see the picture.
//
// user_id IS the primary key, not a separate autoincrement id. One member, one
// picture — expressed in the schema, so a duplicate is structurally impossible rather
// than merely avoided by whoever writes the next query.
//
// mediumblob, not base64 text: base64 is 37% larger, and the delivery path this will
// eventually need (an HTTP endpoint with caching, once other members may see pictures
// too) wants bytes anyway.
//
// mime_type is always image/jpeg today, and it covers both renditions because the
// cropper produces nothing else. The column costs nothing and keeps the door open.
//
// No foreign key on purpose: users are soft-deleted (users.deleted_at), so ON DELETE
// CASCADE would never fire and would only look like protection. Wherever an account is
// removed for good, the avatar has to be removed with it — that is a code obligation,
// not something the schema can carry.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE user_avatars (
      user_id int(10) unsigned NOT NULL,
      avatar_small mediumblob NOT NULL,
      avatar_full mediumblob NOT NULL,
      mime_type varchar(32) NOT NULL,
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS user_avatars;')
}
