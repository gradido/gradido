/* MIGRATION TO RENAME CONTRIBUTION_CONFIRM EVENT
 *
 * This migration renames the CONTRIBUTION_CONFIRM Event
 * to ADMIN_CONTRIBUTION_CONFIRM
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'UPDATE `events` SET `type` = "ADMIN_CONTRIBUTION_CONFIRM" WHERE `type` = "CONTRIBUTION_CONFIRM";',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'UPDATE `events` SET `type` = "CONTRIBUTION_CONFIRM" WHERE `type` = "ADMIN_CONTRIBUTION_CONFIRM";',
  )
}
