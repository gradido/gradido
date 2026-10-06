import * as v from 'valibot'

// will be auto-generated in future directly from Drizzle table schema
export const projectBrandingSchema = v.object({
  id: v.nullish(v.number()),
  name: v.string(),
  alias: v.pipe(v.string(), v.maxLength(32)),
  description: v.nullish(v.string()),
  spaceId: v.nullish(v.number()),
  spaceUrl: v.nullish(v.pipe(v.string(), v.url())),
  newUserToSpace: v.boolean(),
  logoUrl: v.nullish(v.pipe(v.string(), v.url())),
})

export type ProjectBranding = v.InferOutput<typeof projectBrandingSchema>
