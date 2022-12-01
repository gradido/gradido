/* MIGRATION TO soft delete user contacts of soft deleted users */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  const contactsToFix = await queryFn(`
    SELECT user_contacts.id, users.deleted_at
    FROM user_contacts JOIN users ON users.email_id = user_contacts.id
    WHERE user_contacts.deleted_at IS NULL
    AND user_id IN (SELECT id FROM users WHERE deleted_at IS NOT NULL);`)

  for (let i = 0; i < contactsToFix.length; i++) {
    const deletedAt = new Date(contactsToFix[i].deleted_at)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ')

    await queryFn(`
      UPDATE user_contacts SET deleted_at = '${deletedAt}' WHERE id = ${contactsToFix[i].id};`)
  }
}

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {}
