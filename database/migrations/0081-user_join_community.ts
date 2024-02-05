export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE users MODIFY community_uuid VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE users MODIFY community_uuid VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;',
  )
}
