// AI-GENERATED — not an architecture reference
import { CreaResolver } from './CreaResolver'

// The seam this file exists for: `setCreaSettings` writes TWO tables through two
// different ORMs, with no transaction available between them, and returns one object
// built from both. Every part of that is untested elsewhere - the database layer has
// its own tests, the admin page has its own, and the ordering that decides which half
// can be left orphaned had none at all.
//
// Mocked rather than driven against a database, because what is under test is the
// SEQUENCE, and a sequence is exactly what a mock can see and a database cannot.
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
    matchingKeyingActive: true,
    ...overrides,
  })

  beforeEach(() => {
    jest.resetAllMocks()
    readSettings.mockResolvedValue(storedSettings)
    writeSettings.mockResolvedValue(storedSettings)
    setActive.mockResolvedValue({ success: true })
    isActive.mockResolvedValue(true)
  })

  it('writes the model settings before it switches the spending on', async () => {
    const order: string[] = []
    writeSettings.mockImplementation(async () => {
      order.push('settings')
      return storedSettings
    })
    setActive.mockImplementation(async () => {
      order.push('switch')
      return { success: true }
    })

    await resolver.setCreaSettings(input())

    // ⛔ The order is the whole point. There is no transaction to be had - the two
    // writes cross ORMs and connection pools - so which one goes second decides which
    // half can be left orphaned, and only one of the two orphans costs money.
    expect(order).toEqual(['settings', 'switch'])
  })

  it('does not switch the spending on when the model write fails', async () => {
    writeSettings.mockRejectedValue(new Error('Data too long for column model'))

    await expect(resolver.setCreaSettings(input())).rejects.toThrow()

    // The failure that made the order matter, and it is reachable from the panel:
    // `crea_settings.model` is varchar(64) and nothing bounds the model string on the
    // way in. Written the other way round, this admin would have read "the save did
    // not work" while the keying was already switched on and buying.
    expect(setActive).not.toHaveBeenCalled()
  })

  it('answers with the stored switch, not with what it was handed', async () => {
    isActive.mockResolvedValue(false)

    const answer = await resolver.setCreaSettings(input({ matchingKeyingActive: true }))

    // An UPDATE that matched no row is a real state here - a missing home community,
    // which the read answers `false` for on purpose. Echoing the input would report a
    // save that did not happen, on the one field where that means an unnoticed bill.
    expect(answer.matchingKeyingActive).toBe(false)
  })

  it('fails the save when the switch could not be stored', async () => {
    setActive.mockResolvedValue({ success: false, error: new Error('no home community') })

    await expect(resolver.setCreaSettings(input())).rejects.toThrow()
  })

  it('leaves the switch alone when the field is absent', async () => {
    // An admin bundle from before this field existed sends the other three. Absent
    // means LEAVE IT - a contract rather than a guess - so that such a tab can still
    // save a model instead of failing coercion on a field it has never heard of.
    await resolver.setCreaSettings(input({ matchingKeyingActive: undefined }))

    expect(writeSettings).toHaveBeenCalled()
    expect(setActive).not.toHaveBeenCalled()
  })

  it('still switches it OFF when asked to, rather than reading false as absent', async () => {
    // ⚠️ The reason the resolver tests `!= null` instead of falsiness: `false` is the
    // value that stops the spending, and treating it as "nothing was sent" would make
    // the switch one-way.
    await resolver.setCreaSettings(input({ matchingKeyingActive: false }))

    expect(setActive).toHaveBeenCalledWith(false)
  })
})
