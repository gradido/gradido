// AI-GENERATED — not an architecture reference
// Who signs the first creation (ES-005): an admin or moderator, picked once in the admin's
// Crea settings, who confirms every first creation in their name — like the managing
// director whose signature sits under the automatic business letter. The one setting
// resolves `confirmed_by`, the counterparty of the booking, the sender of the mails and
// the DLT signer in one.
//
// ★ NULL means "no signer configured", and no signer means NO WINDOW: the first creation
// is switched off softly, the way Crea is without an API key. That is the state every
// existing installation is in after this migration, so nothing changes for anybody until
// an admin picks somebody.
//
// `IF NOT EXISTS`: DDL does not roll back and start.sh has already stopped the services.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `crea_settings` ADD COLUMN IF NOT EXISTS `first_creation_signer_user_id` int(10) unsigned DEFAULT NULL;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `crea_settings` DROP COLUMN IF EXISTS `first_creation_signer_user_id`;',
  )
}
