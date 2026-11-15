// AI-GENERATED — not an architecture reference
// The tick "may handle support requests" on a moderator (Support-Anfragen K6, SUA-025): a
// moderator or KI-moderator handles support requests only with it; an administrator always does.
// On the role row, beside the scope it works in: one moderator, one row, one scope, one tick.
//
// ⭐ `DEFAULT 0` and NOT NULL: off for every role holder there is (SUA-025, "ab Werk aus"). Until
// an administrator ticks a moderator, the administrators alone handle the requests and get the
// mails. Nothing is carried over from before: there was no tick to carry.
//
// ⛔ `IF NOT EXISTS`, same reason as 0127 and 0174: DDL in MySQL and MariaDB does not roll back,
// and `start.sh` has already stopped the services by the time this runs. A connection dropped
// mid-statement would leave the migration unrecorded, and an unguarded retry would die on
// `Duplicate column name` while the server sits on the waiting page. `AFTER` puts it where the
// schema has it (createFromSchema.test.ts compares the order).
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `user_roles` ADD COLUMN IF NOT EXISTS `support_duty` tinyint(1) NOT NULL DEFAULT 0 AFTER `visible_creation_groups`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `user_roles` DROP COLUMN IF EXISTS `support_duty`;')
}
