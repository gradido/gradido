// AI-GENERATED — not an architecture reference
// `thank_you_greeting_pictures`: the picture of a thank-you greeting that carries a photo of the
// member's own instead of a motif (`thank_you_greetings.motif` is NULL for it, as 0152 prepared).
// The wallet cuts the photo to the card's frame, scales it down and encodes it as JPEG, twice;
// the backend checks each the way it checks a chat picture -- size, JPEG markers, no decoder --
// and files it here, one row for each rendition:
//
//   small  in the chat's measure (under 35 KB). It stays: the booking an accepted greeting
//          becomes shows it in the conversation of the two.
//   large  up to 72 KB, for the page the link opens as. Taken out when the thank-you is
//          accepted or deleted.
//
// Stored in the form of `chat_message_images` (0146) and `user_avatars` (0114): the bytes in a
// mediumblob, `mime_type` (always image/jpeg), a time stamp, and the size the wallet gave. Same
// form on purpose, so that every kind of picture can move to another storage in one go.
//
// ⛔ Keyed by the link's CODE, as `thank_you_greetings` is (0152 says why): greeting and picture
// are written BEFORE their link, and the code is what names the link before it is saved. UNIQUE
// with the rendition: a link has one picture of each, and a second upload is refused by the key.
//
// ⛔ A table of its own, not columns of `thank_you_greetings`: the lists of links and of bookings
// read a greeting's whole row.
//
// No foreign key: a link is soft-deleted, and a cascade would never fire. The rows are taken
// out by deleteTransactionLink (both) and after a link was redeemed (the large one).
//
// An empty table and nothing else: no existing row is read or changed. Every greeting there is
// today has a motif and no row here.
//
// `IF NOT EXISTS`: DDL does not roll back, and start.sh has already stopped the services by
// the time this runs.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS thank_you_greeting_pictures (
      id int(10) unsigned NOT NULL AUTO_INCREMENT,
      transaction_link_code varchar(24) NOT NULL,
      rendition varchar(8) NOT NULL,
      width smallint(5) unsigned NOT NULL,
      height smallint(5) unsigned NOT NULL,
      image mediumblob NOT NULL,
      mime_type varchar(32) NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY thank_you_greeting_pictures_code_rendition_unique (transaction_link_code, rendition)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS thank_you_greeting_pictures;')
}
