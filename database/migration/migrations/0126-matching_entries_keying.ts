// AI-GENERATED — not an architecture reference
// The keying of a matching entry: what a language model made of the one sentence a
// member wrote.
//
// Ten columns, and together they say three things: the words this entry can be found
// under (`key_words`), what it is about (the six `key_*` fields plus `key_traits`),
// and which instruction produced all of it (`instruction_version`, `keyed_at`).
//
// ⭐ Every column is nullable with no default, and for existing rows that is not a
// gap but the state they belong in: nothing has been keyed yet, on any server, so
// NULL is the truth about all of them. It is also the queue - the keying run looks
// for entries whose `instruction_version` is missing or out of date - so the day this
// ships, every entry is on that list and gets worked through. Nothing to backfill by
// hand, and nothing this migration has to move.
//
// ⛔ `IF NOT EXISTS` on every statement, because this file is many statements and DDL
// in MySQL and MariaDB does not roll back. A dropped connection halfway through would
// leave the migration unrecorded, and the retry would die on `Duplicate column name`
// instead of finishing the half that is missing - while `start.sh` has already
// stopped the services, so the server sits on the waiting page until somebody goes in
// by hand. Guarded, the retry is the repair. 0073 and 0125 do the same.
//
// `key_words` and `key_traits` are JSON rather than a text column with separators: a
// separator is a character a word could contain, and the GMS holds the same two lists
// in real arrays. Everything else is varchar(64), which is what `shared`'s
// KEY_WORD_MAX_CHARS and KEY_FIELD_MAX_CHARS bound the values to.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `matching_entries` ADD COLUMN IF NOT EXISTS `key_words` JSON DEFAULT NULL;',
  )
  await queryFn(
    'ALTER TABLE `matching_entries` ADD COLUMN IF NOT EXISTS `key_subject` VARCHAR(64) DEFAULT NULL;',
  )
  await queryFn(
    'ALTER TABLE `matching_entries` ADD COLUMN IF NOT EXISTS `key_activity` VARCHAR(64) DEFAULT NULL;',
  )
  await queryFn(
    'ALTER TABLE `matching_entries` ADD COLUMN IF NOT EXISTS `key_category` VARCHAR(64) DEFAULT NULL;',
  )
  await queryFn(
    'ALTER TABLE `matching_entries` ADD COLUMN IF NOT EXISTS `key_area` VARCHAR(64) DEFAULT NULL;',
  )
  await queryFn(
    'ALTER TABLE `matching_entries` ADD COLUMN IF NOT EXISTS `key_actor` VARCHAR(64) DEFAULT NULL;',
  )
  await queryFn(
    'ALTER TABLE `matching_entries` ADD COLUMN IF NOT EXISTS `key_sought_actor` VARCHAR(64) DEFAULT NULL;',
  )
  await queryFn(
    'ALTER TABLE `matching_entries` ADD COLUMN IF NOT EXISTS `key_traits` JSON DEFAULT NULL;',
  )
  await queryFn(
    'ALTER TABLE `matching_entries` ADD COLUMN IF NOT EXISTS `instruction_version` VARCHAR(32) DEFAULT NULL;',
  )
  await queryFn(
    'ALTER TABLE `matching_entries` ADD COLUMN IF NOT EXISTS `keyed_at` DATETIME(3) DEFAULT NULL;',
  )
  // The keying run's own question - "what still needs working out?" - asked on its
  // timer AND on every entry a member saves. Once the backlog is drained the answer is
  // almost always "nothing", and without this it costs a walk over the whole table,
  // joined to `users`, to find that out.
  //
  // `instruction_version` leads, because it is the column that discriminates: in
  // steady state nearly every row carries the current one, and the query wants the
  // few that are NULL or older. `active` is true for almost every row, so leading
  // with it would sort nothing.
  //
  // ⚠️ What it does NOT do is serve the `ORDER BY id`: the condition on
  // instruction_version is a range (NULL, or anything other than the current value),
  // so the sort still happens after the range is read. In steady state that range is
  // nearly empty and it costs nothing; during a re-keying it is the whole table and
  // the sort is the smaller half of that job anyway.
  await queryFn(
    'ALTER TABLE `matching_entries` ADD INDEX IF NOT EXISTS `IDX_matching_entries_keying` (`instruction_version`, `active`);',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `matching_entries` DROP INDEX IF EXISTS `IDX_matching_entries_keying`;',
  )
  await queryFn('ALTER TABLE `matching_entries` DROP COLUMN IF EXISTS `keyed_at`;')
  await queryFn('ALTER TABLE `matching_entries` DROP COLUMN IF EXISTS `instruction_version`;')
  await queryFn('ALTER TABLE `matching_entries` DROP COLUMN IF EXISTS `key_traits`;')
  await queryFn('ALTER TABLE `matching_entries` DROP COLUMN IF EXISTS `key_sought_actor`;')
  await queryFn('ALTER TABLE `matching_entries` DROP COLUMN IF EXISTS `key_actor`;')
  await queryFn('ALTER TABLE `matching_entries` DROP COLUMN IF EXISTS `key_area`;')
  await queryFn('ALTER TABLE `matching_entries` DROP COLUMN IF EXISTS `key_category`;')
  await queryFn('ALTER TABLE `matching_entries` DROP COLUMN IF EXISTS `key_activity`;')
  await queryFn('ALTER TABLE `matching_entries` DROP COLUMN IF EXISTS `key_subject`;')
  await queryFn('ALTER TABLE `matching_entries` DROP COLUMN IF EXISTS `key_words`;')
}
