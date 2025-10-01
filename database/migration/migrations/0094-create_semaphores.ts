/* MIGRATION TO CREATE THE project_brandings table
 *
 * This migration creates the `semaphores` table in the `gradido` database.
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE \`semaphores\`(
      \`key\` VARCHAR(255) NOT NULL,
      \`count\` INT UNSIGNED NULL DEFAULT NULL,
      \`owner\` VARCHAR(255) NULL DEFAULT NULL,
      created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(\`key\`)
    ) ENGINE = InnoDB;
  `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE `semaphores`')
}
