// AI-GENERATED — not an architecture reference
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  GraphQLSchema,
  Kind,
  NoUnusedFragmentsRule,
  parse,
  specifiedRules,
  validate,
} from 'graphql'
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
 * left both suites green. It surfaces the first time somebody presses the button, as a
 * raw error toast - and on its first widened run this file found exactly that: the
 * admin's `getContribution` had been asking `Contribution` for three fields it does
 * not have. ⚠️ Reachable only in theory today, because the event chain that would send
 * it is severed - which is precisely why no human had ever noticed.
 *
 * ⚠️ BOTH file kinds, and that is not a detail. The first version of this file read
 * only `.graphql` and its header claimed to cover everything the front ends send -
 * false by a factor of seven: 12 documents of 90. The rest live in `.js` as `gql`
 * template literals, `login` and `sendCoins` among them. A guard that names a scope it
 * does not have is worse than no guard, because the next reader stops looking.
 *
 * Per file rather than per package, so a failure says WHICH file.
 *
 * ⛔ Every rule EXCEPT "no unused fragments", and the exception is deliberate rather
 * than convenient. The wallet has two fragments nothing spreads - `contributionFields`
 * and, through it, `unconfirmedContributionFields` - so the rule would fail on state
 * this file did not create, and a guard that does that becomes a chore and then gets
 * deleted. What it costs: a fragment going unused is not noticed here. What it keeps:
 * every field, argument, variable and type a front end names is checked against what
 * the server actually offers - which is the failure that reaches a member.
 */
const PACKAGES = ['admin', 'frontend'] as const

/**
 * How many OPERATIONS each package sends today. Measured: admin 56, wallet 80.
 *
 * ⚠️ A floor, not a count, and it counts operations rather than files on purpose. A
 * file floor cannot see a file go: `admin/src/graphql/creationGroups.graphql` alone
 * holds ten operations, and losing it moves a file count by one. It also cannot tell
 * an operation-bearing file from `fragments.graphql`, which holds none.
 *
 * What it is for is a directory that quietly stops matching - a rename, a move to a
 * subdirectory, a changed extension - which is how this file once passed while seeing
 * 12 documents of 90. It is deliberately NOT tight enough to fire when somebody
 * legitimately deletes one query; that would be a chore, and chores get deleted.
 */
const AT_LEAST: Record<string, number> = { admin: 50, frontend: 72 }

const RULES = specifiedRules.filter((rule) => rule !== NoUnusedFragmentsRule)

/** The GraphQL inside `gql\`…\`` literals. The document `.js` files carry no `${}`. */
const gqlBodies = (source: string): string[] =>
  [...source.matchAll(/gql`([^`]*)`/g)].map((match) => match[1])

const dirOf = (pkg: string): string => join(__dirname, '..', '..', '..', pkg, 'src', 'graphql')

/**
 * ⚠️ Recursive, because both cache keys that guard this file are: the workflow path
 * `admin/src/graphql/**` and the turbo input both match subdirectories. A reader that
 * did not would let a document added one directory down re-run the whole backend CI
 * and be checked by nothing.
 */
const filesUnder = (dir: string, prefix = ''): { name: string; rel: string; dir: string }[] =>
  readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) =>
      entry.isDirectory()
        ? filesUnder(join(dir, entry.name), `${prefix}${entry.name}/`)
        : // ⚠️ Two names, and they are not the same one. `dir` already descends into
          // the subdirectory, so reading must use the bare `name`; only the reported
          // path carries `rel`. Folding them into one field made `join(dir, name)`
          // repeat the subdirectory - `graphql/tief/tief/unten.graphql` - so the
          // recursion added for nested documents failed on exactly them.
          [{ name: entry.name, rel: `${prefix}${entry.name}`, dir }],
    )

const documentsOf = (pkg: string): { path: string; source: string; dir: string }[] =>
  filesUnder(dirOf(pkg))
    .filter(({ name }) => /\.(graphql|js)$/.test(name) && !/\.(spec|test)\.js$/.test(name))
    .flatMap(({ name, rel, dir }) => {
      const path = `${pkg}/src/graphql/${rel}`
      const raw = readFileSync(join(dir, name), 'utf8')
      if (name.endsWith('.graphql')) {
        return [{ path, source: raw, dir }]
      }
      // ⛔ An aliased tag - `import tag from 'graphql-tag'` - would make `gqlBodies`
      // return nothing for this file, silently, and the floor is not tight enough to
      // be the guard for that. So a document file that reaches for graphql-tag has to
      // reach for it under the name this reader looks for.
      if (/graphql-tag/.test(raw) && !/import\s+gql\s+from\s+['"]graphql-tag['"]/.test(raw)) {
        throw new Error(`${path} imports graphql-tag under another name; gqlBodies cannot see it`)
      }
      return gqlBodies(raw).map((source, index) => ({
        path: `${path}#${index + 1}`,
        source,
        dir,
      }))
    })
    .filter((doc) => doc.source.trim().length > 0)

/**
 * The files a document pulls in with `#import`, and nothing else.
 *
 * ⛔ A line-for-line mirror of `expandImports` in `vite-plugin-graphql-loader`, which
 * is what actually builds both front ends (`admin/vite.config.mjs`,
 * `frontend/vite.config.mjs`). Two details are the whole point of copying it rather
 * than approximating it: the loader allows ONE optional space after the `#`, and it
 * stops at the first non-empty line that is not a comment. A looser reader passes
 * documents the browser then fails on - an `#import` written below the first
 * operation is honoured here and ignored by vite - and a stricter one fails documents
 * that work, the moment somebody's formatter writes `# import`.
 *
 * An earlier version of this file ignored `#import` altogether and prepended the
 * fragments of EVERY other file in the package. That was more permissive than the
 * client in a third way, and it made one broken fragment report 32 failures, 31 of
 * them naming innocent files.
 *
 * ⚠️ No `existsSync` guard, on purpose: an import naming a file that is not there must
 * throw with that path, not resolve to an empty prelude and blame the files that
 * spread its fragments.
 */
const preludeFor = (dir: string, source: string): string => {
  const imports: string[] = []
  for (const line of source.split(/\r\n|\r|\n/)) {
    const match = /^#\s?import (.+)$/.exec(line)
    if (match) {
      imports.push(match[1].trim().replace(/^['"]|['"]$/g, ''))
    }
    if (line.length !== 0 && line[0] !== '#') {
      break
    }
  }
  return imports.map((file) => readFileSync(join(dir, file), 'utf8')).join('\n')
}

describe('the documents the front ends send', () => {
  // Built once: `schema()` runs type-graphql over every resolver, which is not cheap
  // and does not change between these assertions.
  let built: GraphQLSchema

  beforeAll(async () => {
    built = await schema()
  })

  it.each([...PACKAGES])('%s asks the schema for things it has', (pkg) => {
    const docs = documentsOf(pkg)
    const failures: string[] = []
    const names: string[] = []
    let operations = 0

    for (const doc of docs) {
      // ⚠️ Caught rather than thrown, and the reason is the promise this file makes: a
      // syntax error out of `parse` carries no path - graphql names the source
      // "GraphQL request" - so an uncaught one would stop the whole package at an
      // unnamed file and leave every document after it unchecked. That is the shape a
      // stray backtick in a `.js` document produces, which `gqlBodies` cannot rule out.
      try {
        for (const definition of parse(doc.source).definitions) {
          if (definition.kind === Kind.OPERATION_DEFINITION) {
            operations++
            if (definition.name) {
              names.push(definition.name.value)
            }
          }
        }
        const whole = parse(`${preludeFor(doc.dir, doc.source)}\n${doc.source}`)
        failures.push(...validate(built, whole, RULES).map((e) => `${doc.path}: ${e.message}`))
      } catch (error) {
        failures.push(`${doc.path}: ${(error as Error).message}`)
      }
    }

    // ⛔ Before the failures, because an empty document set produces no failures at all
    // and would otherwise report green while reading nothing.
    expect(operations).toBeGreaterThanOrEqual(AT_LEAST[pkg])

    // Two operations of one name in one client is a bug whichever files they sit in.
    // Per-file validation cannot see it, so it is counted here instead.
    expect(names.filter((name, index) => names.indexOf(name) !== index)).toEqual([])

    // Named rather than counted, and carrying the file: the whole point is that
    // somebody reading the CI log can fix it without reproducing anything.
    expect(failures).toEqual([])
  })

  // ⛔ The instrument, proved on itself, once per KIND of mistake this file claims to
  // catch. One probe is not enough: `RULES` narrowed to `FieldsOnCorrectTypeRule` alone
  // would answer a single field probe and drop argument, value and variable checking
  // entirely - most of what the docblock above promises - with every real assertion
  // still green. Each document below is invalid for ONE reason, so each pins one rule.
  it.each([
    ['a field the schema does not have', 'query { thisFieldDoesNotExistAnywhere }'],
    ['an argument the schema does not have', 'query { contribution(id: 1, nope: 1) { id } }'],
    ['a literal of the wrong type', 'query { contribution(id: "seven") { id } }'],
    ['a variable of the wrong type', 'query ($id: String!) { contribution(id: $id) { id } }'],
    ['a required argument left out', 'query { contribution { id } }'],
  ])('would notice %s', (_what, document) => {
    expect(validate(built, parse(document), RULES).length).toBeGreaterThan(0)
  })

  it('is asking about a field that really is there', () => {
    // ⚠️ The control the four probes need. All of them name `Query.contribution`, so
    // renaming that one resolver would make every probe pass for the same wrong reason
    // - "Cannot query field contribution" - and three of them would silently stop
    // testing arguments and variables at all.
    expect(validate(built, parse('query { contribution(id: 1) { id } }'), RULES)).toEqual([])
  })

  it('reads a document one directory down, and reads it from the right place', () => {
    // ⛔ The recursion exists for this case alone, and it shipped broken: `name` carried
    // the subdirectory while `dir` had already descended into it, so `join(dir, name)`
    // asked for `graphql/deeper/deeper/below.graphql`. No document lives in a
    // subdirectory today, so every other assertion in this file passes either way -
    // which is precisely why the guard for it has to build its own.
    const root = mkdtempSync(join(tmpdir(), 'gradido-documents-'))
    try {
      mkdirSync(join(root, 'deeper'))
      writeFileSync(join(root, 'top.graphql'), 'query top { id }')
      writeFileSync(join(root, 'deeper', 'below.graphql'), 'query below { id }')

      const found = filesUnder(root)

      expect(found.map((file) => file.rel).sort()).toEqual(['deeper/below.graphql', 'top.graphql'])
      for (const file of found) {
        expect(readFileSync(join(file.dir, file.name), 'utf8')).toContain('query')
      }
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('reads both kinds of document, not just the half it started with', () => {
    // ⚠️ Asserted by name as well as by the floor above, because a count says something
    // is missing and a name says WHAT.
    const paths = documentsOf('frontend').map((doc) => doc.path)

    expect(paths.some((path) => path.includes('mutations.js'))).toBe(true)
    expect(paths.some((path) => path.includes('queries.js'))).toBe(true)
    expect(paths.some((path) => path.endsWith('.graphql'))).toBe(true)
    // ⛔ And nothing from a spec file, which carries `${}` interpolation this reader
    // cannot resolve and operations that were never sent anywhere.
    expect(paths.filter((path) => /\.(spec|test)\.js/.test(path))).toEqual([])
  })
})
