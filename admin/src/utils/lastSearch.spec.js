// AI-GENERATED — not an architecture reference

import { afterEach, describe, expect, it, vi } from 'vitest'
import { keepLastSearch, keepLastTab, lastSearch, lastTab } from './lastSearch'

describe('the last search of a page', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
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
    expect(window.localStorage.length).toBe(0)
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
    expect(window.localStorage.getItem('gradido-admin-last-search')).not.toContain('#tab')
    expect(lastSearch('/creation-confirm', 'moderator-gid')).toBe('bibi')
  })

  it('takes no tab the page does not have', () => {
    for (const tab of [7, 5, -1, 2.5, '2']) {
      window.localStorage.setItem(
        'gradido-admin-last-search',
        JSON.stringify({ 'moderator-gid': { '/creation-confirm#tab': tab } }),
      )
      expect(lastTab('/creation-confirm', 'moderator-gid', 5)).toBe(0)
    }
  })

  it('does not trip over a storage that refuses or holds something else', () => {
    window.localStorage.setItem('gradido-admin-last-search', 'no json')
    expect(lastSearch('/user', 'moderator-gid')).toBe('')
    window.localStorage.setItem('gradido-admin-last-search', '{"moderator-gid":{"/user":7}}')
    expect(lastSearch('/user', 'moderator-gid')).toBe('')

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(() => keepLastSearch('/user', 'moderator-gid', 'peter')).not.toThrow()
    expect(lastSearch('/user', 'moderator-gid')).toBe('')
  })
})
