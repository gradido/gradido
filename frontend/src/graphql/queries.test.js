import { describe, it, expect } from 'vitest'
import { verifyLogin } from './queries'
import { login } from './mutations'
import { listAllContributions } from './contributions.graphql'

// Regression guard for BOTH ways into the wallet. The form login (pages/Login.vue) and
// the token-handoff re-auth (routes/guards.js) feed their result into the same `login`
// store action, and that action commits every field below. Whichever document omits one
// makes the action overwrite the value with undefined or null on the way in -- the GMS
// and HumHub connection dropped that way on every wallet <-> admin round-trip, and the
// member's own avatar vanished that way on every form login while verifyLogin carried it
// happily. Neither failure crashes anything, which is why it needs a guard and not a
// reader: the two documents must stay in sync with the action, and so with each other.
//
// Read from the query tree, not from its printed text, for the reason spelled out at
// listAllContributions below: a substring match is also satisfied by a longer field name
// that happens to contain it ("roles" inside "userRoles").
const fieldNames = (node, into = new Set()) => {
  for (const selection of node.selectionSet?.selections ?? []) {
    if (selection.kind === 'Field') {
      into.add(selection.name.value)
      fieldNames(selection, into)
    }
  }
  return into
}

const requestedFields = (document) =>
  fieldNames(document.definitions.find((definition) => definition.kind === 'OperationDefinition'))

describe.each([
  ['verifyLogin query', verifyLogin],
  ['login mutation', login],
])('%s', (_name, document) => {
  const fields = requestedFields(document)

  it.each([
    'gradidoID',
    'alias',
    'firstName',
    'lastName',
    'language',
    'newsletterState',
    'gmsAllowed',
    'humhubAllowed',
    'gmsPublishName',
    'humhubPublishName',
    'gmsPublishLocation',
    'userLocation',
    'hasElopage',
    'publisherId',
    'roles',
    'hideAmountGDD',
    'hideAmountGDT',
    'avatar',
  ])('requests the "%s" field consumed by the login action', (field) => {
    expect([...fields]).toContain(field)
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
