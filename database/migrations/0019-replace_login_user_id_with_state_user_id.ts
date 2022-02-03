/* MIGRATION TO REPLACE LOGIN_USER_ID WITH STATE_USER_ID
 *
 * This migration replaces the `login_user_id with` the
 * `state_user.id` and removes corresponding columns.
 * The table affected is `login_email_opt_in`
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Delete email opt in codes which can not be linked to an user
  await queryFn(`
    DELETE FROM \`login_email_opt_in\`
    WHERE user_id NOT IN
    ( SELECT login_user_id FROM state_users )
  `)

  // Replace user_id in `login_email_opt_in`
  await queryFn(`
    UPDATE login_email_opt_in
    LEFT JOIN state_users ON state_users.login_user_id = login_email_opt_in.user_id
    SET login_email_opt_in.user_id = state_users.id;
  `)

  // Remove the column `login_user_id` from `state_users`
  await queryFn('ALTER TABLE `state_users` DROP COLUMN `login_user_id`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `state_users` ADD COLUMN `login_user_id` int(10) unsigned DEFAULT NULL AFTER `id`;',
  )
  // Instead of generating new `login_user_id`'s we just use the id of state user.
  // This way we do not need to alter the `user_id`'s of `login_email_opt_in` table
  // at all when migrating down.
  // This is possible since there are no old `login_user.id` referenced anymore and
  // we can freely choose them
  await queryFn('UPDATE `state_users` SET login_user_id = id')

  // Insert back broken data, since we generate new `user_id`'s the old data might be now
  // linked to existing accounts. To prevent that all invalid `user_id`'s are now negative.
  // This renders them invalid while still keeping the original value
  await queryFn(`
    INSERT INTO login_email_opt_in
      (id, user_id, verification_code, email_opt_in_type_id, created, resend_count, updated)
    VALUES
      ('38','-41','7544440030630126261','0','2019-11-09 13:58:21','0','2020-07-17 13:58:29'),
      ('1262','-1185','2702555860489093775','3','2020-10-17 00:57:29','0','2020-10-17 00:57:29'),
      ('1431','-1319','9846213635571107141','3','2020-12-29 00:07:32','0','2020-12-29 00:07:32'),
      ('1548','-1185','1009203004512986277','1','2021-01-26 01:07:29','0','2021-01-26 01:07:29'),
      ('1549','-1185','2144334450300724903','1','2021-01-26 01:07:32','0','2021-01-26 01:07:32'),
      ('1683','-1525','14803676216828342915','3','2021-03-10 08:39:39','0','2021-03-10 08:39:39'),
      ('1899','-1663','16616172057370363741','3','2021-04-12 14:49:18','0','2021-04-12 14:49:18'),
      ('2168','-1865','13129474130315401087','3','2021-07-08 11:58:54','0','2021-07-08 11:58:54'),
      ('2274','-1935','5775135935896874129','3','2021-08-24 11:40:04','0','2021-08-24 11:40:04'),
      ('2318','-1967','5713731625139303791','3','2021-09-06 21:38:30','0','2021-09-06 21:38:30'),
      ('2762','-2263','6997866521554931275','1','2021-12-25 11:44:30','0','2021-12-25 11:44:30');
  `)
}
