/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

/* 
Move forward the creation date of the users by 1 or 2 hours, 
for which there are transactions created before their account creation. 

Because of a error by importing data from old db format into new, all older transactions balance_date
are 1 or 2 hours off

*/

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  /* generate raw mysql queries 
    const usersToMove = await queryFn(
      `
       SELECT u.id, u.created, t.balance_date 
       FROM \`users\` as u 
       LEFT JOIN \`transactions\` as t 
       ON t.user_id = u.id where t.balance_date < u.created
       order by id
       `
    )
    let downgradeQueries = ''
    for(const id in usersToMove) {
        const user = usersToMove[id]
        const diff = (user.created - user.balance_date) / 1000
        const correcture = diff < 3600 ? 1: 2
        const correctedDate = new Date(user.created)
        correctedDate.setHours(correctedDate.getHours() - correcture)
        //console.log("%d, %s, %s, %s, %d", user.id, user.created, user.balance_date, diff, correcture)
        console.log('await queryFn(`UPDATE \\`users\\` SET \\`created\\` = \'%s\' WHERE \\`id\\` = %d`)',
            correctedDate.toISOString().slice(0, 19).replace('T', ' '),
            user.id
        )
        downgradeQueries += 'await queryFn(`UPDATE \\`users\\` SET \\`created\\` = \''
        downgradeQueries += user.created.toISOString().slice(0, 19).replace('T', ' ')
        downgradeQueries += '\' WHERE \\`id\\` = ' 
        downgradeQueries += user.id
        downgradeQueries += '`)\n'
    }
    console.log('downgrade: \n%s', downgradeQueries)
    */

  await queryFn(`UPDATE \`users\` SET \`created\` = '2020-01-25 08:01:52' WHERE \`id\` = 179`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2020-05-26 10:21:57' WHERE \`id\` = 443`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2020-06-08 17:04:41' WHERE \`id\` = 490`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2020-06-12 20:07:17' WHERE \`id\` = 508`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2020-07-17 19:20:36' WHERE \`id\` = 621`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2020-11-22 16:31:48' WHERE \`id\` = 788`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2020-12-17 20:09:16' WHERE \`id\` = 825`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-01-26 13:09:35' WHERE \`id\` = 949`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-03-20 16:55:46' WHERE \`id\` = 1057`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-13 15:59:30' WHERE \`id\` = 1228`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-13 17:38:47' WHERE \`id\` = 1229`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-13 17:38:47' WHERE \`id\` = 1229`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-13 17:38:47' WHERE \`id\` = 1229`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-13 17:58:15' WHERE \`id\` = 1230`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-13 17:58:15' WHERE \`id\` = 1230`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-14 14:27:49' WHERE \`id\` = 1231`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-14 14:27:49' WHERE \`id\` = 1231`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-14 14:27:49' WHERE \`id\` = 1231`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-14 14:27:49' WHERE \`id\` = 1231`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-17 22:51:19' WHERE \`id\` = 1239`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-06-03 07:23:28' WHERE \`id\` = 1273`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-06-09 06:16:18' WHERE \`id\` = 1287`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-06-17 11:26:41' WHERE \`id\` = 1298`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-06-30 15:56:27' WHERE \`id\` = 1315`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-06-30 15:56:27' WHERE \`id\` = 1315`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-06-30 15:56:27' WHERE \`id\` = 1315`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-07-08 07:24:57' WHERE \`id\` = 1326`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-07-08 07:24:57' WHERE \`id\` = 1326`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-07-13 12:07:29' WHERE \`id\` = 1342`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-07-16 15:32:48' WHERE \`id\` = 1348`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-09-30 14:06:40' WHERE \`id\` = 1470`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-10-15 14:35:37' WHERE \`id\` = 1490`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-10-16 06:42:00' WHERE \`id\` = 1492`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-10-16 06:42:00' WHERE \`id\` = 1492`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-11-22 09:45:15' WHERE \`id\` = 1576`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-11-23 13:55:37' WHERE \`id\` = 1582`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2022-01-11 14:58:12' WHERE \`id\` = 1729`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2022-01-11 18:03:10' WHERE \`id\` = 1732`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2022-01-19 15:00:38' WHERE \`id\` = 1756`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2022-01-19 20:01:58' WHERE \`id\` = 1757`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2022-01-21 15:58:48' WHERE \`id\` = 1762`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`UPDATE \`users\` SET \`created\` = '2020-01-25 09:01:52' WHERE \`id\` = 179`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2020-05-26 11:21:57' WHERE \`id\` = 443`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2020-06-08 19:04:41' WHERE \`id\` = 490`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2020-06-12 22:07:17' WHERE \`id\` = 508`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2020-07-17 21:20:36' WHERE \`id\` = 621`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2020-11-22 17:31:48' WHERE \`id\` = 788`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2020-12-17 21:09:16' WHERE \`id\` = 825`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-01-26 14:09:35' WHERE \`id\` = 949`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-03-20 17:55:46' WHERE \`id\` = 1057`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-13 17:59:30' WHERE \`id\` = 1228`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-13 19:38:47' WHERE \`id\` = 1229`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-13 19:38:47' WHERE \`id\` = 1229`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-13 19:38:47' WHERE \`id\` = 1229`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-13 19:58:15' WHERE \`id\` = 1230`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-13 19:58:15' WHERE \`id\` = 1230`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-14 16:27:49' WHERE \`id\` = 1231`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-14 16:27:49' WHERE \`id\` = 1231`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-14 16:27:49' WHERE \`id\` = 1231`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-14 16:27:49' WHERE \`id\` = 1231`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-05-18 00:51:19' WHERE \`id\` = 1239`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-06-03 09:23:28' WHERE \`id\` = 1273`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-06-09 08:16:18' WHERE \`id\` = 1287`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-06-17 13:26:41' WHERE \`id\` = 1298`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-06-30 17:56:27' WHERE \`id\` = 1315`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-06-30 17:56:27' WHERE \`id\` = 1315`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-06-30 17:56:27' WHERE \`id\` = 1315`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-07-08 09:24:57' WHERE \`id\` = 1326`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-07-08 09:24:57' WHERE \`id\` = 1326`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-07-13 14:07:29' WHERE \`id\` = 1342`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-07-16 16:32:48' WHERE \`id\` = 1348`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-09-30 16:06:40' WHERE \`id\` = 1470`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-10-15 16:35:37' WHERE \`id\` = 1490`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-10-16 08:42:00' WHERE \`id\` = 1492`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-10-16 08:42:00' WHERE \`id\` = 1492`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-11-22 10:45:15' WHERE \`id\` = 1576`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2021-11-23 14:55:37' WHERE \`id\` = 1582`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2022-01-11 15:58:12' WHERE \`id\` = 1729`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2022-01-11 19:03:10' WHERE \`id\` = 1732`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2022-01-19 16:00:38' WHERE \`id\` = 1756`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2022-01-19 21:01:58' WHERE \`id\` = 1757`)
  await queryFn(`UPDATE \`users\` SET \`created\` = '2022-01-21 16:58:48' WHERE \`id\` = 1762`)
}
