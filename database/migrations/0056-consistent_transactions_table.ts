/* MIGRATION TO add users that have a transaction but do not exist */

import { OkPacket } from 'mysql'

import { v4 as uuidv4 } from 'uuid'

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  const missingUserIds = await queryFn(`
    SELECT user_id FROM transactions
    WHERE NOT EXISTS (SELECT id FROM users WHERE id = user_id) GROUP BY user_id;`)

  for (let i = 0; i < missingUserIds.length; i++) {
    let gradidoId = ''
    let countIds: any[] = []
    do {
      gradidoId = uuidv4()
      countIds = await queryFn(
        `SELECT COUNT(*) FROM \`users\` WHERE \`gradido_id\` = "${gradidoId}"`,
      )
    } while (countIds[0] > 0)

    const userContact = (await queryFn(`
      INSERT INTO user_contacts
      (type, user_id, email, email_checked, created_at, deleted_at)
      VALUES
      ('EMAIL', ${missingUserIds[i].user_id}, 'deleted.user${missingUserIds[i].user_id}@gradido.net', 0, NOW(), NOW());`)) as unknown as OkPacket

    await queryFn(`
      INSERT INTO users
      (id, gradido_id, email_id, first_name, last_name, deleted_at, password_encryption_type, created_at, language)
      VALUES
      (${missingUserIds[i].user_id}, '${gradidoId}', ${userContact.insertId}, 'DELETED', 'USER', NOW(), 0, NOW(), 'de');`)
  }
}

export async function downgrade(_queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Not needed
}
