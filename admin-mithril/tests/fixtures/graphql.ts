// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { test as base, expect, type Page } from '@playwright/test'
import {
  buildSchema,
  execute,
  type GraphQLFieldResolver,
  Kind,
  type OperationDefinitionNode,
  parse,
  validate,
  valueFromASTUntyped,
} from 'graphql'

type Variables = Record<string, unknown>

/** A root field the server answers with an error instead of data, with its code where given. */
export class Failure {
  constructor(
    public readonly message: string,
    public readonly code?: string,
  ) {}
}

// A document the server's schema no longer takes is refused whole, before anything runs: HTTP 400,
// no data (verified against the running server, useAppOutdated.ts).
const VALIDATION_FAILED = 'GRAPHQL_VALIDATION_FAILED'

/**
 * The answer to one root field: the value itself, or built from the variables sent -- also a
 * promise of it, for a test that holds the answer back.
 */
export type Answer = unknown | ((variables: Variables) => unknown)

/**
 * The variables as the server reads them: those the operation declares, a missing one with its
 * default. Apollo sends the defaults along and undeclared variables too, a plain client does not;
 * to the server both are the same request, and so they are to the comparison.
 */
const asTheServerReads = (operation: OperationDefinitionNode | undefined, sent: Variables) =>
  Object.fromEntries(
    (operation?.variableDefinitions ?? []).flatMap(({ variable, defaultValue }) => {
      const name = variable.name.value
      if (name in sent && sent[name] !== undefined) {
        return [[name, sent[name]]]
      }
      return defaultValue ? [[name, valueFromASTUntyped(defaultValue)]] : []
    }),
  )

// The server's schema as the backend writes it: every request the app sends and every answer a
// test makes up is held against it, so that a mock cannot promise what the server does not have.
const SCHEMA = buildSchema(
  readFileSync(new URL('../../../backend/schema.graphql', import.meta.url), 'utf8'),
)

// A field the app asks for and the answer leaves out is a mistake of the test, not a null.
const fieldOfTheAnswer: GraphQLFieldResolver<Record<string, unknown>, unknown> = (
  source,
  _args,
  _context,
  { path, parentType, fieldName },
) => {
  if (!(path.key in source)) {
    throw new Error(`the answer has no ${parentType.name}.${fieldName}`)
  }
  return source[path.key]
}

/**
 * What the server's schema says against a request and the answers made up for it: its own
 * validation of the document and the variables, and the answers run through the schema as the
 * server would send them -- a missing field, a null where none may be, an unknown enum value.
 * Root fields without data (failures, unanswered ones) are not its business.
 */
const schemaObjections = async (
  document: ReturnType<typeof parse>,
  variables: Variables,
  data: Record<string, unknown>,
) => {
  const invalid = validate(SCHEMA, document)
  if (invalid.length > 0) {
    return invalid.map(({ message }) => `request: ${message}`)
  }
  const { errors = [] } = await execute({
    schema: SCHEMA,
    document,
    rootValue: data,
    variableValues: variables,
    fieldResolver: fieldOfTheAnswer,
  })
  return errors
    .filter(({ path }) => !path || String(path[0]) in data)
    .map(({ path, message }) => `${path ? path.join('.') : 'variables'}: ${message}`)
}

/** What the app asked for: one entry per root field, in the order sent. */
export type SentRequest = { field: string; variables: Variables }

/**
 * Answers every GraphQL request of the app from `answers`, keyed by root field (or its alias). A field without
 * an answer gets a GraphQL error and lands in `unanswered`; the `graphql` fixture fails the test
 * on it, so a request nobody expected cannot pass unnoticed.
 */
const mockGraphql = async (page: Page) => {
  const answers: Record<string, Answer> = {}
  const sent: SentRequest[] = []
  const unanswered: string[] = []
  const objections: string[] = []

  await page.route('**/graphql', async (route) => {
    const { query, variables: sentVariables = {} } = route.request().postDataJSON()
    const document = parse(query)
    const operation = document.definitions.find(
      (definition): definition is OperationDefinitionNode =>
        definition.kind === Kind.OPERATION_DEFINITION,
    )
    // a root field asked for twice under aliases is answered and recorded by its alias
    const fields = (operation?.selectionSet.selections ?? []).flatMap((selection) =>
      selection.kind === Kind.FIELD ? [(selection.alias ?? selection.name).value] : [],
    )
    const variables = asTheServerReads(operation, sentVariables)
    const data: Record<string, unknown> = {}
    const errors: { message: string; path: string[]; extensions?: { code: string } }[] = []
    for (const field of fields) {
      sent.push({ field, variables })
      if (!(field in answers)) {
        unanswered.push(field)
        errors.push({ message: `not mocked: ${field}`, path: [field] })
        continue
      }
      const answer = answers[field]
      const value = typeof answer === 'function' ? await answer(variables) : answer
      if (value instanceof Failure) {
        errors.push({
          message: value.message,
          path: [field],
          ...(value.code ? { extensions: { code: value.code } } : {}),
        })
      } else {
        data[field] = value
      }
    }
    objections.push(...(await schemaObjections(document, sentVariables, data)))
    if (errors.some(({ extensions }) => extensions?.code === VALIDATION_FAILED)) {
      await route.fulfill({ status: 400, json: { errors } })
    } else {
      await route.fulfill({ json: errors.length > 0 ? { data, errors } : { data } })
    }
  })

  return {
    /** Sets the answers for the root fields named, on top of those set before. */
    answer: (more: Record<string, Answer>) => Object.assign(answers, more),
    /** The requests sent so far. */
    sent: () => [...sent],
    /** The requests sent so far for `field`. */
    sentFor: (field: string) => sent.filter((request) => request.field === field),
    unanswered,
    objections,
  }
}

export const test = base.extend<{ graphql: Awaited<ReturnType<typeof mockGraphql>> }>({
  graphql: async ({ page }, use) => {
    const graphql = await mockGraphql(page)
    await use(graphql)
    expect(graphql.unanswered, 'requests without a mocked answer').toEqual([])
    expect(graphql.objections, "what the server's schema does not take").toEqual([])
  },
})

export { expect }
