// AI-GENERATED — not an architecture reference
// Columns that had drifted from what the code assumes about them are brought in line.
//
// `user_contacts.email_opt_in_type_id` and `email_resend_count` become NOT NULL DEFAULT 0. The
// rows that hold NULL get 0 first, which is what the code read them as anyway. `updated_at` is
// ON UPDATE CURRENT_TIMESTAMP and is set to itself, so the backfill does not stamp those rows.
//
// Fourteen columns that hold an id, a type or a counter were signed `int` and become
// `int unsigned`, like the primary keys they point at. Nullability and defaults stay as they
// were.
//
// `contributions.created_at` gets DEFAULT CURRENT_TIMESTAMP instead of NULL, so a row inserted
// without it carries the time it was written.
//
// One ALTER per table: signed to unsigned rebuilds the table, and this way each is rebuilt once.
// MODIFY to the same definition changes nothing, so a run that broke halfway can be repeated.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    UPDATE user_contacts
       SET email_opt_in_type_id = COALESCE(email_opt_in_type_id, 0),
           email_resend_count = COALESCE(email_resend_count, 0),
           updated_at = updated_at
     WHERE email_opt_in_type_id IS NULL OR email_resend_count IS NULL;`)
  await queryFn(`
    ALTER TABLE user_contacts
      MODIFY email_opt_in_type_id int unsigned NOT NULL DEFAULT 0,
      MODIFY email_resend_count int unsigned NOT NULL DEFAULT 0;`)
  await queryFn(`
    ALTER TABLE contributions
      MODIFY user_id int unsigned DEFAULT NULL,
      MODIFY moderator_id int unsigned DEFAULT NULL,
      MODIFY created_at datetime DEFAULT CURRENT_TIMESTAMP;`)
  await queryFn(`
    ALTER TABLE transactions
      MODIFY type_id int unsigned DEFAULT NULL,
      MODIFY decay_calculation_type int unsigned DEFAULT 0,
      MODIFY linked_transaction_id int unsigned DEFAULT NULL;`)
  await queryFn(`
    ALTER TABLE pending_transactions
      MODIFY state int unsigned NOT NULL,
      MODIFY type_id int unsigned DEFAULT NULL,
      MODIFY decay_calculation_type int unsigned DEFAULT 0,
      MODIFY linked_transaction_id int unsigned DEFAULT NULL;`)
  await queryFn(`
    ALTER TABLE users
      MODIFY email_id int unsigned DEFAULT NULL,
      MODIFY password_encryption_type int unsigned NOT NULL DEFAULT 0,
      MODIFY publisher_id int unsigned DEFAULT 0;`)
}

// The columns get their old definitions back. The NULLs that became 0 in `user_contacts` stay 0:
// which rows they were is not kept, and the code reads both the same.
export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    ALTER TABLE users
      MODIFY email_id int DEFAULT NULL,
      MODIFY password_encryption_type int NOT NULL DEFAULT 0,
      MODIFY publisher_id int DEFAULT 0;`)
  await queryFn(`
    ALTER TABLE pending_transactions
      MODIFY state int NOT NULL,
      MODIFY type_id int DEFAULT NULL,
      MODIFY decay_calculation_type int DEFAULT 0,
      MODIFY linked_transaction_id int DEFAULT NULL;`)
  await queryFn(`
    ALTER TABLE transactions
      MODIFY type_id int DEFAULT NULL,
      MODIFY decay_calculation_type int DEFAULT 0,
      MODIFY linked_transaction_id int DEFAULT NULL;`)
  await queryFn(`
    ALTER TABLE contributions
      MODIFY user_id int DEFAULT NULL,
      MODIFY moderator_id int DEFAULT NULL,
      MODIFY created_at datetime DEFAULT NULL;`)
  await queryFn(`
    ALTER TABLE user_contacts
      MODIFY email_opt_in_type_id int DEFAULT NULL,
      MODIFY email_resend_count int DEFAULT 0;`)
}
