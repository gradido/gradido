/* MIGRATION DROP user_setting TABLE */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE `user_setting`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`user_setting\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`userId\` int(11) NOT NULL,
      \`key\` varchar(255) NOT NULL,
      \`value\` varchar(255) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)
}
