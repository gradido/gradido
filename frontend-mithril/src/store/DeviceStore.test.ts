// AI-GENERATED — not an architecture reference
import { beforeEach, describe, expect, it, spyOn } from 'bun:test'
import * as v from 'valibot'
import { otherTabStores } from './browserStub'

// after the stub: DeviceStore listens to the window as soon as it is loaded
const { DeviceStore, DeviceStoreBasicType } = await import('./DeviceStore')
const { Object: AsObject, String: AsText, Number: AsNumber } = DeviceStoreBasicType

const KEY = 'calculator-prefs'
const prefsSchema = v.fallback(v.object({ decimals: v.fallback(v.number(), 2) }), { decimals: 2 })
const sideSchema = v.fallback(v.picklist(['left', 'right']), 'left')

beforeEach(() => {
  localStorage.clear()
})

describe('DeviceStore', () => {
  describe('at its start', () => {
    it('reads what is stored through its schema', () => {
      localStorage.setItem(KEY, '{"decimals":4,"unknown":true}')
      expect(new DeviceStore(KEY, prefsSchema, AsObject).state).toEqual({ decimals: 4 })
    })

    it('has what the fallbacks say where nothing is stored, no JSON, or what does not fit', () => {
      expect(new DeviceStore(KEY, prefsSchema, AsObject).state).toEqual({ decimals: 2 })
      localStorage.setItem(KEY, 'not json')
      expect(new DeviceStore(KEY, prefsSchema, AsObject).state).toEqual({ decimals: 2 })
      localStorage.setItem(KEY, '{"decimals":"many"}')
      expect(new DeviceStore(KEY, prefsSchema, AsObject).state).toEqual({ decimals: 2 })
    })

    it('reads a text as it is', () => {
      localStorage.setItem(KEY, 'right')
      expect(new DeviceStore(KEY, sideSchema, AsText).state).toBe('right')
      localStorage.setItem(KEY, '"right"')
      expect(new DeviceStore(KEY, sideSchema, AsText).state).toBe('left')
    })

    // an error in the code, to be seen at once
    it('throws where the schema has no fallback and nothing is stored', () => {
      expect(() => new DeviceStore(KEY, v.object({ decimals: v.number() }), AsObject)).toThrow()
    })
  })

  describe('set', () => {
    it('keeps an object as JSON and a text as it is', () => {
      const prefs = new DeviceStore(KEY, prefsSchema, AsObject)
      prefs.set({ decimals: 3 })
      expect(prefs.state).toEqual({ decimals: 3 })
      expect(localStorage.getItem(KEY)).toBe('{"decimals":3}')

      const side = new DeviceStore('right-side', sideSchema, AsText)
      side.set('right')
      expect(localStorage.getItem('right-side')).toBe('right')
    })

    it('removes the entry and has the fallback where it is handed nothing', () => {
      const prefs = new DeviceStore(KEY, prefsSchema, AsObject)
      prefs.set({ decimals: 3 })
      prefs.set(undefined)
      expect(prefs.state).toEqual({ decimals: 2 })
      expect(localStorage.getItem(KEY)).toBeNull()
    })

    it('leaves localStorage alone where it is told not to persist', () => {
      const prefs = new DeviceStore(KEY, prefsSchema, AsObject)
      prefs.set({ decimals: 3 }, false)
      expect(prefs.state).toEqual({ decimals: 3 })
      expect(localStorage.getItem(KEY)).toBeNull()
    })

    it('holds the value for this visit where the storage is full', () => {
      const full = spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      const prefs = new DeviceStore(KEY, prefsSchema, AsObject)
      prefs.set({ decimals: 3 })
      expect(prefs.state).toEqual({ decimals: 3 })
      full.mockRestore()
    })
  })

  // localStorage hands out text: a store of numbers turns it into one before the schema sees it.
  describe('a number', () => {
    const decimalsSchema = v.fallback(v.number(), 2)

    it('is kept as text and read back as a number, zero too', () => {
      new DeviceStore(KEY, decimalsSchema, AsNumber).set(5)
      expect(localStorage.getItem(KEY)).toBe('5')
      expect(new DeviceStore(KEY, decimalsSchema, AsNumber).state).toBe(5)

      new DeviceStore(KEY, decimalsSchema, AsNumber).set(0)
      expect(localStorage.getItem(KEY)).toBe('0')
      expect(new DeviceStore(KEY, decimalsSchema, AsNumber).state).toBe(0)
    })

    it('is read back by a schema that also takes none', () => {
      const widthSchema = v.fallback(v.nullable(v.number()), null)
      expect(new DeviceStore(KEY, widthSchema, AsNumber).state).toBeNull()
      new DeviceStore(KEY, widthSchema, AsNumber).set(320)
      expect(new DeviceStore(KEY, widthSchema, AsNumber).state).toBe(320)
    })

    it('has the fallback where what is stored is no number', () => {
      localStorage.setItem(KEY, 'many')
      expect(new DeviceStore(KEY, decimalsSchema, AsNumber).state).toBe(2)
    })
  })

  // an error in the code, to be seen at once
  it('throws where the value does not lie there as the store was told', () => {
    const asText = new DeviceStore(KEY, v.fallback(v.number(), 2), AsText)
    expect(() => asText.set(5)).toThrow()
    const asNumber = new DeviceStore(KEY, v.fallback(v.boolean(), false), AsNumber)
    expect(() => asNumber.set(true)).toThrow()
  })

  describe('where another tab changes the entry', () => {
    it('follows what was written, and does not write it again', () => {
      const prefs = new DeviceStore(KEY, prefsSchema, AsObject)
      const written = spyOn(localStorage, 'setItem')
      otherTabStores(KEY, '{"decimals":5}')
      expect(prefs.state).toEqual({ decimals: 5 })
      expect(written).not.toHaveBeenCalled()
      written.mockRestore()
    })

    it('has the fallback where the entry was removed, or all of localStorage cleared', () => {
      const prefs = new DeviceStore(KEY, prefsSchema, AsObject)
      prefs.set({ decimals: 3 })
      otherTabStores(KEY, null)
      expect(prefs.state).toEqual({ decimals: 2 })

      prefs.set({ decimals: 3 })
      otherTabStores(null, null)
      expect(prefs.state).toEqual({ decimals: 2 })
    })

    it('leaves alone a change of any other key', () => {
      const prefs = new DeviceStore(KEY, prefsSchema, AsObject)
      prefs.set({ decimals: 3 })
      otherTabStores('gradido-theme-mode', 'dark')
      expect(prefs.state).toEqual({ decimals: 3 })
    })
  })
})
