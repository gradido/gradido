import { z } from 'zod'

// will be auto-generated in future directly from Drizzle table schema, this need TypeScript 5
export const projectBrandingSchema = z.object({
  id: z.number().optional().nullable(),
  name: z.string(),
  alias: z.string().max(32),
  description: z.string().optional().nullable(),
  spaceId: z.number().optional().nullable(),
  spaceUrl: z.string().url().optional().nullable(),
  newUserToSpace: z.boolean(),
  logoUrl: z.string().url().optional().nullable(),
})

export type ProjectBranding = z.infer<typeof projectBrandingSchema>
