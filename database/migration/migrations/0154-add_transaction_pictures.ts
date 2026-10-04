// AI-GENERATED — not an architecture reference
// A picture with a transfer: a member who sends Gradido to a member of their community may add
// one -- one of the five motifs of the thank-you greeting, or a photo of their own. The
// conversation of the two shows it with the booking.
//
// Two tables and a column, in the form the greeting has (0152, 0153): what a list may read in
// one table, the bytes in the other.
//
//   transaction_pictures        one row for each picture: the motif's key, or NULL for a photo
//                               of the member's own. The booking points at this row.
//   transaction_picture_images  the photo of such a row, in the form of `chat_message_images`
//                               (0146), `user_avatars` (0114) and `thank_you_greeting_pictures`
//                               (0153): the bytes in a mediumblob, `mime_type` (always
//                               image/jpeg), a time stamp, and the size the wallet gave. Same
//                               form on purpose, so that every kind of picture can move to
//                               another storage in one go. One photo a row, in one rendition:
//                               the chat's measure.
//
// ⛔ A table of its own for the bytes: the booking list reads the row of a picture for every
// booking of a page that has one, and a photo there would travel with every one of them.
//
//   transactions.transaction_picture_id   which picture a booking carries, on BOTH rows of a
//                               transfer -- the sender's SEND row and the recipient's RECEIVE
//                               row --, as `thank_you_card_id` is (0118). Each of the two gets
//                               the picture through their own row, and nobody else has one.
//
// ⛔ The booking points at the picture, not the picture at the booking: a booking has no key
// before it is saved, and the picture is filed BEFORE the booking (sendCoins) -- through
// Drizzle, while the booking is written through TypeORM, with no transaction across the two.
// This way round there is never a booking whose picture is missing; a picture whose booking
// never came is taken back out, or stays where nobody reaches it.
//
// Nullable with no default, and nothing is filled in for what already exists: no booking made
// before this column carried a picture.
//
// ⛔ No foreign key and no index, with the reasoning of 0118: a booking is history. A
// constraint would either take the booking with a picture that went away or block the removal,
// and neither is what a ledger should do. Nothing looks a booking up by its picture except the
// one question "does a booking of this member carry it?", which the index on `user_id` answers.
//
// `IF NOT EXISTS`: DDL does not roll back, and start.sh has already stopped the services by
// the time this runs.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS transaction_pictures (
      id int(10) unsigned NOT NULL AUTO_INCREMENT,
      motif varchar(32) NULL DEFAULT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
  await queryFn(`
    CREATE TABLE IF NOT EXISTS transaction_picture_images (
      id int(10) unsigned NOT NULL AUTO_INCREMENT,
      transaction_picture_id int(10) unsigned NOT NULL,
      width smallint(5) unsigned NOT NULL,
      height smallint(5) unsigned NOT NULL,
      image mediumblob NOT NULL,
      mime_type varchar(32) NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY transaction_picture_images_picture_unique (transaction_picture_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN IF NOT EXISTS `transaction_picture_id` int unsigned NULL DEFAULT NULL AFTER `thank_you_card_id`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `transactions` DROP COLUMN IF EXISTS `transaction_picture_id`;')
  await queryFn('DROP TABLE IF EXISTS transaction_picture_images;')
  await queryFn('DROP TABLE IF EXISTS transaction_pictures;')
}
