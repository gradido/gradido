import { describe, it, expect } from 'vitest'
import { verifyLogin } from './queries'
import { login } from './mutations'
import { listAllContributions } from './contributions.graphql'

// Regression guard for BOTH ways into the wallet. The form login (pages/Login.vue) and
// the token-handoff re-auth (routes/guards.js) feed their result into the same `login`
// store action, and that action commits every field below. Whichever document omits one
// makes the action overwrite the value with undefined on the way in -- that is how the
// GMS and HumHub connection came to drop on every wallet <-> admin round-trip. It does
// not crash, which is why it needs a guard and not a reader: the two documents must stay
// in sync with the action, and so with each other.
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
    'gmsPublishLocation',
    'userLocation',
    'hasElopage',
    'publisherId',
    'roles',
    'hideAmountGDD',
    'hideAmountGDT',
    // ⛔ These three moved ONTO this shared list. They used to be verifyLogin's alone,
    // on the grounds that the login mutation runs on an inalienable right and so has no
    // authenticated caller for an own-view guard to match. The login names the member it
    // has just authenticated as the owner of the request now, and it reads the picture
    // with the user row rather than in a second query, so both documents can answer all
    // three -- and BOTH have to, because the store action reads them off whichever
    // payload it is handed. Whichever document drops one lets the action write undefined
    // over a stored value: a member back to initials, a visibility switch that says
    // "hidden" when it is not, and a project account offered "Create".
    'avatar',
    'avatarVisibleToMembers',
    'creationAllowed',
  ])('requests the "%s" field consumed by the login action', (field) => {
    expect([...fields]).toContain(field)
  })
})

// The cost that used to argue for reading the picture in a query of its own is gone: it is
// joined onto the user row the login already reads (dbFindUserLoginByEmail), not fetched
// in a second round trip. What the fields then do in the store is store.test.js's
// business; that they are asked for at all is this file's.

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
