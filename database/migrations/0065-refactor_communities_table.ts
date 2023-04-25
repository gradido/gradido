/* MIGRATION TO CREATE THE FEDERATION COMMUNITY TABLES
 *
 * This migration creates the `community` and 'communityfederation' tables in the `apollo` database (`gradido_community`).
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`RENAME TABLE communities TO federated_communities;`)
  await queryFn(`
    CREATE TABLE communities (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`foreign\` tinyint(4) NOT NULL DEFAULT 1,
      \`url\` varchar(255) NOT NULL,
      \`public_key\` binary(64) NOT NULL,
      \`community_uuid\` char(36) NULL,
      \`authenticated_at\` datetime(3) NULL,
      \`name\` varchar(40) NULL,
      \`description\` varchar(255) NULL,
      \`creation_date\` datetime(3) NULL,
      \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` datetime(3),
      PRIMARY KEY (id),
      UNIQUE KEY url_key (url),
      UNIQUE KEY uuid_key (community_uuid),
      UNIQUE KEY public_key_key (public_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write downgrade logic as parameter of queryFn
  await queryFn(`DROP TABLE communities;`)
  await queryFn(`RENAME TABLE federated_communities TO communities;`)

}
