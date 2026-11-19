// AI-GENERATED — not an architecture reference

import { afterAll, afterEach, describe, expect, it } from 'bun:test'
import { keepLastSearch, keepLastTab, lastSearch, lastTab } from './lastSearch'

// no browser here: a localStorage of the test's own, which keeps what it is given or refuses
const items = new Map<string, string>()
let refuses = false
const refuse = (): never => {
  throw new Error('SecurityError')
}
const localStorage = {
  get length() {
    return items.size
  },
  getItem: (key: string) => (refuses ? refuse() : (items.get(key) ?? null)),
  setItem: (key: string, value: string) => (refuses ? refuse() : items.set(key, value)),
}
Object.assign(globalThis, { window: { localStorage } })
// taken out again: a library asked later (sass) takes a `window` for a browser
afterAll(() => {
  Reflect.deleteProperty(globalThis, 'window')
})

describe('the last search of a page', () => {
  afterEach(() => {
    refuses = false
    items.clear()
  })

  it('is kept for its page, and stays: it is read as often as the page opens', () => {
    keepLastSearch('/creation-confirm', 'moderator-gid', 'bibi@bloxberg.de')
    keepLastSearch('/user', 'moderator-gid', 'peter')
    expect(lastSearch('/creation-confirm', 'moderator-gid')).toBe('bibi@bloxberg.de')
    expect(lastSearch('/creation-confirm', 'moderator-gid')).toBe('bibi@bloxberg.de')
    expect(lastSearch('/user', 'moderator-gid')).toBe('peter')
  })

  it('is the last one: a later search takes its place, an empty one leaves none', () => {
    keepLastSearch('/user', 'moderator-gid', 'peter')
    keepLastSearch('/user', 'moderator-gid', 'bibi')
    expect(lastSearch('/user', 'moderator-gid')).toBe('bibi')
    keepLastSearch('/user', 'moderator-gid', '')
    expect(lastSearch('/user', 'moderator-gid')).toBe('')
  })

  // The same browser is used by more than one moderator.
  it('is each moderator’s own', () => {
    keepLastSearch('/user', 'moderator-gid', 'peter')
    keepLastSearch('/user', 'someone-else', 'bibi')
    expect(lastSearch('/user', 'moderator-gid')).toBe('peter')
    expect(lastSearch('/user', 'someone-else')).toBe('bibi')
    expect(lastSearch('/user', undefined)).toBe('')
  })

  it('is kept for nobody where no moderator is known', () => {
    keepLastSearch('/user', undefined, 'peter')
    expect(localStorage.length).toBe(0)
  })

  // Bernd, 26.10.2026: "merk Dir auch den Reiter, so wie die Suche".
  it('keeps the tab of a page beside its search, the first tab as none', () => {
    keepLastTab('/creation-confirm', 'moderator-gid', 3)
    keepLastSearch('/creation-confirm', 'moderator-gid', 'bibi')
    expect(lastTab('/creation-confirm', 'moderator-gid', 5)).toBe(3)
    expect(lastSearch('/creation-confirm', 'moderator-gid')).toBe('bibi')
    expect(lastTab('/creation-confirm', 'someone-else', 5)).toBe(0)
    keepLastTab('/creation-confirm', 'moderator-gid', 0)
    expect(lastTab('/creation-confirm', 'moderator-gid', 5)).toBe(0)
    expect(localStorage.getItem('gradido-admin-last-search')).not.toContain('#tab')
    expect(lastSearch('/creation-confirm', 'moderator-gid')).toBe('bibi')
  })

  it('takes no tab the page does not have', () => {
    for (const tab of [7, 5, -1, 2.5, '2']) {
      localStorage.setItem(
        'gradido-admin-last-search',
        JSON.stringify({ 'moderator-gid': { '/creation-confirm#tab': tab } }),
      )
      expect(lastTab('/creation-confirm', 'moderator-gid', 5)).toBe(0)
    }
  })

  it('does not trip over a storage that refuses or holds something else', () => {
    localStorage.setItem('gradido-admin-last-search', 'no json')
    expect(lastSearch('/user', 'moderator-gid')).toBe('')
    localStorage.setItem('gradido-admin-last-search', '{"moderator-gid":{"/user":7}}')
    expect(lastSearch('/user', 'moderator-gid')).toBe('')

    refuses = true
    expect(() => keepLastSearch('/user', 'moderator-gid', 'peter')).not.toThrow()
    expect(lastSearch('/user', 'moderator-gid')).toBe('')
  })
})
