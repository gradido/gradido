// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { type Navigation, smartRedirect, type Visitor } from './Guard.logic'

const to = (path: string, more: Partial<Navigation> = {}): Navigation => ({
  path,
  query: '',
  requiresAuth: false,
  isStart: false,
  forProject: false,
  ...more,
})
const member: Visitor = { sessionRuns: true, creationAllowed: null }
const nobody: Visitor = { sessionRuns: false, creationAllowed: null }

describe('whereTo', () => {
  it('leads from the root of the wallet to the sign-in', () => {
    expect(smartRedirect(to('/'), nobody)).toBe('/login')
    expect(smartRedirect(to('/', { isStart: true }), member)).toBe('/login')
  })

  describe('a start with a running session', () => {
    it('goes on from the sign-in page to the overview', () => {
      expect(smartRedirect(to('/login', { isStart: true }), member)).toBe('/overview')
    })

    it('goes on to the link whose code the address of the sign-in carries, with its query', () => {
      const withCode = to('/login/c0de', { isStart: true, query: '?codeCommunityUuid=abc' })
      expect(smartRedirect(withCode, member)).toBe('/redeem/c0de?codeCommunityUuid=abc')
      expect(smartRedirect(withCode, nobody)).toBeNull()
      expect(smartRedirect({ ...withCode, isStart: false }, member)).toBeNull()
    })

    it('keeps the form for a sign-in for a project', () => {
      expect(smartRedirect(to('/login', { isStart: true, forProject: true }), member)).toBeNull()
    })

    it('keeps the form on a way in from inside the running wallet', () => {
      expect(smartRedirect(to('/login'), member)).toBeNull()
    })

    it('keeps the form where no session runs', () => {
      expect(smartRedirect(to('/login', { isStart: true }), nobody)).toBeNull()
    })

    it('leaves every other start as it was', () => {
      expect(smartRedirect(to('/register', { isStart: true }), member)).toBeNull()
      expect(smartRedirect(to('/send', { isStart: true, requiresAuth: true }), member)).toBeNull()
    })
  })

  describe('a page for members', () => {
    it('opens while the session runs', () => {
      expect(smartRedirect(to('/send', { requiresAuth: true }), member)).toBeNull()
    })

    it('leads to the sign-in where none runs', () => {
      expect(smartRedirect(to('/send', { requiresAuth: true }), nobody)).toBe('/login')
    })

    it('is no matter to a page for everybody', () => {
      expect(smartRedirect(to('/register'), nobody)).toBeNull()
    })
  })

  describe('the creation area and the project account', () => {
    const projectAccount: Visitor = { sessionRuns: true, creationAllowed: false }

    it('sends a project account to the overview', () => {
      expect(smartRedirect(to('/contributions', { requiresAuth: true }), projectAccount)).toBe(
        '/overview',
      )
      expect(
        smartRedirect(to('/contributions/contribute', { requiresAuth: true }), projectAccount),
      ).toBe('/overview')
    })

    it('lets a person in, and an account not known yet', () => {
      const person: Visitor = { sessionRuns: true, creationAllowed: true }
      expect(smartRedirect(to('/contributions', { requiresAuth: true }), person)).toBeNull()
      expect(smartRedirect(to('/contributions', { requiresAuth: true }), member)).toBeNull()
    })

    it('leaves every other page to the project account', () => {
      expect(smartRedirect(to('/send', { requiresAuth: true }), projectAccount)).toBeNull()
    })

    // the sign-in comes first: nobody is told what a project account may not
    it('asks for the sign-in before it', () => {
      const signedOut: Visitor = { sessionRuns: false, creationAllowed: false }
      expect(smartRedirect(to('/contributions', { requiresAuth: true }), signedOut)).toBe('/login')
    })
  })
})
