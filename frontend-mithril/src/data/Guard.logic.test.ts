// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { type Navigation, type Visitor, whereTo } from './Guard.logic'

const to = (path: string, more: Partial<Navigation> = {}): Navigation => ({
  path,
  requiresAuth: false,
  isStart: false,
  forProject: false,
  ...more,
})
const member: Visitor = { sessionRuns: true, creationAllowed: null }
const nobody: Visitor = { sessionRuns: false, creationAllowed: null }

describe('whereTo', () => {
  describe('a start with a running session', () => {
    it('goes on from the sign-in page to the overview', () => {
      expect(whereTo(to('/login', { isStart: true }), member)).toBe('/overview')
    })

    it('keeps the form for a sign-in for a project', () => {
      expect(whereTo(to('/login', { isStart: true, forProject: true }), member)).toBeNull()
    })

    it('keeps the form on a way in from inside the running wallet', () => {
      expect(whereTo(to('/login'), member)).toBeNull()
    })

    it('keeps the form where no session runs', () => {
      expect(whereTo(to('/login', { isStart: true }), nobody)).toBeNull()
    })

    it('leaves every other start as it was', () => {
      expect(whereTo(to('/register', { isStart: true }), member)).toBeNull()
      expect(whereTo(to('/send', { isStart: true, requiresAuth: true }), member)).toBeNull()
    })
  })

  describe('a page for members', () => {
    it('opens while the session runs', () => {
      expect(whereTo(to('/send', { requiresAuth: true }), member)).toBeNull()
    })

    it('leads to the sign-in where none runs', () => {
      expect(whereTo(to('/send', { requiresAuth: true }), nobody)).toBe('/login')
    })

    it('is no matter to a page for everybody', () => {
      expect(whereTo(to('/register'), nobody)).toBeNull()
    })
  })

  describe('the creation area and the project account', () => {
    const projectAccount: Visitor = { sessionRuns: true, creationAllowed: false }

    it('sends a project account to the overview', () => {
      expect(whereTo(to('/contributions', { requiresAuth: true }), projectAccount)).toBe(
        '/overview',
      )
      expect(whereTo(to('/contributions/contribute', { requiresAuth: true }), projectAccount)).toBe(
        '/overview',
      )
    })

    it('lets a person in, and an account not known yet', () => {
      const person: Visitor = { sessionRuns: true, creationAllowed: true }
      expect(whereTo(to('/contributions', { requiresAuth: true }), person)).toBeNull()
      expect(whereTo(to('/contributions', { requiresAuth: true }), member)).toBeNull()
    })

    it('leaves every other page to the project account', () => {
      expect(whereTo(to('/send', { requiresAuth: true }), projectAccount)).toBeNull()
    })

    // the sign-in comes first: nobody is told what a project account may not
    it('asks for the sign-in before it', () => {
      const signedOut: Visitor = { sessionRuns: false, creationAllowed: false }
      expect(whereTo(to('/contributions', { requiresAuth: true }), signedOut)).toBe('/login')
    })
  })
})
