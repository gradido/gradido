// AI-GENERATED — not an architecture reference
import { CreaResolver } from './CreaResolver'

// The seam this file exists for: the Crea settings page writes TWO tables through two
// different ORMs, and what matters is that each mutation touches only its own. That is
// untested elsewhere - the database layer has its own tests, the admin page has its
// own, and nothing else asks whether saving a model can move the switch that spends.
//
// Mocked rather than driven against a database, because what is under test is WHICH
// CALLS HAPPEN, and that is exactly what a mock can see and a database cannot.
jest.mock('database', () => ({
  dbIsMatchingKeyingActive: jest.fn(),
  dbSetMatchingKeyingActive: jest.fn(),
}))
jest.mock('@/apis/anthropic/crea/settings', () => ({
  CREA_EFFORTS: ['disabled', 'low', 'medium', 'high', 'xhigh', 'max'],
  defaultCreaModel: () => 'claude-sonnet-5',
  readCreaSettings: jest.fn(),
  writeCreaSettings: jest.fn(),
}))

import { dbIsMatchingKeyingActive, dbSetMatchingKeyingActive } from 'database'
import { readCreaSettings, writeCreaSettings } from '@/apis/anthropic/crea/settings'

const isActive = dbIsMatchingKeyingActive as jest.Mock
const setActive = dbSetMatchingKeyingActive as jest.Mock
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

  it('switches OFF as readily as ON', async () => {
    isActive.mockResolvedValue(false)

    expect(await resolver.setCreaMatchingKeying(false)).toBe(false)
    expect(setActive).toHaveBeenCalledWith(false)
  })
})
