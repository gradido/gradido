/* MIGRATION TO soft delete user contacts of soft deleted users */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    UPDATE user_contacts LEFT JOIN users ON users.email_id = user_contacts.id
    SET user_contacts.deleted_at = users.deleted_at
    WHERE user_contacts.deleted_at IS NULL
    AND users.deleted_at IS NOT NULL;`)
}

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {}
