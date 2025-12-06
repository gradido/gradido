export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  /**
   * Migration: Correct historical inconsistencies in transactions and users.
   *
   * Background:
   * Early Gradido production data contains several inconsistencies that violate
   * stricter blockchain validation rules. These inconsistencies include:
   *   - Contribution transactions confirmed by users who did not exist at the
   *     time of the transaction.
   *   - Users confirming their own contributions (self-signed transactions).
   *   - Users whose `created_at` timestamp is after or equal to their first
   *     transaction.
   *   - Transaction memos shorter than the required minimum length (5 characters).
   *
   * Purpose:
   * This migration performs the following corrections to ensure historical
   * consistency and full compatibility with blockchain validation rules:
   *   1. Fix self-signed contributions by assigning the actual moderator.
   *   2. Replace invalid moderators with the earliest ADMIN or MODERATOR where
   *      the linked user was created after the transaction.
   *   3. Update user creation dates to be before their first transaction.
   *   4. Ensure all transaction memos meet the minimum length requirement.
   *
   * Outcome:
   * After this migration, all contribution transactions reference a valid
   * moderator existing at the time of the transaction, user creation dates are
   * logically consistent, and memos meet the minimum formatting rules.
   */

  /**
   * Fix 1: Remove self-signed contributions.
   *
   * Background:
   * A core rule in the system states that *no user may confirm their own
   * contribution* — a moderator must always be someone else.
   *
   * However, early production data contains transactions where the `linked_user_id`
   * matches the `user_id`, meaning the contributor confirmed their own contribution.
   *
   * This query corrects those records by replacing the `linked_user` with the
   * moderator stored in `contributions.moderator_id`.
   *
   * Only transactions where:
   *   - the type is a contribution (type_id = 1),
   *   - the linked user equals the contributor (`t.user_id = t.linked_user_id`),
   *   - the moderator existed before the time of the transaction,
   *   - and the moderator is not the same person,
   * are updated.
   */
  await queryFn(`
    UPDATE transactions t
    JOIN contributions c ON(t.id = c.transaction_id)
    JOIN users u ON(c.moderator_id = u.id)
    SET t.linked_user_id = u.id,
        t.linked_user_community_uuid = u.community_uuid,
        t.linked_user_gradido_id = u.gradido_id,
        t.linked_user_name = CONCAT(u.first_name, ' ', u.last_name)
    WHERE t.type_id = 1 
    AND t.user_id = t.linked_user_id 
    AND u.created_at < t.balance_date 
    AND t.user_id <> u.id
    ;`)

  /**
   * Fix 2: Replace invalid moderators with the earliest ADMIN.
   *
   * Background:
   * Early production records contain contribution transactions where the assigned
   * moderator ("linked_user") was created *after* the contribution itself. This
   * is invalid in the blockchain verification process, which requires that the
   * moderator account must have existed *before* the time of the transaction.
   *
   * This migration:
   *   1. Identifies the earliest ADMIN or MODERATOR user in the system.
   *   2. Reassigns them as moderator for all affected transactions where:
   *        - the type is a contribution (type_id = 1),
   *        - the linked user was created after or at the transaction date,
   *        - the transaction occurred after the ADMIN’s or MODERATOR's creation,
   *        - and the contributor is not the ADMIN or MODERATOR.
   *
   * Using the earliest ADMIN or MODERATOR ensures:
   *   - historical consistency,
   *   - minimal intrusion,
   *   - and compatibility with blockchain validation rules.
   */
  await queryFn(`
    UPDATE transactions t
    JOIN (
        SELECT u.created_at, u.id, u.community_uuid, u.gradido_id, CONCAT(u.first_name, ' ', u.last_name) AS linked_user_name
        FROM users u
        JOIN user_roles r ON u.id = r.user_id
        WHERE r.role IN ('ADMIN', 'MODERATOR')
        ORDER BY r.created_at ASC
        LIMIT 1
    ) mod ON 1=1
    LEFT JOIN users u on(t.linked_user_id = u.id)
    SET t.linked_user_id = mod.id,
        t.linked_user_community_uuid = mod.community_uuid,
        t.linked_user_gradido_id = mod.gradido_id,
        t.linked_user_name = mod.linked_user_name
    WHERE t.type_id = 1
      AND t.balance_date >= u.created_at
      AND t.balance_date < mod.created_at
      AND t.user_id <> mod.id
    ;`)

  /**
   * Fix 3: Update user creation dates to ensure historical consistency.
   *
   * Background:
   * In early production data, some users have a `created_at` timestamp that is
   * **after or equal** to their first recorded transaction (`balance_date`).
   * This violates logical consistency, because a user cannot exist *after* their
   * own transaction.
   *
   * What this query does:
   *   - For each user, it finds the earliest transaction date (`first_date`) from
   *     the `transactions` table.
   *   - It updates the user's `created_at` timestamp to **1 second before** their
   *     first transaction.
   *
   * Notes:
   *   - Only users where `created_at >= first transaction date` are affected.
   *   - This is a historical data fix to ensure all transactions reference a user
   *     that already exists at the time of the transaction, which is required for
   *     blockchain validation and logical consistency in the system.
   */
  await queryFn(`
    UPDATE users u 
    LEFT JOIN (
        SELECT user_id, MIN(balance_date) AS first_date
        FROM transactions
        GROUP BY user_id
    ) t ON t.user_id = u.id
    SET u.created_at = DATE_SUB(t.first_date, INTERVAL 1 SECOND)
    WHERE u.created_at >= t.first_date;
    ;`)

  /**
   * Ensure all transaction memos meet the minimum length requirement.
   *
   * Background:
   * In early Gradido production data, some transactions have a `memo` field
   * shorter than the current rule of 5 characters. This can cause issues in
   * reporting, display, or blockchain validation processes that expect
   * a minimum memo length.
   *
   * What this query does:
   *   - For memos with 0 characters, sets the value to 'empty empty'.
   *   - For memos with 1-4 characters, pads the memo on the left with spaces
   *     until it reaches 5 characters.
   *   - Memos that are already 5 characters or longer are left unchanged.
   *
   * Notes:
   *   - This ensures all memos are at least 5 characters long.
   *   - The padding uses spaces.
   *   - Only memos shorter than 5 characters are affected.
   */
  await queryFn(`
    UPDATE transactions t
    SET t.memo = CASE 
      WHEN CHAR_LENGTH(t.memo) = 0 THEN 'empty empty'
      WHEN CHAR_LENGTH(t.memo) < 5 THEN LPAD(t.memo, 5, ' ')
      ELSE t.memo
    END
    WHERE CHAR_LENGTH(t.memo) < 5
    ;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // downgrade not possible
}
