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
 * only as decorators, resolved at runtime; the front ends name fields as text. Their
 * tests mock apollo wholesale, so a document is PARSED - is this valid GraphQL? - and
 * never VALIDATED - do these fields exist over there?
 *
 * Measured before this file was written: renaming a resolver field, or an argument,
 * left both suites green. It surfaced the first time somebody pressed the button, as a
 * raw error toast - and on its first widened run this file found exactly that, live, in
 * `admin/src/graphql/getContribution.js`.
 *
 * ⚠️ BOTH file kinds, and that is not a detail. The first version of this file read
 * only `.graphql` and its header claimed to cover everything the front ends send -
 * which was false by a factor of two: 38 documents of 90. The rest live in `.js` as
 * `gql` template literals, `login` and `sendCoins` among them. A guard that names a
 * scope it does not have is worse than no guard, because the next reader stops looking.
 *
 * Per file rather than per package, so a failure says WHICH file. Fragments defined
 * elsewhere in the same package are prepended, because the admin keeps them in
 * `fragments.graphql` and spends them in four others.
 *
 * ⛔ Every rule EXCEPT "no unused fragments", and the exception is deliberate rather
 * than convenient. Prepending a prelude makes almost every file carry fragments it
 * does not spread, so the rule would fire on nearly all of them - and the wallet has
 * two nothing spreads anyway (`contributionFields` and, through it,
 * `unconfirmedContributionFields`). A guard that fails on state it did not create
 * becomes a chore and then gets deleted.
 *
 * What that costs: a fragment going unused is not noticed here. What it keeps: every
 * field, argument, variable and type a front end names is checked against what the
 * server actually offers - which is the failure that reaches a member.
 */
const PACKAGES = ['admin', 'frontend'] as const

/**
 * How many documents of EACH KIND each package holds today.
 *
 * ⚠️ Floors, not counts, and split by kind on purpose. One floor per package cannot
 * see half a package disappear: the front end holds 6 `.graphql` and 52 `.js`
 * documents, so deleting every `.graphql` file - 28 operations - still leaves 52, and
 * any package-wide floor low enough to be stable is far below that. This file already
 * passed once while seeing 6 documents of 32. Split, a directory that quietly stops
 * matching in either half - a rename, a move, a changed extension - fails loudly.
 */
const AT_LEAST: Record<string, { graphql: number; js: number }> = {
  admin: { graphql: 5, js: 24 },
  frontend: { graphql: 5, js: 50 },
}

const RULES = specifiedRules.filter((rule) => rule !== NoUnusedFragmentsRule)

/** The GraphQL inside `gql\`…\`` literals. The document `.js` files carry no `${}`. */
const gqlBodies = (source: string): string[] =>
  [...source.matchAll(/gql`([^`]*)`/g)].map((match) => match[1])

const documentsOf = (pkg: string): { path: string; source: string }[] => {
  const dir = join(__dirname, '..', '..', '..', pkg, 'src', 'graphql')
  return readdirSync(dir)
    .filter((name) => /\.(graphql|js)$/.test(name) && !/\.(spec|test)\.js$/.test(name))
    .sort()
    .flatMap((name) => {
      const path = `${pkg}/src/graphql/${name}`
      const raw = readFileSync(join(dir, name), 'utf8')
      if (name.endsWith('.graphql')) {
        return [{ path, source: raw }]
      }
      return gqlBodies(raw).map((source, index) => ({ path: `${path}#${index + 1}`, source }))
    })
    .filter((doc) => doc.source.trim().length > 0)
}

const countByKind = (docs: { path: string }[]): { graphql: number; js: number } => ({
  graphql: docs.filter((doc) => doc.path.endsWith('.graphql')).length,
  js: docs.filter((doc) => !doc.path.endsWith('.graphql')).length,
})

/** Fragment definitions from every OTHER document of the package. */
const preludeFor = (docs: { path: string; source: string }[], own: string): string =>
  docs
    .filter((doc) => doc.path !== own)
    .flatMap((doc) => [...doc.source.matchAll(/(^|\n)(fragment[\s\S]*?\n})/g)].map((m) => m[2]))
    .join('\n')

describe('the documents the front ends send', () => {
  // Built once: `schema()` runs type-graphql over every resolver, which is not cheap
  // and does not change between these assertions.
  let built: GraphQLSchema

  beforeAll(async () => {
    built = await schema()
  })

  it.each([...PACKAGES])('%s asks the schema for things it has', (pkg) => {
    const docs = documentsOf(pkg)
    expect(countByKind(docs)).toEqual({
      graphql: expect.any(Number),
      js: expect.any(Number),
    })
    expect(countByKind(docs).graphql).toBeGreaterThanOrEqual(AT_LEAST[pkg].graphql)
    expect(countByKind(docs).js).toBeGreaterThanOrEqual(AT_LEAST[pkg].js)

    const failures = docs.flatMap((doc) => {
      const prelude = preludeFor(docs, doc.path)
      const errors = validate(built, parse(`${prelude}\n${doc.source}`), RULES)
      return errors.map((error) => `${doc.path}: ${error.message}`)
    })

    // Named rather than counted, and carrying the file: the whole point is that
    // somebody reading the CI log can fix it without reproducing anything.
    expect(failures).toEqual([])
  })

  // ⛔ The instrument, proved on itself, once per KIND of mistake this file claims to
  // catch. One probe is not enough: `RULES` narrowed to `FieldsOnCorrectTypeRule`
  // alone would answer the first of these and drop argument, value and variable
  // checking entirely - most of what the docblock above promises - with all the real
  // assertions still green.
  it.each([
    ['a field the schema does not have', 'query { thisFieldDoesNotExistAnywhere }'],
    ['an argument the schema does not have', 'query { contribution(nope: 1) { id } }'],
    ['a variable of the wrong type', 'query ($id: String!) { contribution(id: $id) { id } }'],
    ['a required argument left out', 'query { contribution { id } }'],
  ])('would notice %s', (_what, document) => {
    expect(validate(built, parse(document), RULES).length).toBeGreaterThan(0)
  })

  it('reads both kinds of document, not just the half it started with', () => {
    // ⚠️ Asserted by name as well as by the floors above, because a count says
    // something is missing and a name says WHAT.
    const paths = documentsOf('frontend').map((doc) => doc.path)

    expect(paths.some((path) => path.includes('mutations.js'))).toBe(true)
    expect(paths.some((path) => path.includes('queries.js'))).toBe(true)
    expect(paths.some((path) => path.endsWith('.graphql'))).toBe(true)
    // ⛔ And nothing from a spec file, which carries `${}` interpolation this reader
    // cannot resolve and operations that were never sent anywhere.
    expect(paths.filter((path) => /\.(spec|test)\.js/.test(path))).toEqual([])
  })
})
