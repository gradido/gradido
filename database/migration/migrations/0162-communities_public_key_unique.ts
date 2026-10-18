// `communities.public_key` becomes UNIQUE again. 0065 created the table with
// `UNIQUE KEY public_key_key (public_key)`; 0068 shortened the column by adding a new one,
// dropping the old and renaming the new -- and the unique key went down with the old column.
// The code has treated the public key as unique all along (lookups by public key take the
// first row, federated_communities joins on it), so this restores what was always assumed.
//
// `communities.community_uuid` becomes NOT NULL. 0065 left it nullable because a foreign
// community only got its uuid from the handshake; it now comes with the signed community
// infos before the row is inserted, so no code path writes an empty one any more.
//
// Not a bare ALTER: MariaDB would refuse it with "Duplicate entry" / "Data truncated" and
// name one row, not all of them, and not what to do. Two rows with the same public key must
// not exist, and neither must a community without uuid; if they do, what to do with them is
// a decision this migration cannot make, so it stops and names them.
//
// `community_handshake_states` is dropped. It held the state of the old handshake (0095),
// which the signed community infos replace; nothing reads or writes it any more. A downgrade
// creates it again as 0095 did, empty: a handshake in progress does not survive a deploy anyway.
//
// `IF NOT EXISTS` / `IF EXISTS`: DDL does not roll back.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  const duplicates = await queryFn(`
    SELECT HEX(c.public_key) AS publicKey, GROUP_CONCAT(c.id ORDER BY c.id) AS ids
    FROM communities AS c
    GROUP BY c.public_key
    HAVING COUNT(*) > 1`)
  if (duplicates.length > 0) {
    const list = duplicates
      .map((row: { publicKey: string; ids: string }) => `${row.publicKey} (ids ${row.ids})`)
      .join(', ')
    throw new Error(
      `0162: ${duplicates.length} public key(s) used by more than one communities row: ${list}. ` +
        'A public key names exactly one community; resolve these rows by hand before migrating.',
    )
  }

  const withoutUuid = await queryFn(
    'SELECT c.id, c.url, c.foreign FROM communities AS c WHERE c.community_uuid IS NULL ORDER BY c.id',
  )
  if (withoutUuid.length > 0) {
    const list = withoutUuid
      .map((row: { id: number; url: string; foreign: number }) =>
        `${row.id} (${row.foreign ? 'foreign' : 'home'}, ${row.url})`,
      )
      .join(', ')
    throw new Error(
      `0162: ${withoutUuid.length} communities row(s) without community_uuid: ${list}. ` +
        'Set their uuid or delete them by hand before migrating; a foreign community is inserted again with its uuid on the next validation.',
    )
  }

  await queryFn(
    'ALTER TABLE `communities` ADD UNIQUE KEY IF NOT EXISTS `public_key_key` (`public_key`);',
  )
  await queryFn('ALTER TABLE `communities` MODIFY COLUMN `community_uuid` char(36) NOT NULL;')
  await queryFn('DROP TABLE IF EXISTS `community_handshake_states`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS community_handshake_states (
      id int unsigned NOT NULL AUTO_INCREMENT,
      handshake_id int unsigned NOT NULL,
      one_time_code int unsigned NULL DEFAULT NULL,
      public_key binary(32) NOT NULL,
      api_version varchar(255) NOT NULL,
      status varchar(255) NOT NULL DEFAULT 'OPEN_CONNECTION',
      last_error text,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      KEY idx_public_key (public_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)
  await queryFn('ALTER TABLE `communities` MODIFY COLUMN `community_uuid` char(36) NULL;')
  await queryFn('ALTER TABLE `communities` DROP INDEX IF EXISTS `public_key_key`;')
}
