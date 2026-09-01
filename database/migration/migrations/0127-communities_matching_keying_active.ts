// AI-GENERATED — not an architecture reference
// The switch that decides whether this community pays a language model to key its
// matching entries.
//
// ⭐ `DEFAULT 0` and NOT NULL, so every existing community starts switched OFF. That
// is the whole point of the column rather than an incidental default: 0126 puts every
// entry that exists onto the keying queue, and the first run works through the whole
// backlog in one go, paying per entry. Somebody has to decide when that starts, and
// until they do the answer has to be "not yet" - including on a server that has the
// matching switched on for its members, which is the case this column exists for.
//
// Turning it on is one statement, and deliberately not a deploy:
//   UPDATE communities SET matching_keying_active = 1 WHERE foreign = 0;
//
// ⛔ `IF NOT EXISTS`, same reason as 0125 and 0126: DDL in MySQL and MariaDB does not
// roll back, and `start.sh` has already stopped the services by the time this runs. A
// connection dropped mid-statement would leave the migration unrecorded, and an
// unguarded retry would die on `Duplicate column name` while the server sits on the
// waiting page.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `communities` ADD COLUMN IF NOT EXISTS `matching_keying_active` TINYINT NOT NULL DEFAULT 0;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `communities` DROP COLUMN IF EXISTS `matching_keying_active`;')
}
