export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    `UPDATE \`transactions\` AS t
     JOIN \`contributions\` AS c ON t.id = c.transaction_id
     JOIN \`users\` AS u ON u.id = c.confirmed_by
     SET 
       t.linked_user_gradido_id = u.gradido_id,
       t.linked_user_name = CONCAT(u.first_name, ' ', u.last_name),
       t.linked_user_community_uuid = u.community_uuid
     WHERE t.type_id = ?`,
    [1],
  )

  // fill user community uuid fields in transactions
  await queryFn(
    `UPDATE \`transactions\` AS t
     JOIN \`users\` AS u ON u.id = t.user_id
     JOIN \`users\` AS lu ON lu.id = t.linked_user_id
     SET 
       t.user_community_uuid = u.community_uuid,
       t.linked_user_community_uuid = lu.community_uuid`,
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    `UPDATE \`transactions\` SET \`linked_user_gradido_id\` = NULL, \`linked_user_name\` = NULL where \`type_id\` = ?;`,
    [1],
  )

  await queryFn(
    `UPDATE \`transactions\` SET \`user_community_uuid\` = NULL, \`linked_user_community_uuid\` = NULL;`,
  )
}
