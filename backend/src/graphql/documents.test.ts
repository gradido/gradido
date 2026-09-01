// AI-GENERATED — not an architecture reference
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { GraphQLSchema, NoUnusedFragmentsRule, parse, specifiedRules, validate } from 'graphql'
import { schema } from './schema'

/**
 * Every query and mutation the two front ends send, held against the schema that
 * answers them.
 *
 * ⛔ Nothing did this before, and the gap is wider than it looks. The schema exists
 * only as decorators, resolved at runtime; the front ends keep 12 `.graphql` files
 * with field names as text. The front-end tests mock apollo wholesale, so a document
 * is PARSED - is this valid GraphQL? - and never VALIDATED - do these fields exist?
 *
 * Measured before this file was written: renaming a resolver field, or an argument,
 * left both suites green. It would have surfaced the first time somebody pressed the
 * button, as a raw error toast.
 *
 * ⚠️ Per package rather than per file, because the admin keeps its fragments in
 * `fragments.graphql` and spends them in four others. A file validated on its own
 * would fail on a fragment it does not define. Concatenating also means duplicate
 * operation names across a package are caught, which is its own small win: two
 * `mutation login` in one client is a bug whichever file they sit in.
 *
 * ⛔ Every rule EXCEPT "no unused fragments", and the exception is deliberate rather
 * than convenient. That rule answers a different question - is this document tidy? -
 * and the wallet has two fragments nothing spreads today (`contributionFields` and,
 * through it, `unconfirmedContributionFields`). Keeping the rule would make this file
 * fail on state it did not create, which turns a guard into a chore and gets it
 * deleted. The dead fragments are reported separately; removing them belongs to
 * whoever owns those documents.
 *
 * What that costs: a fragment that becomes unused later will not be noticed here.
 * What it keeps: every field, argument, variable and type a front end names is
 * checked against what the server actually offers, which is the failure that reaches
 * a member.
 */
const PACKAGES = ['admin', 'frontend'] as const
const RULES = specifiedRules.filter((rule) => rule !== NoUnusedFragmentsRule)

const documentsOf = (pkg: string): { path: string; source: string }[] => {
  const dir = join(__dirname, '..', '..', '..', pkg, 'src', 'graphql')
  return readdirSync(dir)
    .filter((name) => name.endsWith('.graphql'))
    .sort()
    .map((name) => ({
      path: `${pkg}/src/graphql/${name}`,
      source: readFileSync(join(dir, name), 'utf8'),
    }))
}

describe('the documents the front ends send', () => {
  // Built once: `schema()` runs type-graphql over every resolver, which is not cheap
  // and does not change between these three assertions.
  let built: GraphQLSchema

  beforeAll(async () => {
    built = await schema()
  })

  it.each([...PACKAGES])('%s asks the schema for things it has', (pkg) => {
    const files = documentsOf(pkg)
    // The finder is worth as much as the search: an empty directory would make this
    // test pass by having nothing to check.
    expect(files.length).toBeGreaterThan(0)

    const combined = files.map((file) => `# ${file.path}\n${file.source}`).join('\n')
    const errors = validate(built, parse(combined), RULES)

    // Named rather than counted, so a failure says which field of which operation -
    // the whole point is that somebody reading the CI log can fix it without
    // reproducing anything.
    expect(errors.map((error) => error.message)).toEqual([])
  })

  it('would notice a field the schema does not have', () => {
    // ⛔ The instrument, proved on itself. Without this, a `validate` that silently
    // stopped working - a schema built empty, a rule set narrowed - would leave the
    // two tests above green while checking nothing at all.
    const errors = validate(built, parse('query { thisFieldDoesNotExistAnywhere }'), RULES)

    expect(errors.length).toBeGreaterThan(0)
  })
})
