import { eq, sql } from 'drizzle-orm'
import { ProjectBranding } from 'shared/src/schema/projectBranding.schema'
import { drizzleDb } from '../AppDatabase'
import {
  ProjectBrandingInsert,
  ProjectBrandingSelect,
  projectBrandingsTable,
} from '../schemas/drizzle.schema'

/**
 * Needed because of TypeScript 4, in TypeScript 5 we can use valibot and auto deduct a valibot schema from drizzle db schema
 * Converts a ProjectBranding object to a ProjectBrandingInsert object to be used in database operations.
 * @param projectBranding - The ProjectBranding object to convert.
 * @returns The converted ProjectBrandingInsert object.
 */
function toDbInsert(projectBranding: ProjectBranding): ProjectBrandingInsert {
  return {
    // Omit ID when inserting (autoincrement) or set it if it exists
    id: projectBranding.id ?? undefined,
    name: projectBranding.name,
    alias: projectBranding.alias,
    // Set null in DB if undefined/null
    description: projectBranding.description ?? null,
    spaceId: projectBranding.spaceId ?? null,
    spaceUrl: projectBranding.spaceUrl ?? null,
    // Convert boolean to tinyint (1/0)
    newUserToSpace: projectBranding.newUserToSpace ? 1 : 0,
    logoUrl: projectBranding.logoUrl ?? null,
  }
}

export async function dbUpsertProjectBranding(
  projectBranding: ProjectBranding,
): Promise<ProjectBranding> {
  if (projectBranding.id) {
    await drizzleDb()
      .update(projectBrandingsTable)
      .set(toDbInsert(projectBranding))
      .where(eq(projectBrandingsTable.id, projectBranding.id))

    return projectBranding
  } else {
    const drizzleProjectBranding = toDbInsert(projectBranding)
    const result = await drizzleDb().insert(projectBrandingsTable).values(drizzleProjectBranding)

    projectBranding.id = result[0].insertId
    return projectBranding
  }
}

export async function dbFindProjectSpaceUrl(alias: string): Promise<string | null | undefined> {
  const result = await drizzleDb()
    .select({ spaceUrl: projectBrandingsTable.spaceUrl })
    .from(projectBrandingsTable)
    .where(eq(projectBrandingsTable.alias, alias))
    .limit(1)
  return result.at(0)?.spaceUrl
}

export async function dbFindProjectSpaceId(alias: string): Promise<number | null | undefined> {
  const result = await drizzleDb()
    .select({ spaceId: projectBrandingsTable.spaceId })
    .from(projectBrandingsTable)
    .where(eq(projectBrandingsTable.alias, alias))
    .limit(1)
  return result.at(0)?.spaceId
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

export async function dbFindAllProjectBrandings(): Promise<ProjectBrandingSelect[]> {
  const result = await drizzleDb().select().from(projectBrandingsTable)
  return result
}

export async function dbFindProjectBrandingById(
  id: number,
): Promise<ProjectBrandingSelect | undefined> {
  const result = await drizzleDb()
    .select()
    .from(projectBrandingsTable)
    .where(eq(projectBrandingsTable.id, id))
    .limit(1)
  return result.at(0)
}

export async function dbFindProjectBrandingByAlias(
  alias: string,
): Promise<ProjectBrandingSelect | undefined> {
  const result = await drizzleDb()
    .select()
    .from(projectBrandingsTable)
    .where(eq(projectBrandingsTable.alias, alias))
    .limit(1)
  return result.at(0)
}

export async function dbDeleteProjectBranding(id: number): Promise<void> {
  await drizzleDb().delete(projectBrandingsTable).where(eq(projectBrandingsTable.id, id))
}
