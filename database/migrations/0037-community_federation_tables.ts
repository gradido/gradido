/* MIGRATION TO CREATE THE FEDERATION COMMUNITY TABLES
 *
 * This migration creates the `community` and 'communityfederation' tables in the `apollo` database (`gradido_community`).
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`community\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`uuid\` varchar(37) NOT NULL,
      \`name\` varchar(255),
      \`description\` varchar(255),
      \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uuid\` (\`uuid\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`community_federation\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`uuid\` varchar(36) NOT NULL,
      \`foreign\` tinyint DEFAULT '0',
      \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`privateKey\` varchar(255),
      \`publicKey\` varchar(255),
      \`pubKeyVerifiedAt\` datetime,
      \`authenticatedAt\` datetime,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uuid\` (\`uuid\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`community_api_version\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`communityFederationID\` int unsigned NOT NULL,
      \`url\` varchar(255) NOT NULL,
      \`apiVersion\` varchar(255) NOT NULL,
      \`validFrom\` datetime NOT NULL,
      \`verifiedAt\` datetime,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write downgrade logic as parameter of queryFn
  await queryFn(`DROP TABLE IF EXISTS \`community\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`community_federation\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`community_api_version\`;`)
}
