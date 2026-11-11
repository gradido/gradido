// AI-GENERATED — not an architecture reference
import { buildSchema, parse, validate } from 'graphql'
import { ROOT_FIELDS_MAX_PER_OPERATION, validationRules } from './validationRules'

const schema = buildSchema(`
  type Picture { data: String }
  type Member { picture: Picture friends: [Member] }
  type Query { me: Member pictures: [Picture] }
  type Mutation { touch: Boolean }
`)

const errorsOf = (document: string): string[] =>
  validate(schema, parse(document), validationRules).map((error) => error.message)

const rootAliases = (count: number): string =>
  Array.from({ length: count }, (_, i) => `a${i}: me { picture { data } }`).join(' ')

describe('validationRules', () => {
  it('lets aliases on root fields through', () => {
    expect(errorsOf(`{ small: me { picture { data } } large: me { picture { data } } }`)).toEqual(
      [],
    )
  })

  it('rejects an alias below the root, in a list and in a fragment', () => {
    expect(errorsOf(`{ pictures { a1: data } }`)).toEqual([
      'Alias "a1" is allowed on root fields only.',
    ])
    expect(
      errorsOf(`{ me { ...F } } fragment F on Member { friends { a2: picture { data } } }`),
    ).toEqual(['Alias "a2" is allowed on root fields only.'])
  })

  it('caps the root fields of an operation', () => {
    expect(errorsOf(`{ ${rootAliases(ROOT_FIELDS_MAX_PER_OPERATION)} }`)).toEqual([])
    expect(errorsOf(`{ ${rootAliases(ROOT_FIELDS_MAX_PER_OPERATION + 1)} }`)).toEqual([
      `${ROOT_FIELDS_MAX_PER_OPERATION + 1} root fields, at most ${ROOT_FIELDS_MAX_PER_OPERATION} are allowed.`,
    ])
  })

  it('counts the root fields of fragments on the root type, inline or spread', () => {
    const document = `
      query { me { picture { data } } ... on Query { pictures { data } } ...R ...R }
      fragment R on Query { ${rootAliases(ROOT_FIELDS_MAX_PER_OPERATION - 1)} }
    `
    expect(errorsOf(document)).toEqual([
      `${ROOT_FIELDS_MAX_PER_OPERATION + 1} root fields, at most ${ROOT_FIELDS_MAX_PER_OPERATION} are allowed.`,
    ])
  })

  it('counts each operation of a document on its own', () => {
    const half = rootAliases(ROOT_FIELDS_MAX_PER_OPERATION)
    expect(errorsOf(`query A { ${half} } query B { ${half} }`)).toEqual([])
  })
})
