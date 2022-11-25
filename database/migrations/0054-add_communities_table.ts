/* MIGRATION TO CREATE THE FEDERATION COMMUNITY TABLES
 *
 * This migration creates the `community` and 'communityfederation' tables in the `apollo` database (`gradido_community`).
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS communities (
      id int unsigned NOT NULL AUTO_INCREMENT,
      public_key binary(32),
      api_version varchar(10) NOT NULL,
      endpoint varchar(255) NOT NULL,
      last_announced_at datetime(3) NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3),
      PRIMARY KEY (id),
      UNIQUE KEY public_api_key (public_key, api_version)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write downgrade logic as parameter of queryFn
  await queryFn(`DROP TABLE IF EXISTS communities;`)
}
