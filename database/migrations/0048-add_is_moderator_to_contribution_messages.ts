/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    `ALTER TABLE \`contribution_messages\` ADD COLUMN \`is_moderator\` boolean NOT NULL DEFAULT false;`,
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`ALTER TABLE \`contribution_messages\` DROP COLUMN \`is_moderator\`;`)
}
