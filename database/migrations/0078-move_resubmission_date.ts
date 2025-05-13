export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    `ALTER TABLE \`contributions\` ADD COLUMN \`resubmission_at\` datetime NULL DEFAULT NULL AFTER \`created_at\`;`,
  )
  await queryFn(`ALTER TABLE \`contribution_messages\` DROP COLUMN \`resubmission_at\`;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    `ALTER TABLE \`contribution_messages\` ADD COLUMN \`resubmission_at\` datetime NULL DEFAULT NULL AFTER \`deleted_by\`;`,
  )
  await queryFn(`ALTER TABLE \`contributions\` DROP COLUMN \`resubmission_at\`;`)
}
