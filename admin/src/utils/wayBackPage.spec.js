// AI-GENERATED — not an architecture reference

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  forgetWayBackSearch,
  keepWayBackSearch,
  takeWayBackSearch,
  WAY_BACK_SEARCH_MS,
} from './wayBackPage'

describe('the search kept for the way back', () => {
  const PAGE = '/creation-confirm'

  afterEach(() => {
    vi.restoreAllMocks()
    forgetWayBackSearch()
  })

  it('is taken once, by its page, for its moderator', () => {
    keepWayBackSearch({ page: PAGE, search: 'bibi@bloxberg.de' }, 'moderator-gid', 1000)
    expect(takeWayBackSearch(PAGE, 'moderator-gid', 2000)).toBe('bibi@bloxberg.de')
    expect(takeWayBackSearch(PAGE, 'moderator-gid', 2000)).toBeNull()
  })

  it('stays for its page where another page asks', () => {
    keepWayBackSearch({ page: PAGE, search: 'bibi' }, 'moderator-gid', 1000)
    expect(takeWayBackSearch('/user', 'moderator-gid', 2000)).toBeNull()
    expect(takeWayBackSearch(PAGE, 'moderator-gid', 2000)).toBe('bibi')
  })

  // The same browser is used by more than one moderator.
  it('is nobody else’s: another moderator gets nothing, and it is gone', () => {
    keepWayBackSearch({ page: PAGE, search: 'bibi' }, 'moderator-gid', 1000)
    expect(takeWayBackSearch(PAGE, 'someone-else', 2000)).toBeNull()
    expect(takeWayBackSearch(PAGE, 'moderator-gid', 2000)).toBeNull()
  })

  it('waits for the way back half an hour, and no longer', () => {
    keepWayBackSearch({ page: PAGE, search: 'bibi' }, 'moderator-gid', 0)
    expect(takeWayBackSearch(PAGE, 'moderator-gid', WAY_BACK_SEARCH_MS + 1)).toBeNull()
  })

  it('keeps nothing without a search or a moderator, and forgets an older search', () => {
    keepWayBackSearch({ page: PAGE, search: 'bibi' }, 'moderator-gid', 1000)
    keepWayBackSearch({ page: PAGE, search: '' }, 'moderator-gid', 1500)
    expect(takeWayBackSearch(PAGE, 'moderator-gid', 2000)).toBeNull()

    keepWayBackSearch({ page: PAGE, search: 'bibi' }, undefined, 1000)
    expect(takeWayBackSearch(PAGE, undefined, 2000)).toBeNull()
  })

  it('is forgotten', () => {
    keepWayBackSearch({ page: PAGE, search: 'bibi' }, 'moderator-gid', 1000)
    forgetWayBackSearch()
    expect(takeWayBackSearch(PAGE, 'moderator-gid', 2000)).toBeNull()
  })

  it('does not trip over a storage that refuses', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(() => keepWayBackSearch({ page: PAGE, search: 'bibi' }, 'moderator-gid')).not.toThrow()
    expect(takeWayBackSearch(PAGE, 'moderator-gid')).toBeNull()
  })
})
