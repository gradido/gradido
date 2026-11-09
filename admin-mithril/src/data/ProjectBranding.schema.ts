// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

/** A project branding as projectBrandings and upsertProjectBranding answer it. */
export const projectBrandingSchema = v.object({
  id: v.number(),
  name: v.string(),
  alias: v.string(),
  description: v.nullish(v.string()),
  spaceId: v.nullish(v.number()),
  newUserToSpace: v.boolean(),
  logoUrl: v.nullish(v.string()),
})

export const projectBrandingsSchema = v.object({
  projectBrandings: v.array(projectBrandingSchema),
})

export const upsertedProjectBrandingSchema = v.object({
  upsertProjectBranding: projectBrandingSchema,
})

/** An entry of the list: one of the server's, or the new one, without id until it is saved. */
export type ProjectBranding = Omit<v.InferOutput<typeof projectBrandingSchema>, 'id'> & {
  id?: number
  spaceUrl?: string | null
}

export const newProjectBranding = (): ProjectBranding => ({
  name: '',
  alias: '',
  newUserToSpace: false,
})

export const spaceSchema = v.object({
  id: v.number(),
  name: v.string(),
  description: v.string(),
  url: v.string(),
})

export type Space = v.InferOutput<typeof spaceSchema>

export const spacesSchema = v.object({
  spaces: v.object({
    pagination: v.object({ total: v.number(), page: v.number() }),
    results: v.array(spaceSchema),
  }),
})

export type SpacesPage = v.InferOutput<typeof spacesSchema>['spaces']

export const chosenSpaceSchema = v.object({
  space: v.object({ name: v.string(), description: v.string() }),
})

// The rules and messages of the old admin's yup schema. A message names its field, as yup named
// it: by its key where the form is checked as a whole, as "this" where one field is.
const minChars = (subject: string, min: number) =>
  v.minLength<string, number, string>(min, `${subject} must be at least ${min} characters`)
const maxChars = (subject: string, max: number) =>
  v.maxLength<string, number, string>(max, `${subject} must be at most ${max} characters`)

// yup let an empty URL pass
const optionalUrl = (subject: string, message: string) =>
  v.nullish(
    v.pipe(
      v.string(),
      v.check((url) => url === '' || v.is(v.pipe(v.string(), v.url()), url), message),
      maxChars(subject, 255),
    ),
  )

const formEntries = (subjectOf: (key: string) => string) => ({
  name: v.pipe(v.string(), minChars(subjectOf('name'), 3), maxChars(subjectOf('name'), 255)),
  alias: v.pipe(
    v.string(),
    v.regex(
      /^[a-z0-9-_]+$/,
      'Alias can only contain lowercase letters, numbers, hyphens, and underscores.',
    ),
    minChars(subjectOf('alias'), 3),
    maxChars(subjectOf('alias'), 32),
  ),
  description: v.nullish(v.string()),
  spaceId: v.nullish(v.number()),
  spaceUrl: optionalUrl(subjectOf('spaceUrl'), 'Space URL must be a valid URL.'),
  newUserToSpace: v.boolean(),
  logoUrl: optionalUrl(subjectOf('logoUrl'), 'Logo URL must be a valid URL.'),
})

/** What upsertProjectBranding takes, but its id: the fields of the form, nothing else. */
export const projectBrandingFormSchema = v.object(formEntries((key) => key))

export type ProjectBrandingField = 'name' | 'alias' | 'description' | 'logoUrl'

const fieldEntries = formEntries(() => 'this')
// the fields the moderator may leave empty
const OPTIONAL: ProjectBrandingField[] = ['description', 'logoUrl']

/**
 * How a field shows what is typed into it: valid or not, with the first message of what is wrong.
 * An empty field says nothing -- an optional one is neither valid nor invalid.
 */
export const fieldCheck = (field: ProjectBrandingField, value: string | null | undefined) => {
  const empty = value === undefined || value === null || value === ''
  if (empty && OPTIONAL.includes(field)) {
    return { valid: null, message: undefined }
  }
  const result = v.safeParse(fieldEntries[field], value)
  return {
    valid: result.success,
    message: empty || result.success ? undefined : result.issues[0].message,
  }
}

/**
 * The form checked as a whole, as yup did on saving: the message is the first of the last field
 * in the form's order that is wrong -- yup went through the fields from the back.
 */
export const formMessage = (issues: v.InferIssue<typeof projectBrandingFormSchema>[]) => {
  const field = issues.at(-1)?.path?.[0].key
  return issues.find((issue) => issue.path?.[0].key === field)?.message
}
