/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // read the community uuid of the homeCommunity
  const result = await queryFn(`SELECT c.community_uuid from communities as c WHERE c.foreign = 0`)
  // and if uuid exists enter the home_community_uuid for all local users
  if (result && result[0]) {
    await queryFn(
      `UPDATE users as u SET u.community_uuid = "${result[0].community_uuid}" WHERE u.foreign = 0 AND u.community_uuid IS NULL`,
    )
  }
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('')
}
