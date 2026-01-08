import { eq } from 'drizzle-orm'
import { drizzleDb } from '../AppDatabase'
import { projectBrandingsTable } from '../schemas/drizzle.schema'

export async function dbFindProjectSpaceUrl(alias: string): Promise<string | null | undefined> {
  const result = await drizzleDb()
    .select({ spaceUrl: projectBrandingsTable.spaceUrl })
    .from(projectBrandingsTable)
    .where(eq(projectBrandingsTable.alias, alias))
    .limit(1)
  return result.at(0)?.spaceUrl
}
/**
 * 
 * @param alias throw if project not found
 * @returns logoUrl if project has logoUrl, else return null
 */

export async function dbGetProjectLogoURL(alias: string): Promise<string | null> {
  const result = await drizzleDb()
    .select({ logoUrl: projectBrandingsTable.logoUrl })
    .from(projectBrandingsTable)
    .where(eq(projectBrandingsTable.alias, alias))
    .limit(1)
  const firstEntry = result.at(0)
  if (!firstEntry) {
    throw new Error(`Project Branding with alias: ${alias} not found`)
  }
  return firstEntry.logoUrl
}

export async function dbFindAllProjectBrandings(): Promise<typeof projectBrandingsTable.$inferSelect[]> {
  const result = await drizzleDb()
    .select()
    .from(projectBrandingsTable)
  return result
}

export async function dbFindProjectBrandingById(id: number): Promise<typeof projectBrandingsTable.$inferSelect | undefined> {
  const result = await drizzleDb()
    .select()
    .from(projectBrandingsTable)
    .where(eq(projectBrandingsTable.id, id))
    .limit(1)
  return result.at(0)
}

export async function dbDeleteProjectBranding(id: number): Promise<void> {
  await drizzleDb().delete(projectBrandingsTable).where(eq(projectBrandingsTable.id, id))
}