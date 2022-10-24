/* MIGRATION TO INSERT contributions for all transactions with type creation that do not have a contribution yet */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    `INSERT INTO gradido_community.contributions
  (user_id, created_at, contribution_date, memo, amount, moderator_id, confirmed_by, confirmed_at, transaction_id)
SELECT 
  user_id,
  balance_date,
  creation_date AS contribution_date,
  memo,
  amount,
  20 AS moderator_id,
  502 AS confirmed_by,
  balance_date AS confirmed_at,
  id
FROM
  gradido_community.transactions
WHERE
  type_id = 1
  AND NOT EXISTS(
    SELECT * FROM gradido_community.contributions
    WHERE gradido_community.contributions.transaction_id = gradido_community.transactions.id);`,
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'DELETE FROM `contributions` WHERE `contributions`.`moderator_id` = 20 AND `contributions`.`confirmed_by` = 502 AND `contributions`.`created_at` = `contributions`.`confirmed_at`;',
  )
}
