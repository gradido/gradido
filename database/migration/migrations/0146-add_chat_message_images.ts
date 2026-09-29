// AI-GENERATED — not an architecture reference
// `chat_message_images`: a picture in a chat message (P7, E-041). The wallet scales it down and
// encodes it as a JPEG (area of 800 x 600, under 55 KB); the backend checks it the way it checks
// the avatar -- size, JPEG markers, no decoder -- and files it here.
//
// Stored in the form of `user_avatars` (0114): the bytes in a mediumblob, `mime_type` (always
// image/jpeg), a time stamp. Same form on purpose, so that both kinds of picture can move to
// another storage in one go. What a chat picture has beyond an avatar:
//
//   image_uuid    what the wallet fetches the picture by; UNIQUE.
//   message_uuid  the message the picture belongs to.
//   position      its place in the message, ready for several pictures in one; 0 while a
//                 message carries one. UNIQUE with message_uuid.
//   width/height  so the bubble knows its room before the picture has come. Given by the
//                 wallet: without a decoder the server cannot measure them, only bound them.
//
// ⛔ `message_uuid`, not the message's id: the picture is written BEFORE its message, and a
// message whose row could not be filed takes its pictures back out. The id does not exist yet
// when the picture is written; the uuid is made first and names the message on both servers,
// which is what a picture crossing the border (P7b) will need.
//
// `image` is NOT NULL: a message here always brings its picture with it. Should the next step
// fetch the picture of a message from another community later instead, that needs a migration
// to NULL.
//
// No foreign keys, like the other chat tables (0142): a message is soft-deleted, and a cascade
// would never fire.
//
// An empty table and nothing else: no existing row is read or changed.
//
// `IF NOT EXISTS`, same reason as 0142: DDL does not roll back, and start.sh has already stopped
// the services by the time this runs.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS chat_message_images (
      id int(10) unsigned NOT NULL AUTO_INCREMENT,
      image_uuid char(36) NOT NULL,
      message_uuid char(36) NOT NULL,
      position tinyint(3) unsigned NOT NULL DEFAULT 0,
      width smallint(5) unsigned NOT NULL,
      height smallint(5) unsigned NOT NULL,
      image mediumblob NOT NULL,
      mime_type varchar(32) NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY chat_message_images_image_uuid_unique (image_uuid),
      UNIQUE KEY chat_message_images_message_uuid_position_unique (message_uuid, position)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS chat_message_images;')
}
