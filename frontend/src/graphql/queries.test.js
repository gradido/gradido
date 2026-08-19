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
    'gmsPublishName',
    'humhubPublishName',
    'gmsPublishLocation',
    'userLocation',
    'hasElopage',
    'publisherId',
    'roles',
    'hideAmountGDD',
    'hideAmountGDT',
  ])('requests the "%s" field consumed by the login action', (field) => {
    expect([...fields]).toContain(field)
  })
})

// Two fields are deliberately not on that list, and for the same structural reason: the
// login mutation cannot answer either of them, so verifyLogin is the only place the
// wallet can read them. Two callers do exactly that: guards.js on the token handoff, and
// Login.vue right after a form login. Drop a field here and both of them leave the store
// empty, silently, which is the failure this whole guard exists for.
//
//   * the avatar, because filling it on the login path would mean a database read on the
//     one request every member and every test makes;
//   * avatarVisibleToMembers, because it is own-view only -- a field resolver hands it to
//     nobody but its owner, and `login` runs on an inalienable right, so it has no
//     authenticated caller to be the owner. It would come back null.
describe('verifyLogin query', () => {
  it.each(['avatar', 'avatarVisibleToMembers'])(
    'requests "%s", which is the only place the wallet can read it',
    (field) => {
      expect([...requestedFields(verifyLogin)]).toContain(field)
    },
  )
})

// The other half of the same contract: neither field may be read off the login payload by
// the login store action, because guards.js feeds that action a verifyLogin result while
// Login.vue feeds it a login result. A field read there is right for one caller and
// undefined for the other -- see store.test.js, which holds the action to clearing both.

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
