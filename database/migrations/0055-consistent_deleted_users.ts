/* MIGRATION TO soft delete user contacts of soft deleted users */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    UPDATE user_contacts LEFT JOIN users ON users.email_id = user_contacts.id
    SET user_contacts.deleted_at = users.deleted_at
    WHERE user_contacts.deleted_at IS NULL
    AND users.deleted_at IS NOT NULL;`)
}

export async function downgrade(_queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Not needed
}
