// AI-GENERATED — not an architecture reference
// The profile picture a member sets for their own account. One square JPEG, 512x512,
// produced in the browser and capped there at ~55 KB.
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
// mime_type is always image/jpeg today. The column costs nothing and keeps the door
// open; reading it is cheaper than guessing from the first bytes later.
//
// No foreign key on purpose: users are soft-deleted (users.deleted_at), so ON DELETE
// CASCADE would never fire and would only look like protection. Wherever an account is
// removed for good, the avatar has to be removed with it — that is a code obligation,
// not something the schema can carry.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE user_avatars (
      user_id int(10) unsigned NOT NULL,
      image mediumblob NOT NULL,
      mime_type varchar(32) NOT NULL,
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS user_avatars;')
}
