// AI-GENERATED — not an architecture reference
import { mock } from 'bun:test'

// As much of a browser as DeviceStore and Session ask for. A test imports this before them:
// both read localStorage and listen to the window as soon as they are loaded.
const stored = new Map<string, string>()
const tab = new EventTarget()
export const location = { reload: mock(), assign: mock() }
Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
    removeItem: (key: string) => stored.delete(key),
    clear: () => stored.clear(),
  },
  location,
  window: tab,
})

/**
 * What the browser does where another tab of the origin writes `item` under `key`, removes the
 * entry (`item` null) or clears all of localStorage (`key` null).
 */
export function otherTabStores(key: string | null, item: string | null) {
  if (key === null) {
    stored.clear()
  } else if (item === null) {
    stored.delete(key)
  } else {
    stored.set(key, item)
  }
  tab.dispatchEvent(Object.assign(new Event('storage'), { key, newValue: item }))
}
