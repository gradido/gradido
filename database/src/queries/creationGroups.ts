// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { drizzleDb } from '../AppDatabase'
import { creationGroupsTable } from '../schemas/drizzle.schema'

/** A creation group as a member's request names it (SUA-015): its row number, tag and name. */
export interface CreationGroupRef {
  id: number
  tag: string
  name: string | null
}

/**
 * The group with this tag, or null where the community has none. The column compares without
 * regard to case, as its unique key does; the answer carries the tag as it is stored.
 */
export async function dbSelectCreationGroupByTag(tag: string): Promise<CreationGroupRef | null> {
  const [group] = await drizzleDb()
    .select({
      id: creationGroupsTable.id,
      tag: creationGroupsTable.tag,
      name: creationGroupsTable.name,
    })
    .from(creationGroupsTable)
    .where(eq(creationGroupsTable.tag, tag))
    .limit(1)
  return group ?? null
}
