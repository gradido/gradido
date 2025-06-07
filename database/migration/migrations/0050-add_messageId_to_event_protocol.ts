export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    `ALTER TABLE \`event_protocol\` ADD COLUMN \`message_id\` int(10) unsigned NULL DEFAULT NULL;`,
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`ALTER TABLE \`event_protocol\` DROP COLUMN \`message_id\`;`)
}
