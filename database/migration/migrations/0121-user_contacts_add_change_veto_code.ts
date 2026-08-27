// AI-GENERATED — not an architecture reference
// A member who changes their e-mail address gets a SECOND contact row (opt-in type 3,
// EMAIL_OPT_IN_CHANGE) that waits for the confirmation click from the NEW address. The
// notice sent to the OLD address carries a code of its own, the veto: whoever holds the old
// mailbox can throw the pending change away without being able to confirm it. Two codes,
// because the two links must never be exchangeable - the confirmation code alone must not
// revoke, the veto code alone must not confirm.
//
// Nullable on purpose: only a pending change row carries a veto code, and it is cleared the
// moment the change is confirmed or the row is removed. Rows that exist today keep NULL and
// are not affected in any way - the column only ever fills for a change that is under way.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `user_contacts` ADD COLUMN `change_veto_code` bigint unsigned NULL DEFAULT NULL AFTER `email_verification_code`, ADD UNIQUE INDEX `IDX_user_contacts_change_veto_code` (`change_veto_code`);',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `user_contacts` DROP INDEX `IDX_user_contacts_change_veto_code`, DROP COLUMN `change_veto_code`;',
  )
}
