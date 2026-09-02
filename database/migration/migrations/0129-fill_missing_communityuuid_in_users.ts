// AI-GENERATED — not an architecture reference
// The home community's uuid for every local member who still has none.
//
// Migration 0074 already did this once -- but only `if (result && result[0])`: it read the
// home community's uuid first and did nothing when there was none to read. The row is
// written by the dht-node, so on an installation whose migrations ran before the dht-node
// had ever started, 0074 found nothing and returned. Nothing fills the column afterwards:
// registration writes it for NEW accounts only (RegisterAccount.context.ts).
//
// What such a row costs today: `User.communityUuid` is non-null in the GraphQL schema, so
// the member cannot log in (verifyLogin answers the same model), and every booking list
// containing them fails as a whole for the OTHER member -- the wallet discards an answer
// that carries an error. They are unusable accounts that break other people's screens.
//
// This is the same statement as 0074, run again now that every installation has its home
// community. It touches only rows that are empty, and writes only the value every other
// local account already carries.
//
// ⛔ No downgrade. Which rows were empty before is not recorded anywhere, so setting them
// back would have to guess -- and the state it would restore is the defect.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  const result = await queryFn('SELECT c.community_uuid FROM communities AS c WHERE c.foreign = 0')
  const communityUuid = result?.[0]?.community_uuid
  if (communityUuid) {
    await queryFn(
      'UPDATE users AS u SET u.community_uuid = ? WHERE u.foreign = 0 AND u.community_uuid IS NULL',
      [communityUuid],
    )
  }
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // dummy statement to satisfy linter and queryFn, as in 0074
  await queryFn('select count(*) from communities')
}
