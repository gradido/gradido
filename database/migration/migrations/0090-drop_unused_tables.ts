export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE login_email_opt_in;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`login_email_opt_in\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`user_id\` int(11) NOT NULL,
      \`verification_code\` bigint(20) unsigned NOT NULL,
      \`email_opt_in_type_id\` int(11) NOT NULL,
      \`created\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`resend_count\` int(11) DEFAULT '0',
      \`updated\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`verification_code\` (\`verification_code\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}
