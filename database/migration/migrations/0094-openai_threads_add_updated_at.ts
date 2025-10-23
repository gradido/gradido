
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `openai_threads` ADD COLUMN `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP AFTER `createdAt`;'
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `openai_threads` DROP COLUMN `updatedAt`;')
}
