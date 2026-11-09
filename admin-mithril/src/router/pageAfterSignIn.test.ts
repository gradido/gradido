// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { pageAfterSignIn } from './pageAfterSignIn'

const known = ['/', '/user', '/authenticate', '/logout']

describe('pageAfterSignIn', () => {
  it('goes on to a page of the admin, with its query', () => {
    expect(pageAfterSignIn('/user?search=peter', known)).toBe('/user?search=peter')
  })

  it('takes a trailing slash as the same page', () => {
    expect(pageAfterSignIn('/user/', known)).toBe('/user/')
  })

  it('goes to the start for a page the admin does not know', () => {
    expect(pageAfterSignIn('/renamed', known)).toBeNull()
  })

  it('never to the sign-in or the sign-out', () => {
    expect(pageAfterSignIn('/authenticate', known)).toBeNull()
    expect(pageAfterSignIn('/logout', known)).toBeNull()
  })

  it('never to another site', () => {
    expect(pageAfterSignIn('//evil.example/user', known)).toBeNull()
    expect(pageAfterSignIn('/\\evil.example', known)).toBeNull()
    expect(pageAfterSignIn('https://evil.example', known)).toBeNull()
  })

  it('not for anything but a string', () => {
    expect(pageAfterSignIn(['/user'], known)).toBeNull()
  })
})
