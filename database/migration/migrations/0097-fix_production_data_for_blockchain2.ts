export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  /**
   * Migration: Correct historical inconsistencies in transactions, users, and contribution_links.
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
   *   - Existing contribution_links without an associated 'ADMIN_CONTRIBUTION_LINK_CREATE' event,
   *     which is used to find someone who confirmed the contribution.
   *
   * Purpose:
   * This migration performs the following corrections to ensure historical
   * consistency and full compatibility with blockchain validation rules:
   *   1. Fix self-signed contributions by assigning the actual moderator.
   *   2. Replace invalid moderators with the earliest ADMIN or MODERATOR where
   *      the linked user was created after the transaction.
   *   3. Update user creation dates to be before their first transaction.
   *   4. Ensure all transaction memos meet the minimum length requirement.
   *   5. Insert missing 'ADMIN_CONTRIBUTION_LINK_CREATE' events for contribution_links
   *      that do not yet have such events, using the first Admin as acting_user.
   *
   * Outcome:
   * After this migration:
   *   - All contribution transactions reference a valid moderator existing at the time of the transaction.
   *   - User creation dates are logically consistent with their transactions.
   *   - Transaction memos meet the minimum formatting rules.
   *   - Every contribution_link has a corresponding 'ADMIN_CONTRIBUTION_LINK_CREATE' event,
   *     ensuring blockchain consistency for contributions.
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

  await queryFn(`
    UPDATE contributions c
    JOIN users u ON(c.moderator_id = u.id)
    SET c.confirmed_by = u.id
    WHERE c.contribution_status = 'CONFIRMED'
    AND c.user_id = c.confirmed_by
    AND u.created_at < c.confirmed_at 
    AND c.user_id <> u.id
    ;`)

  /**
   * Fix 2: Replace invalid moderators with the earliest ADMIN.
   *
   * Background:
   * Early production records contain contribution transactions where the assigned
   * moderator ("linked_user" or "contribution.moderator_id") was created *after* the contribution itself. This
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
        SELECT t_sub.id as sub_t_id, u_sub.created_at, u_sub.id, u_sub.community_uuid, u_sub.gradido_id, CONCAT(u_sub.first_name, ' ', u_sub.last_name) AS linked_user_name
        FROM transactions t_sub
		    JOIN users u_sub on(t_sub.user_id <> u_sub.id)
        JOIN user_roles r_sub ON u_sub.id = r_sub.user_id		
        WHERE r_sub.role IN ('ADMIN', 'MODERATOR')
        GROUP BY t_sub.id
        ORDER BY r_sub.created_at ASC
    ) moderator ON (t.id = moderator.sub_t_id)
    LEFT JOIN users u on(t.linked_user_id = u.id)
    SET t.linked_user_id = moderator.id,
        t.linked_user_community_uuid = moderator.community_uuid,
        t.linked_user_gradido_id = moderator.gradido_id,
        t.linked_user_name = moderator.linked_user_name
    WHERE t.type_id = 1
      AND t.balance_date <= u.created_at
      AND t.balance_date > moderator.created_at
      AND t.user_id <> moderator.id
    ;`)

  // similar but with confirmed by user
  await queryFn(`
    UPDATE contributions c
    JOIN (
        SELECT c_sub.id as sub_c_id, u_sub.created_at, u_sub.id
        FROM contributions c_sub
		    JOIN users u_sub ON (c_sub.confirmed_by <> u_sub.id AND c_sub.user_id <> u_sub.id)
        JOIN user_roles r_sub ON (u_sub.id = r_sub.user_id)		
        WHERE r_sub.role IN ('ADMIN', 'MODERATOR')
        GROUP BY c_sub.id
        ORDER BY r_sub.created_at ASC
    ) confirmingUser ON (c.id = confirmingUser.sub_c_id)
    LEFT JOIN users u on(c.confirmed_by = u.id)
    SET c.confirmed_by = confirmingUser.id
    WHERE c.confirmed_at <= u.created_at
      AND c.confirmed_at > confirmingUser.created_at
      AND c.user_id <> confirmingUser.id
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
   * Fix 4: Ensure all transaction memos meet the minimum length requirement.
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

  await queryFn(`
    UPDATE contributions t
    SET t.memo = CASE 
      WHEN CHAR_LENGTH(t.memo) = 0 THEN 'empty empty'
      WHEN CHAR_LENGTH(t.memo) < 5 THEN LPAD(t.memo, 5, ' ')
      ELSE t.memo
    END
    WHERE CHAR_LENGTH(t.memo) < 5
    ;`)

  await queryFn(`
    UPDATE transaction_links t
    SET t.memo = CASE 
      WHEN CHAR_LENGTH(t.memo) = 0 THEN 'empty empty'
      WHEN CHAR_LENGTH(t.memo) < 5 THEN LPAD(t.memo, 5, ' ')
      ELSE t.memo
    END
    WHERE CHAR_LENGTH(t.memo) < 5
    ;`)

  /**
   * Fix 5: Insert missing 'ADMIN_CONTRIBUTION_LINK_CREATE' events for contribution_links.
   *
   * Background:
   * Each contribution in the blockchain requires a confirmation by a user.
   * In the current DB version, there is no information about who confirmed contributions based on contribution_links.
   * Recently, functionality was added to create an 'ADMIN_CONTRIBUTION_LINK_CREATE' event
   * for newly created contribution_links, but existing contribution_links were not updated.
   * 
   * This query inserts an 'ADMIN_CONTRIBUTION_LINK_CREATE' event for every contribution_link
   * that does not already have such an event. 
   * The acting_user_id is set to the first Admin, and affected_user_id is set to 0.
   */
  await queryFn(`
    INSERT INTO \`events\`(acting_user_id, affected_user_id, \`type\`, involved_contribution_link_id)
    SELECT (
      SELECT u.id
      FROM users u
      JOIN user_roles r ON r.user_id = u.id
      WHERE r.role = 'ADMIN'
      ORDER BY r.id ASC
      LIMIT 1
    ) AS acting_user_id, 0 as affected_user_id, 'ADMIN_CONTRIBUTION_LINK_CREATE' AS \`type\`, c.id AS involved_contribution_link_id
    FROM contribution_links c
    LEFT JOIN \`events\` e ON e.involved_contribution_link_id = c.id AND e.type = 'ADMIN_CONTRIBUTION_LINK_CREATE'
    WHERE e.id IS NULL
    ;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // downgrade not possible
}
