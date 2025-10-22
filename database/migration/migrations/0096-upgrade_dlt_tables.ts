/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    ALTER TABLE \`dlt_transactions\`
    CHANGE \`transactions_id\` \`transaction_id\` INT(10) UNSIGNED NULL DEFAULT NULL,
    ADD \`user_id\` INT UNSIGNED NULL DEFAULT NULL AFTER \`transaction_id\`,
    ADD \`transaction_link_id\` INT UNSIGNED NULL DEFAULT NULL AFTER \`user_id\`,
    ADD \`type_id\` INT UNSIGNED NOT NULL AFTER \`transaction_link_id\`,
    ADD \`error\` text NULL DEFAULT NULL AFTER \`verified_at\`,
    ;
  `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    ALTER TABLE \`dlt_transactions\`
    CHANGE \`transaction_id\` \`transactions_id\` INT(10) UNSIGNED NOT NULL,
    DROP COLUMN \`user_id\`,
    DROP COLUMN \`transaction_link_id\`,
    DROP COLUMN \`type_id\`,
    DROP COLUMN \`error\`
    ;
  `)
}
