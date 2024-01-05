export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    `UPDATE \`transactions\` AS t
     JOIN \`contributions\` AS c ON t.id = c.transaction_id
     JOIN \`users\` AS u ON u.id = c.confirmed_by
     SET 
       t.linked_user_gradido_id = u.gradido_id,
       t.linked_user_name = CONCAT(u.first_name, ' ', u.last_name)
     WHERE t.type_id = ?`,
    [1],
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    `UPDATE \`transactions\` SET \`linked_user_gradido_id\` = NULL, \`linked_user_name\` = NULL where \`type_id\` = ?;`,
    [1],
  )
}
