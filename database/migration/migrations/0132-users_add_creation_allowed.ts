// AI-GENERATED — not an architecture reference
// Whether this account may create Gradido at all (ES-021): a PERSON creates for what they
// do for others; a PROJECT account (an association, a project, a shop) does not create,
// it receives thanks. One column, not a role: a role is a bundle of rights that lives in
// the code and would have to be handed to every one of the existing accounts, while this
// is a single state that TAKES rights away (RESTRICTED_FOR_PROJECT_ACCOUNT).
//
// DEFAULT 1, and that is the sentence every existing account needs: every account that
// exists today counts as a person and may create — nothing changes for anybody. The
// distinction is made where it first matters: in the first-creation window (ES-012), or
// later in "My account". Only the account holder switches it OFF; switching it back ON
// takes an administrator (ES-021, the asymmetry is the point).
//
// NOT NULL: there is no third state. An account either may create or may not.
//
// `IF NOT EXISTS`: DDL does not roll back and start.sh has already stopped the services.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `creation_allowed` tinyint(1) NOT NULL DEFAULT 1 AFTER `avatar_visible_to_members`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `users` DROP COLUMN IF EXISTS `creation_allowed`;')
}
