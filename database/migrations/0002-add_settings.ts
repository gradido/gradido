/* MIGRATION TO ADD USER SETTINGS
 *
 * This migration adds the table `user_setting` in order to store all sorts of user configuration data
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
      CREATE TABLE IF NOT EXISTS \`user_setting\` (
        \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
        \`userId\` int(11) NOT NULL,
        \`key\` varchar(255) NOT NULL,
        \`value\` varchar(255) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write downgrade logic as parameter of queryFn
  await queryFn(`DROP TABLE IF EXISTS \`user_setting\`;`)
}
