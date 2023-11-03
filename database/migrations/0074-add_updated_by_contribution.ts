export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    `ALTER TABLE \`contributions\` ADD COLUMN \`updated_by\` boolean NULL DEFAULT false AFTER \`updated_at\`;`,
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`ALTER TABLE \`contributions\` DROP COLUMN \`updated_by\`;`)
}
