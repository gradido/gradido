/* MIGRATION TO ADD GRADIDO_ID
 *
 * This migration adds new columns to the table `users` and creates the
 * new table `user_contacts`
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { v4 as uuidv4 } from 'uuid'

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // First add gradido_id as nullable column without Default
  await queryFn('ALTER TABLE `users` ADD COLUMN `gradido_id` CHAR(36) NULL AFTER `id`;')

  // Second update gradido_id with ensured unique uuidv4
  const usersToUpdate = await queryFn('SELECT `id`, `gradido_id` FROM `users`') //  WHERE 'u.gradido_id' is null`,)
  for (const id in usersToUpdate) {
    const user = usersToUpdate[id]
    let gradidoId = null
    let countIds = null
    do {
      gradidoId = uuidv4()
      countIds = await queryFn(
        `SELECT COUNT(*) FROM \`users\` WHERE \`gradido_id\` = "${gradidoId}"`,
      )
    } while (countIds[0] > 0)
    await queryFn(
      `UPDATE \`users\` SET \`gradido_id\` = "${gradidoId}" WHERE \`id\` = "${user.id}"`,
    )
  }

  // third modify gradido_id to not nullable and unique
  await queryFn('ALTER TABLE `users` MODIFY COLUMN `gradido_id` CHAR(36) NOT NULL UNIQUE;')

  await queryFn(
    'ALTER TABLE `users` ADD COLUMN `alias` varchar(20) NULL UNIQUE AFTER `gradido_id`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE users DROP COLUMN gradido_id;')
  await queryFn('ALTER TABLE users DROP COLUMN alias;')
}
