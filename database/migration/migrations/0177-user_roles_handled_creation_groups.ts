// AI-GENERATED — not an architecture reference
// "Meine Gruppen" (Admin-Oberfläche MG1, Bernd 21.11.2026): the creation groups an administrator, or
// a moderator who sees every group, handles themself -- the start page, the number at "Schöpfung"
// and the group filter of the creation page count only those. On the role row, beside the scope
// and the tick: one member with a role, one row.
//
// JSON text, `{"groupIds":[3,7],"untagged":true}`: numbers of `creation_groups` rows, not tags, so
// renaming a group leaves the choice as it is. Read through handledCreationGroupsOf in the backend,
// which alone decides whether the choice counts (not for a moderator with an assigned scope).
//
// ⭐ NULL for every role holder there is: nobody has chosen, and for them everything counts as it
// did before this column.
//
// ⛔ `IF NOT EXISTS`, same reason as 0175: DDL in MySQL and MariaDB does not roll back, and
// `start.sh` has already stopped the services by the time this runs. A connection dropped
// mid-statement would leave the migration unrecorded, and an unguarded retry would die on
// `Duplicate column name` while the server sits on the waiting page. `AFTER` puts it where the
// schema has it (createFromSchema.test.ts compares the order).
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `user_roles` ADD COLUMN IF NOT EXISTS `handled_creation_groups` text NULL DEFAULT NULL AFTER `support_duty`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `user_roles` DROP COLUMN IF EXISTS `handled_creation_groups`;')
}
