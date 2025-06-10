export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    `ALTER TABLE \`contributions\` ADD COLUMN \`deleted_by\` int(10) unsigned DEFAULT NULL;`,
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`ALTER TABLE \`contributions\` DROP COLUMN \`deleted_by\`;`)
}
