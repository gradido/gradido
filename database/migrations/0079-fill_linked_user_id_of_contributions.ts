export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    `UPDATE \`transactions\` AS t
     JOIN \`contributions\` AS c ON t.id = c.transaction_id
     SET t.linked_user_id = c.confirmed_by
     WHERE t.type_id = ?`,
    [1],
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`UPDATE \`transactions\` SET \`linked_user_id\` = NULL where \`type_id\` = ?;`, [1])
}
