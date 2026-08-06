// AI-GENERATED — not an architecture reference
const dbSelectModuleSettings = jest.fn()

jest.mock('database', () => ({
  dbSelectModuleSettings: () => dbSelectModuleSettings(),
}))

import {
  getModuleActivation,
  loadModuleActivation,
  resetModuleActivation,
  setModuleActivation,
} from './moduleActivation'

/** Lets the background refresh settle without waiting on a clock. */
const settle = () => new Promise((resolve) => setImmediate(resolve))

describe('moduleActivation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetModuleActivation()
  })

  describe('before anything has been read', () => {
    it('holds every module off', () => {
      // The safe state. A backend that has not yet been told may not offer a module.
      expect(getModuleActivation()).toEqual({ matchingActive: false })
    })
  })

  describe('loading at startup', () => {
    it('reads a stored one as on', async () => {
      dbSelectModuleSettings.mockResolvedValue({ id: 1, matchingActive: 1 })

      await loadModuleActivation()

      expect(getModuleActivation()).toEqual({ matchingActive: true })
    })

    // The state every instance is in once an admin has unchecked the box. Distinct from
    // the missing row below, and the only case that exercises the column conversion.
    it('reads a stored zero as off', async () => {
      dbSelectModuleSettings.mockResolvedValue({ id: 1, matchingActive: 0 })

      await loadModuleActivation()

      expect(getModuleActivation()).toEqual({ matchingActive: false })
    })

    // The migration writes no row on purpose, so this is what a fresh install reads.
    it('reads a missing row as off', async () => {
      dbSelectModuleSettings.mockResolvedValue(undefined)

      await loadModuleActivation()

      expect(getModuleActivation()).toEqual({ matchingActive: false })
    })

    // Deliberately not caught: a backend that cannot read which modules it offers has no
    // business serving requests, and this runs before it serves any.
    it('refuses to start when the switches cannot be read', async () => {
      dbSelectModuleSettings.mockRejectedValue(new Error('module_settings unreachable'))

      await expect(loadModuleActivation()).rejects.toThrow('module_settings unreachable')
    })
  })

  describe('after an admin writes', () => {
    it('holds the new value at once, without reading again', async () => {
      dbSelectModuleSettings.mockResolvedValue({ id: 1, matchingActive: 0 })
      await loadModuleActivation()
      jest.clearAllMocks()

      setModuleActivation({ matchingActive: true })

      expect(getModuleActivation()).toEqual({ matchingActive: true })
      expect(dbSelectModuleSettings).not.toHaveBeenCalled()
    })
  })

  describe('when the held value has gone stale', () => {
    // The property the authorization gate depends on: a reader is answered from memory
    // and never waits for the database, however old the value is.
    it('answers from memory and refreshes behind the caller', async () => {
      dbSelectModuleSettings.mockResolvedValue({ id: 1, matchingActive: 1 })

      // reset() leaves the value stale, so this reader triggers the refresh.
      expect(getModuleActivation()).toEqual({ matchingActive: false })
      expect(dbSelectModuleSettings).toHaveBeenCalledTimes(1)

      await settle()

      expect(getModuleActivation()).toEqual({ matchingActive: true })
    })

    it('starts only one refresh while it is in flight', async () => {
      dbSelectModuleSettings.mockResolvedValue({ id: 1, matchingActive: 1 })

      getModuleActivation()
      getModuleActivation()
      getModuleActivation()

      expect(dbSelectModuleSettings).toHaveBeenCalledTimes(1)
      await settle()
    })

    // An unreachable database must not withdraw a module from everyone. The last value the
    // database actually gave stays, and the next reader tries again.
    it('keeps the last known value when the refresh fails', async () => {
      dbSelectModuleSettings.mockResolvedValue({ id: 1, matchingActive: 1 })
      await loadModuleActivation()
      resetModuleActivation()
      setModuleActivation({ matchingActive: true })

      dbSelectModuleSettings.mockRejectedValue(new Error('pool exhausted'))
      resetModuleActivation()
      setModuleActivation({ matchingActive: true })
      // setModuleActivation stamps the value as fresh, so age it again by hand.
      jest.spyOn(Date, 'now').mockReturnValue(Number.MAX_SAFE_INTEGER)

      expect(getModuleActivation()).toEqual({ matchingActive: true })
      await settle()
      expect(getModuleActivation()).toEqual({ matchingActive: true })

      jest.spyOn(Date, 'now').mockRestore()
    })
  })
})
