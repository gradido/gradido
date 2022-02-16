/* MIGRATION TO DELETE DECAY START BLOCK
 *
 * the decay start block is now specified as static value
 * we can delete it from the database
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Remove transactions with type 9 (start decay block). This should affect exactly 1 row
  await queryFn(`DELETE FROM transactions WHERE transaction_type_id = 9;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // When rolling back an empty database this entry is newly created. This should not hurt in any way tho.
  await queryFn(`
    INSERT INTO transactions
    VALUES(1682,9,0xC27BE999D7B4704E5F294099E780C5D6A275B165AFABFD8BECCEA39059CBB7B600000000000000000000000000000000,'','2021-05-13 15:46:31',NULL,NULL)
  `)
}
