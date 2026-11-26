// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import {
  buildSchema,
  type DocumentNode,
  type FragmentDefinitionNode,
  Kind,
  type SelectionSetNode,
  validate,
} from 'graphql'
import * as v from 'valibot'
import { creationGroupSchema } from '@/data/CreationGroup.schema'
import { memberSchema } from '@/data/Member.schema'
import { openCreationsSchema } from '@/data/OpenCreation.schema'
import { projectBrandingBannerSchema } from '@/data/ProjectBranding.schema'
import {
  authenticateHumhubAutoLogin,
  confirmEmail,
  confirmEmailChange,
  createUser,
  forgotPassword,
  projectBrandingBanner,
  queryOptIn,
  revokeEmailChange,
  setPassword,
  updateLanguage,
} from './account'
import {
  communityCreationGroups,
  creationGroups,
  myContributionCreationGroups,
  suggestedCreationGroup,
} from './creationGroups'
import { login, verifyLogin } from './member'
import { openCreations } from './openCreations'

const server = buildSchema(
  readFileSync(new URL('../../../backend/schema.graphql', import.meta.url), 'utf8'),
)

// Each document with the schema its answer is read through.
const DOCUMENTS: Record<string, [DocumentNode, v.GenericSchema]> = {
  verifyLogin: [verifyLogin, v.object({ verifyLogin: memberSchema })],
  login: [login, v.object({ login: memberSchema })],
  creationGroups: [creationGroups, v.object({ creationGroups: v.array(creationGroupSchema) })],
  communityCreationGroups: [
    communityCreationGroups,
    v.object({ communityCreationGroups: v.array(creationGroupSchema) }),
  ],
  myContributionCreationGroups: [
    myContributionCreationGroups,
    v.object({ myContributionCreationGroups: v.array(creationGroupSchema) }),
  ],
  suggestedCreationGroup: [
    suggestedCreationGroup,
    v.object({ suggestedCreationGroup: v.nullable(creationGroupSchema) }),
  ],
  openCreations: [openCreations, openCreationsSchema],
  // asked for what they do: nothing of the answer is read
  createUser: [createUser, v.unknown()],
  forgotPassword: [forgotPassword, v.unknown()],
  queryOptIn: [queryOptIn, v.unknown()],
  setPassword: [setPassword, v.unknown()],
  confirmEmail: [confirmEmail, v.unknown()],
  confirmEmailChange: [confirmEmailChange, v.unknown()],
  revokeEmailChange: [revokeEmailChange, v.unknown()],
  updateLanguage: [updateLanguage, v.unknown()],
  projectBrandingBanner: [projectBrandingBanner, projectBrandingBannerSchema],
  authenticateHumhubAutoLogin: [
    authenticateHumhubAutoLogin,
    v.object({ authenticateHumhubAutoLogin: v.string() }),
  ],
}

// A valibot schema as far as this test looks into it.
type Looked = {
  type: string
  entries?: Record<string, Looked>
  wrapped?: Looked
  item?: Looked
  pipe?: Looked[]
}

/**
 * The fields `schema` reads that `asked` does not ask for, with their path. Into a field the
 * document asks whole (a scalar of the server that is an object, as a location) it does not look.
 */
function notAsked(
  schema: Looked,
  asked: SelectionSetNode,
  fragments: FragmentDefinitionNode[],
): string[] {
  const inner = schema.pipe?.[0] ?? schema.wrapped ?? schema.item
  if (inner) {
    return notAsked(inner, asked, fragments)
  }
  const fields = asked.selections.flatMap((selection) =>
    selection.kind === Kind.FRAGMENT_SPREAD
      ? (fragments.find((fragment) => fragment.name.value === selection.name.value)?.selectionSet
          .selections ?? [])
      : [selection],
  )
  return Object.entries(schema.entries ?? {}).flatMap(([name, entry]) => {
    const field = fields.find(
      (selection) => selection.kind === Kind.FIELD && selection.name.value === name,
    )
    if (field?.kind !== Kind.FIELD) {
      return [name]
    }
    return field.selectionSet
      ? notAsked(entry, field.selectionSet, fragments).map((path) => `${name}.${path}`)
      : []
  })
}

describe.each(Object.entries(DOCUMENTS))('%s', (_name, [document, schema]) => {
  it('is a question the server takes', () => {
    expect(validate(server, document).map((error) => error.message)).toEqual([])
  })

  it('asks for every field its schema reads', () => {
    const [operation] = document.definitions.filter(
      (definition) => definition.kind === Kind.OPERATION_DEFINITION,
    )
    const fragments = document.definitions.filter(
      (definition) => definition.kind === Kind.FRAGMENT_DEFINITION,
    )
    expect(notAsked(schema as Looked, operation.selectionSet, fragments)).toEqual([])
  })
})
