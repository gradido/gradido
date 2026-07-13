import { describe, it, expect } from 'vitest'
import { print } from 'graphql'
import { verifyLogin } from './queries'

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
