// AI-GENERATED — not an architecture reference
// The event of an account opened with a guarantor code is renamed from USER_REGISTER_PRESENCE
// to USER_REGISTER_GUARANTOR, along with the code itself (formerly "presence code"). The rows
// already written carry the old name in `events.type`, so they follow here - otherwise the
// history of every table-code registration so far would name an event the code no longer knows.
//
// `events` is the largest table and `type` has no index: one scan finds the ids, and the
// writes go by primary key in batches of 500. Both directions are the same statement with the
// names swapped, so a downgrade is exact.
const BATCH_SIZE = 500

async function renameEventType(
  queryFn: (query: string, values?: any[]) => Promise<Array<any>>,
  from: string,
  to: string,
) {
  const rows: { id: number }[] = await queryFn('SELECT `id` FROM `events` WHERE `type` = ?;', [
    from,
  ])
  const ids = rows.map((row) => row.id)
  for (let start = 0; start < ids.length; start += BATCH_SIZE) {
    const batch = ids.slice(start, start + BATCH_SIZE)
    await queryFn(
      `UPDATE \`events\` SET \`type\` = ? WHERE \`id\` IN (${batch.map(() => '?').join(', ')});`,
      [to, ...batch],
    )
  }
}

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await renameEventType(queryFn, 'USER_REGISTER_PRESENCE', 'USER_REGISTER_GUARANTOR')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await renameEventType(queryFn, 'USER_REGISTER_GUARANTOR', 'USER_REGISTER_PRESENCE')
}
