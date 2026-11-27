// `federated_communities` goes: the dht-node now asks an announced peer for its community infos
// itself and writes the answer straight into `communities`. What is left of the table is when
// a community last answered correctly: `communities.verified_at`, taken over from the latest
// `verified_at` of its entries. The api versions go without a replacement, the peer api has
// its version in the route.
//
// The downgrade brings the table back empty, as 0065 and 0068 left it, and drops the column.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `communities` ADD COLUMN IF NOT EXISTS `verified_at` datetime(3) DEFAULT NULL AFTER `authenticated_at`;',
  )
  await queryFn(`
    UPDATE \`communities\` c SET c.\`verified_at\` = (
      SELECT MAX(f.\`verified_at\`) FROM \`federated_communities\` f WHERE f.\`public_key\` = c.\`public_key\`
    ) WHERE c.\`foreign\` = 1;
  `)
  await queryFn('DROP TABLE IF EXISTS `federated_communities`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`federated_communities\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`foreign\` tinyint(1) NOT NULL DEFAULT 1,
      \`public_key\` binary(32) NOT NULL,
      \`api_version\` varchar(10) NOT NULL,
      \`end_point\` varchar(255) NOT NULL,
      \`last_announced_at\` datetime(3) DEFAULT NULL,
      \`verified_at\` datetime(3) DEFAULT NULL,
      \`last_error_at\` datetime(3) DEFAULT NULL,
      \`created_at\` datetime(3) NOT NULL DEFAULT current_timestamp(3),
      \`updated_at\` datetime(3) DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`public_api_key\` (\`public_key\`,\`api_version\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `)
  await queryFn('ALTER TABLE `communities` DROP COLUMN IF EXISTS `verified_at`;')
}
