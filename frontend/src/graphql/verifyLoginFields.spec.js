// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Found by hand, in the running wallet: a member changes their address, confirms the new
// one, and a settings page left open keeps showing the old one - through a reload as well.
// Signing in again with the new address is the only thing that helps, and it is the only
// thing that ever could: `state.email` was written in exactly one place, the login form,
// and the store is persisted, so nothing renewed it.
//
// The shape of the bug is the reason this file exists rather than a component test. No
// component test could see it: the frontend specs hand the layout a made-up response, so a
// field the query never asks for does not exist for them, and `state.email` had a value
// the whole time - just the wrong one. The two files have to be held against each other.
//
// Same family as `balanceFields.spec.js`, and the same rule: a store value fed from a
// server answer has to be asked for in the query that carries it.

const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

const verifyLoginQuery = () => read('./queries.js').match(/verifyLogin = gql`([\s\S]*?)`/)[1]

describe('verifyLogin', () => {
  it('asks for the address in force, which the settings page shows', () => {
    // Not just "the word email appears somewhere": `emailChecked` sits two lines above and
    // would satisfy that. The nested selection is what carries the address.
    expect(verifyLoginQuery()).toMatch(/emailContact\s*\{[^}]*\bemail\b[^}]*\}/)
  })

  it('is where the store takes the address from, not the login form alone', () => {
    // The guard is the one place a member passes through regularly without signing in
    // again, so it is where a changed address reaches the store.
    const guards = read('../routes/guards.js')
    expect(guards).toMatch(/commit\(\s*'email',[^)]*verifyLogin\.emailContact/)
  })

  it('does not ask the login mutation for it, which cannot answer', () => {
    // `login` runs on an inalienable right, so it has no authenticated caller, and the
    // field resolver hands a contact row to nobody but its owner. Asking there would not
    // fail loudly - it would answer null and look like a member without an address.
    const loginMutation = read('./mutations.js').match(/login = gql`([\s\S]*?)`/)[1]
    expect(loginMutation).not.toMatch(/emailContact/)
  })
})
