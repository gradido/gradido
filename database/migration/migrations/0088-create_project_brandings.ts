/* MIGRATION TO CREATE THE project_brandings table
 *
 * This migration creates the `community` and 'communityfederation' tables in the `apollo` database (`gradido_community`).
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE \`project_brandings\`(
      \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`name\` VARCHAR(255) NOT NULL,
      \`alias\` VARCHAR(32) NOT NULL,
      \`description\` TEXT NULL DEFAULT NULL,
      \`space_id\` INT UNSIGNED NULL DEFAULT NULL,
      \`space_url\` VARCHAR(255) NULL DEFAULT NULL,
      \`new_user_to_space\` TINYINT(1) NOT NULL DEFAULT FALSE,
      \`logo_url\` VARCHAR(255) NULL DEFAULT NULL,
      PRIMARY KEY(\`id\`)
    ) ENGINE = InnoDB;
  `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE `project_brandings`')
}
