import { describe, it, expect } from 'vitest'
import { print } from 'graphql'
import { verifyLogin } from './queries'
import { listAllContributions } from './contributions.graphql'

// Regression guard: the token-handoff re-auth in routes/guards.js feeds the
// verifyLogin result into the shared `login` store action. If any of these
// fields is missing from the query, the action overwrites the value with
// undefined, so the GMS/HumHub connection drops on every wallet <-> admin
// round-trip. verifyLogin must stay in sync with the login mutation for the
// fields the login action consumes.
describe('verifyLogin query', () => {
  const body = print(verifyLogin)

  it.each([
    'gmsAllowed',
    'humhubAllowed',
    'gmsPublishName',
    'humhubPublishName',
    'gmsPublishLocation',
    'userLocation',
  ])('requests the "%s" field consumed by the login action', (field) => {
    expect(body).toContain(field)
  })
})

// Data protection: the community list is open to every member and shows denied
// contributions too, so it names nobody. The backend refuses to send a person either
// (WalletContributionFilter.test.ts) — this guard catches the mistake one step earlier,
// where someone would actually make it: by adding the field back to the query.
// Read from the query tree, not from its printed text: any text match is also satisfied by
// an unrelated fragment that happens to be pulled into the document. Both a toContain and a
// line-anchored regex passed here with the field removed and a person added back.
describe('listAllContributions query', () => {
  const operation = listAllContributions.definitions.find(
    (definition) => definition.kind === 'OperationDefinition',
  )
  const listField = operation.selectionSet.selections.find(
    (selection) => selection.name.value === 'listAllContributions',
  )
  const row = listField.selectionSet.selections.find(
    (selection) => selection.name.value === 'contributionList',
  ).selectionSet.selections

  it('asks for the contribution number, which identifies a row there', () => {
    // Without it the list has no stable key and no anchor — and nothing to quote in a
    // dispute, which is the only way a person can identify themselves in that list.
    expect(row.map((selection) => selection.name?.value)).toContain('id')
  })

  it('does not ask for the person who submitted', () => {
    expect(row.map((selection) => selection.name?.value)).not.toContain('user')
  })

  it('pulls in no fragment that could carry a person', () => {
    expect(row.map((selection) => selection.kind)).toEqual(row.map(() => 'Field'))
  })
})
