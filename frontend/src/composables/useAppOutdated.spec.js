import { describe, it, expect, beforeEach } from 'vitest'
import {
  isSchemaMismatch,
  markAppOutdated,
  resetAppOutdated,
  useAppOutdated,
} from './useAppOutdated'

// The two shapes below are the whole point of this file. A validation failure comes back as
// HTTP 400, and whether the client hands it over as graphQLErrors or as a networkError with
// the parsed body attached is the client's own business -- so both must be recognised, and a
// test has to say so, because nothing else would notice if one of them stopped working.
describe('isSchemaMismatch', () => {
  const validation = { extensions: { code: 'GRAPHQL_VALIDATION_FAILED' } }

  it('recognises a validation failure delivered as graphQLErrors', () => {
    expect(isSchemaMismatch({ graphQLErrors: [validation] })).toBe(true)
  })

  it('recognises a validation failure delivered inside a networkError', () => {
    expect(isSchemaMismatch({ networkError: { result: { errors: [validation] } } })).toBe(true)
  })

  it('finds it when it is not the first error', () => {
    const other = { extensions: { code: 'INTERNAL_SERVER_ERROR' } }
    expect(isSchemaMismatch({ graphQLErrors: [other, validation] })).toBe(true)
  })

  // Telling someone to reload when reloading cannot help is worse than saying nothing, so
  // every one of these has to stay quiet.
  it('stays quiet for any other error', () => {
    expect(isSchemaMismatch({ graphQLErrors: [{ extensions: { code: 'UNAUTHENTICATED' } }] })).toBe(
      false,
    )
    expect(isSchemaMismatch({ graphQLErrors: [{ message: 'no extensions at all' }] })).toBe(false)
    expect(isSchemaMismatch({ networkError: { message: 'offline' } })).toBe(false)
    expect(isSchemaMismatch({ graphQLErrors: [] })).toBe(false)
    expect(isSchemaMismatch({})).toBe(false)
    expect(isSchemaMismatch()).toBe(false)
  })

  it('survives a networkError whose body is not the shape we expect', () => {
    expect(isSchemaMismatch({ networkError: { result: 'plain text' } })).toBe(false)
    expect(isSchemaMismatch({ networkError: { result: { errors: null } } })).toBe(false)
  })

  // ⚠️ The trap a `graphQLErrors ?? networkError…` chain would fall into: an EMPTY array is
  // not nullish, so it would satisfy the first branch and the network error would never be
  // read. Whether the client sends undefined or [] is its own decision, so neither may be
  // relied on.
  it('still reads the networkError when graphQLErrors is an empty array', () => {
    expect(
      isSchemaMismatch({
        graphQLErrors: [],
        networkError: { result: { errors: [validation] } },
      }),
    ).toBe(true)
  })
})

describe('useAppOutdated', () => {
  beforeEach(() => {
    resetAppOutdated()
  })

  it('starts down and stays down until marked', () => {
    expect(useAppOutdated().appOutdated.value).toBe(false)
  })

  it('goes up when marked, and every caller sees the same flag', () => {
    const first = useAppOutdated()
    const second = useAppOutdated()
    markAppOutdated()

    expect(first.appOutdated.value).toBe(true)
    expect(second.appOutdated.value).toBe(true)
  })

  // Nothing may lower it except a reload. A component that could clear it would hide the bar
  // while the bundle is still the stale one. Vue's readonly() does not throw on a write, it
  // warns and drops it -- so the assertion is on the value, not on an exception.
  it('ignores an attempt to lower it through the composable', () => {
    markAppOutdated()
    const { appOutdated } = useAppOutdated()

    appOutdated.value = false

    expect(appOutdated.value).toBe(true)
  })
})
