// AI-GENERATED — not an architecture reference
// `thank_you_greetings`: what a thank-you greeting has beyond the transaction link it is. A
// greeting IS a transaction link -- amount, memo, code and the 14 days are the link's, and stay
// in `transaction_links`. This table holds what the card shows on top of them:
//
//   motif           the key of one of the wallet's motifs ('heart-leaves', ...). NULL is for a
//                   greeting that carries a photo of the member's own instead; none does yet.
//   line            the first line of the card, set in handwriting there. It is also the
//                   beginning of the link's memo, and that is where it stays for good: the
//                   memo goes into the booking, this row does not.
//   recipient_name  "Für wen?" -- a name the sender wrote freely. No account stands behind
//                   it: the system does not know who a link is for.
//
// ⛔ Keyed by the link's CODE, not by its id. The greeting is written BEFORE its link
// (createTransactionLink): the link's row sits on TypeORM, this one on Drizzle -- two
// connection pools, no shared transaction -- and the order decides which half can be left
// over. A greeting without a link is a row nobody reaches. A link without its greeting would
// be a card that lost its picture, with the amount already held. So the greeting goes first,
// and the code is the one thing that names the link before it is saved; its id exists only
// afterwards.
//
// The columns are wider than what the backend lets in (80 and 40 characters,
// shared/src/data/ThankYouGreeting.logic.ts), so that changing those bounds is no migration.
//
// No foreign key: a link is soft-deleted, and a cascade would never fire. The row is taken
// out by deleteTransactionLink itself.
//
// An empty table and nothing else: no existing row is read or changed. Every link there is
// today has no row here, and that reads as "a plain link".
//
// `IF NOT EXISTS`: DDL does not roll back, and start.sh has already stopped the services by
// the time this runs.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS thank_you_greetings (
      id int(10) unsigned NOT NULL AUTO_INCREMENT,
      transaction_link_code varchar(24) NOT NULL,
      motif varchar(32) NULL DEFAULT NULL,
      line varchar(120) NULL DEFAULT NULL,
      recipient_name varchar(64) NULL DEFAULT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY thank_you_greetings_transaction_link_code_unique (transaction_link_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS thank_you_greetings;')
}
