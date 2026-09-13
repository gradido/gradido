// AI-GENERATED — not an architecture reference
// A `user_roles` row exists only for a member who holds more than the usual rights (ADMIN,
// MODERATOR, MODERATOR_AI). A usual member has no row.
//
// The admin form wrote a row with role USER whenever a moderator was set back to "user":
// it sent the string 'USER' instead of null, and setUserRole stored it. Older rows go back
// to 2019. Authorization never gave such a row any right (isAuthorized falls through to
// ROLE_USER), but every reader of the role takes "has a role" for "is part of the
// moderation": the wallet showed these members the admin link, and removing the role
// answered that the member had one. setUserRole now refuses these values, and this
// removes what was written before.
//
// Checked on production before this was written: 15 rows, all USER, none with
// `visible_creation_groups` -- nothing is lost with them.
//
// On a fresh database the table is empty and this deletes nothing.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    "DELETE FROM `user_roles` WHERE `role` NOT IN ('ADMIN', 'MODERATOR', 'MODERATOR_AI');",
  )
}

export async function downgrade(_queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Not reversible, and it need not be: the rows granted nothing, and restoring them would
  // restore the defect.
}
