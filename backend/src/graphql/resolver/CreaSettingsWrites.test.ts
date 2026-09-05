// AI-GENERATED — not an architecture reference
import { CreaResolver } from './CreaResolver'

// The seam this file exists for: the Crea settings page writes TWO tables through two
// different ORMs, and what matters is that each mutation touches only its own. That is
// untested elsewhere - the database layer has its own tests, the admin page has its
// own, and nothing else asks whether saving a model can move the switch that spends.
//
// Mocked rather than driven against a database, because what is under test is WHICH
// CALLS HAPPEN, and that is exactly what a mock can see and a database cannot.
// The real module underneath: the resolver now reaches ROLES → RoleNames through the
// signer check, and a mock that only knows two functions left RoleNames undefined at
// import time. The signer reads are mocked to "nobody configured".
jest.mock('database', () => ({
  ...jest.requireActual('database'),
  dbIsMatchingKeyingActive: jest.fn(),
  dbSetMatchingKeyingActive: jest.fn(),
  dbGetFirstCreationSignerUserId: jest.fn(),
  dbGetUserWithRolesById: jest.fn(),
  dbSetFirstCreationSignerUserId: jest.fn(),
}))
jest.mock('@/apis/anthropic/crea/settings', () => ({
  CREA_EFFORTS: ['disabled', 'low', 'medium', 'high', 'xhigh', 'max'],
  defaultCreaModel: () => 'claude-sonnet-5',
  readCreaSettings: jest.fn(),
  writeCreaSettings: jest.fn(),
}))

import {
  dbGetFirstCreationSignerUserId,
  dbIsMatchingKeyingActive,
  dbSetMatchingKeyingActive,
} from 'database'
import { readCreaSettings, writeCreaSettings } from '@/apis/anthropic/crea/settings'

const isActive = dbIsMatchingKeyingActive as jest.Mock
const setActive = dbSetMatchingKeyingActive as jest.Mock
const signerId = dbGetFirstCreationSignerUserId as jest.Mock
const readSettings = readCreaSettings as jest.Mock
const writeSettings = writeCreaSettings as jest.Mock

describe('the two writes behind the Crea settings', () => {
  const resolver = new CreaResolver()
  const storedSettings = { model: 'claude-opus-5', effort: 'high', fastMode: true }
  const input = (overrides = {}) => ({
    model: 'claude-opus-5',
    effort: 'high',
    fastMode: true,
    ...overrides,
  })

  beforeEach(() => {
    jest.resetAllMocks()
    readSettings.mockResolvedValue(storedSettings)
    writeSettings.mockResolvedValue(storedSettings)
    setActive.mockResolvedValue({ success: true })
    isActive.mockResolvedValue(true)
    signerId.mockResolvedValue(null)
  })

  it('does not touch the keying switch when the moderation settings are saved', async () => {
    await resolver.setCreaSettings(input())

    // ⛔ The separation, asserted from the side that used to break it. When both rode
    // in one mutation, a save of the model carried whatever switch value the form
    // held - so a browser tab open since before somebody else flipped it could revert
    // a paid run, or restart one that had been deliberately stopped.
    expect(writeSettings).toHaveBeenCalled()
    expect(setActive).not.toHaveBeenCalled()
  })

  it('reads the signer BEFORE the settings write, like the switch', async () => {
    await resolver.setCreaSettings(input())

    // A read that fails after the write would report an error for a save that happened.
    expect(signerId).toHaveBeenCalled()
    expect(signerId.mock.invocationCallOrder[0]).toBeLessThan(
      writeSettings.mock.invocationCallOrder[0],
    )
  })

  it('reports the stored switch alongside the settings it did save', async () => {
    isActive.mockResolvedValue(true)

    const answer = await resolver.setCreaSettings(input())

    // Read rather than carried over, so the page's other section cannot drift out of
    // step with the database it is showing.
    expect(answer.matchingKeyingActive).toBe(true)
    expect(isActive).toHaveBeenCalled()
  })

  it('answers the switch mutation with what is stored, not with what it was handed', async () => {
    isActive.mockResolvedValue(false)

    // An UPDATE that matched no row is a real state here - a missing home community,
    // which the read answers `false` for on purpose. Echoing the argument would report
    // a save that did not happen, on the one setting where that means an unnoticed bill.
    expect(await resolver.setCreaMatchingKeying(true)).toBe(false)
  })

  it('fails the switch mutation when the write reported nothing', async () => {
    setActive.mockResolvedValue({ success: false, error: new Error('no home community') })

    await expect(resolver.setCreaMatchingKeying(true)).rejects.toThrow()
  })

  it('reports the switch as ON when that is what is stored', async () => {
    // ⛔ Measured gap, and my own repair raised its stakes. `return false` from the
    // mutation left every test here green, because both switch tests stubbed the read
    // to `false` - and the page now compares the answer with what it sent, so a broken
    // return would make every attempt to switch keying ON snap the box back and raise
    // "somebody else changed it". The paid switch would be unturnable-on, silently.
    isActive.mockResolvedValue(true)

    expect(await resolver.setCreaMatchingKeying(true)).toBe(true)
  })

  it('accepts the deprecated switch field in the input and ignores it', async () => {
    // ⚠️ The field exists only so that an admin bundle loaded before the split can
    // still save: GraphQL rejects an unknown key in a variable object outright. Its
    // whole job is to be tolerated, so deleting it must fail something - otherwise the
    // next cleanup pass removes it a release early and breaks every open tab.
    await resolver.setCreaSettings(input({ matchingKeyingActive: true }))

    expect(writeSettings).toHaveBeenCalled()
    expect(setActive).not.toHaveBeenCalled()
  })

  it('switches ON with what it was asked for', async () => {
    // ⛔ Measured gap, and it was the wrong one to have: hardcoding the write to
    // `false` left all five tests green. The only argument assertion in the file
    // pinned the OFF direction, so the one-line typo that makes the paid switch
    // impossible to turn ON would have shipped.
    await resolver.setCreaMatchingKeying(true)

    expect(setActive).toHaveBeenCalledWith(true)
  })

  it('switches OFF as readily as ON', async () => {
    isActive.mockResolvedValue(false)

    expect(await resolver.setCreaMatchingKeying(false)).toBe(false)
    expect(setActive).toHaveBeenCalledWith(false)
  })

  it('reads the switch before it writes the settings', async () => {
    // ⚠️ Order, and the reason is a failure rather than tidiness: this read serves a
    // field no client selects any more, and a transient failure of it must not fail a
    // save that has already committed.
    const order: string[] = []
    isActive.mockImplementation(async () => {
      order.push('read')
      return true
    })
    writeSettings.mockImplementation(async () => {
      order.push('write')
      return storedSettings
    })

    await resolver.setCreaSettings(input())

    expect(order).toEqual(['read', 'write'])
  })
})
