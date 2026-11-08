// AI-GENERATED — not an architecture reference
// The first creation moves out of its own table (0130) and onto the rows it is about.
//
// `first_creations` was a 1:1 extension of `users` (UNIQUE user_id), read by nobody but the
// process itself, and most of its columns were either derivable or written and never read:
// the message stands on the contribution thread, the signer on the booking and the events,
// the count of entries is the length of the id list, the review reason went nowhere.
// What is not derivable is three things, and they get one column each:
//
//   users.first_creation_status   where the process stands (FirstCreationStatus), NULL for a
//                                 member who has not started. Read off the row the context
//                                 user is loaded with anyway, so the window costs nothing on
//                                 a dashboard visit for everybody whose state is settled.
//   contributions.first_creation  the bundle the window filed, in place of the JSON id list.
//   contribution_messages.ai_model  the model that wrote the lines of the thank-you, on that
//                                 message. Not a first-creation column: the text of a
//                                 contribution is the member's, what a model writes is the
//                                 message to it, so the column sits there, for every message a
//                                 model has a hand in. The first creation is only the first
//                                 writer.
//
// HAS_CREATED is new: the member who found the regular path on their own (ES-011). It used
// to be counted out of `contributions` on EVERY status read, type USER over all of the
// member's rows -- the one cost of the window that grew with a member's history. Written
// here once for everybody who has such a row, and from now on once per member the first
// time the question is asked.
//
// FORCED with test_mode WITHOUT_BOOKING becomes FORCED_UNBOOKED: the mode only has to
// survive between arming the test and the submit that runs it, so it lives in the state.
//
// `IF NOT EXISTS` / `IF EXISTS`: DDL does not roll back and start.sh has already stopped the
// services. Every statement below is idempotent, so a run that broke halfway can be repeated.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `first_creation_status` ENUM('HAS_CREATED', 'FORCED', 'FORCED_UNBOOKED', 'SUBMITTED', 'IN_REVIEW', 'DONE', 'DONE_UNBOOKED') DEFAULT NULL AFTER `creation_allowed`;",
  )
  await queryFn(
    'ALTER TABLE `contributions` ADD COLUMN IF NOT EXISTS `first_creation` tinyint(1) NOT NULL DEFAULT 0;',
  )
  await queryFn(
    'ALTER TABLE `contribution_messages` ADD COLUMN IF NOT EXISTS `ai_model` varchar(64) DEFAULT NULL;',
  )
  // The state of every process that exists.
  await queryFn(`
    UPDATE users u
    JOIN first_creations f ON f.user_id = u.id
    SET u.first_creation_status = CASE
      WHEN f.status = 'FORCED' AND f.test_mode = 'WITHOUT_BOOKING' THEN 'FORCED_UNBOOKED'
      ELSE f.status
    END;`)
  // The bundles: every id in a process's list marks its row. Joined on the member first, so
  // the JSON check runs over a member's own rows only.
  await queryFn(`
    UPDATE contributions c
    JOIN first_creations f ON f.user_id = c.user_id
    SET c.first_creation = 1
    WHERE JSON_CONTAINS(f.contribution_ids, CAST(c.id AS CHAR));`)
  // The thank-you the model wrote: the first moderator DIALOG message on a marked
  // contribution of a process that recorded a model. The internal note of a stopped process
  // carried the model's reason too, but the old table did not say which processes stopped
  // on the model rather than on a rule, so those stay NULL.
  await queryFn(`
    UPDATE contribution_messages m
    JOIN (
      SELECT MIN(m2.id) AS id
      FROM contribution_messages m2
      JOIN contributions c ON c.id = m2.contribution_id AND c.first_creation = 1
      WHERE m2.is_moderator = 1 AND m2.type = 'DIALOG'
      GROUP BY m2.contribution_id
    ) firsts ON firsts.id = m.id
    JOIN contributions c ON c.id = m.contribution_id
    JOIN first_creations f ON f.user_id = c.user_id
    SET m.ai_model = f.model
    WHERE f.model IS NOT NULL;`)
  // Everybody else who ever filed a contribution themselves has found the regular path.
  await queryFn(`
    UPDATE users u
    SET u.first_creation_status = 'HAS_CREATED'
    WHERE u.first_creation_status IS NULL
      AND EXISTS (
        SELECT 1 FROM contributions c
        WHERE c.user_id = u.id AND c.contribution_type = 'USER'
      );`)
  await queryFn('DROP TABLE IF EXISTS `first_creations`;')
}

// The table comes back with what the three columns still know: state, test mode, the
// bundle and the model of its thank-you. The message, the signer and the review reason are
// not kept anywhere the old code read them from, so they stay empty -- the window of a
// settled process does not open again, and nothing else read them.
export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS first_creations (
      id int(10) unsigned NOT NULL AUTO_INCREMENT,
      user_id int(10) unsigned NOT NULL,
      status varchar(16) NOT NULL,
      review_reason varchar(16) DEFAULT NULL,
      entries_count tinyint(3) unsigned NOT NULL,
      contribution_ids JSON NOT NULL,
      message text DEFAULT NULL,
      model varchar(64) DEFAULT NULL,
      test_mode varchar(16) DEFAULT NULL,
      signer_user_id int(10) unsigned DEFAULT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY first_creations_user_id_key (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
  await queryFn(`
    INSERT INTO first_creations (user_id, status, entries_count, contribution_ids, model, test_mode)
    SELECT
      u.id,
      CASE u.first_creation_status WHEN 'FORCED_UNBOOKED' THEN 'FORCED' ELSE u.first_creation_status END,
      (SELECT COUNT(*) FROM contributions c WHERE c.user_id = u.id AND c.first_creation = 1),
      COALESCE(
        (SELECT JSON_ARRAYAGG(c.id) FROM contributions c WHERE c.user_id = u.id AND c.first_creation = 1),
        JSON_ARRAY()
      ),
      (SELECT MAX(m.ai_model) FROM contribution_messages m
        JOIN contributions c ON c.id = m.contribution_id
        WHERE c.user_id = u.id AND c.first_creation = 1),
      CASE
        WHEN u.first_creation_status IN ('FORCED_UNBOOKED', 'DONE_UNBOOKED') THEN 'WITHOUT_BOOKING'
        ELSE NULL
      END
    FROM users u
    WHERE u.first_creation_status IS NOT NULL
      AND u.first_creation_status <> 'HAS_CREATED'
      AND NOT EXISTS (SELECT 1 FROM first_creations f WHERE f.user_id = u.id);`)
  await queryFn('ALTER TABLE `contribution_messages` DROP COLUMN IF EXISTS `ai_model`;')
  await queryFn('ALTER TABLE `contributions` DROP COLUMN IF EXISTS `first_creation`;')
  await queryFn('ALTER TABLE `users` DROP COLUMN IF EXISTS `first_creation_status`;')
}
