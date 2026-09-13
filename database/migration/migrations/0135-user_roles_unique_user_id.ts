// `user_roles.user_id` becomes UNIQUE: a member has no role or exactly one.
//
// That has always been the application's rule -- setUserRole overwrites `userRoles[0]`
// rather than adding a second row, deleteUserRole removes them all -- but the table only
// had a plain index (0087), so the rule held by care, not by shape. The readers disagree
// about what a second row would mean: isAuthorized and the moderator scope take
// `userRoles[0]`, loaded without ORDER BY; UserLogic.isRole accepts ANY row; the login
// query refuses the member outright. With the key, none of them has to decide.
//
// Checked on production before this was written: no member has more than one row.
//
// ⛔ Duplicates are refused, not merged. No merge rule is right for every case: "the highest
// role wins" can hand ADMIN back to a demoted member whose stale row survived, "the newest
// row wins" has nothing to go by (`updated_at` is not maintained on save), and "the lowest
// id wins" is merely deterministic, not what authorization happened to see. Which row is
// correct is a decision about a person, so the migration names the rows and stops.
//
// Same index name as 0087 (`user_id`), so the schema only changes in kind.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  const duplicates = await queryFn(`
    SELECT user_id, GROUP_CONCAT(CONCAT(id, ':', role) ORDER BY id SEPARATOR ', ') AS roles
    FROM user_roles
    GROUP BY user_id
    HAVING COUNT(*) > 1`)
  if (duplicates.length > 0) {
    const listed = duplicates
      .map((row: { user_id: number; roles: string }) => `user ${row.user_id} (${row.roles})`)
      .join('; ')
    throw new Error(
      `0135: ${duplicates.length} member(s) with more than one user_roles row: ${listed}. ` +
        'Delete all but the role each member should keep (id:role listed), then run the migration again.',
    )
  }

  await queryFn(
    'ALTER TABLE `user_roles` DROP INDEX `user_id`, ADD UNIQUE INDEX `user_id` (`user_id`);',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `user_roles` DROP INDEX `user_id`, ADD INDEX `user_id` (`user_id`);')
}
