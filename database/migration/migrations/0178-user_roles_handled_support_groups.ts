// AI-GENERATED — not an architecture reference
// "Meine Gruppen" in two columns (Admin-Oberfläche MG2b, Bernd 21.11.2026): the groups whose support
// the holder handles themself, beside the groups whose creations they handle (0177). The support's
// list and number, the support lines of the start page and the number of requests at "Admin" in the
// wallet follow this column; the creation side keeps following `handled_creation_groups`. Same JSON
// text, `{"groupIds":[3,7],"untagged":true}`, read through handledCreationGroupsOf in the backend.
//
// ⭐ Filled with the choice of the creations where one was saved: until now that one choice steered
// the support too (MG2), so a holder who chose finds their support as it was, and the two lists
// part only where they untick something. NULL where nothing was chosen: everything counts, as before.
// The copy runs only into an empty column: run a second time, it leaves every copied row as it is
// (and nothing is saved in between -- start.sh has stopped the services before the migrations run).
//
// ⛔ `IF NOT EXISTS`, same reason as 0175 and 0177: DDL in MySQL and MariaDB does not roll back. A
// connection dropped after the column but before the copy leaves the migration unrecorded, and the
// retry must neither die on `Duplicate column name` nor skip the copy. `AFTER` puts it where the
// schema has it (createFromSchema.test.ts compares the order).
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `user_roles` ADD COLUMN IF NOT EXISTS `handled_support_groups` text NULL DEFAULT NULL AFTER `handled_creation_groups`;',
  )
  await queryFn(
    'UPDATE `user_roles` SET `handled_support_groups` = `handled_creation_groups` WHERE `handled_support_groups` IS NULL AND `handled_creation_groups` IS NOT NULL;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `user_roles` DROP COLUMN IF EXISTS `handled_support_groups`;')
}
