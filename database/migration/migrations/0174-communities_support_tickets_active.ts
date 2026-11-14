// AI-GENERATED — not an architecture reference
// The switch with which a community lets its members file support requests in the wallet
// (Support-Anfragen K5, SUA-019): off, no new request; what runs, runs to its end.
//
// ⭐ `DEFAULT 1` and NOT NULL: every existing community starts switched ON, as decided (SUA-019,
// "ab Werk an"). With the release, "Support" stands in every member's menu and the moderators
// get mails; an administrator switches it off on the admin's support page.
//
// ⛔ `IF NOT EXISTS`, same reason as 0127: DDL in MySQL and MariaDB does not roll back, and
// `start.sh` has already stopped the services by the time this runs. A connection dropped
// mid-statement would leave the migration unrecorded, and an unguarded retry would die on
// `Duplicate column name` while the server sits on the waiting page.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `communities` ADD COLUMN IF NOT EXISTS `support_tickets_active` TINYINT NOT NULL DEFAULT 1;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `communities` DROP COLUMN IF EXISTS `support_tickets_active`;')
}
