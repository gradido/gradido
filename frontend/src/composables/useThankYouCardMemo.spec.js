// AI-GENERATED — not an architecture reference
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useThankYouCardMemo } from './useThankYouCardMemo'

const state = { gradidoID: null }
vi.mock('vuex', () => ({ useStore: () => ({ state }) }))

describe('useThankYouCardMemo', () => {
  beforeEach(() => {
    window.localStorage.clear()
    state.gradidoID = 'member-one'
  })

  it('gives back what was remembered on this device', () => {
    const { readRememberedMemo, writeRememberedMemo } = useThankYouCardMemo()

    writeRememberedMemo('Pizzeria Napoli')

    expect(readRememberedMemo()).toBe('Pizzeria Napoli')
  })

  // ⛔ The one that matters on a shared till. "Remembered nothing" and "show nothing" are not
  // the same thing, and if they were allowed to blur, the next person to sign in on the same
  // tablet would find the previous shop's wording sitting in their field.
  it('shows nothing to the next member on the same device', () => {
    const first = useThankYouCardMemo()
    first.writeRememberedMemo('Pizzeria Napoli')

    state.gradidoID = 'member-two'
    const second = useThankYouCardMemo()

    expect(second.readRememberedMemo()).toBe('')
  })

  it('remembers nothing at all while nobody is signed in', () => {
    state.gradidoID = null
    const { readRememberedMemo, writeRememberedMemo } = useThankYouCardMemo()

    writeRememberedMemo('Pizzeria Napoli')

    expect(readRememberedMemo()).toBe('')
    expect(window.localStorage.length).toBe(0)
  })

  it('forgets when the field is cleared', () => {
    const { readRememberedMemo, writeRememberedMemo } = useThankYouCardMemo()
    writeRememberedMemo('Pizzeria Napoli')

    writeRememberedMemo('')

    expect(readRememberedMemo()).toBe('')
  })

  it('survives a browser with storage switched off', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    const { readRememberedMemo, writeRememberedMemo } = useThankYouCardMemo()

    expect(() => writeRememberedMemo('Pizzeria Napoli')).not.toThrow()
    expect(readRememberedMemo()).toBe('')

    getItem.mockRestore()
    setItem.mockRestore()
  })
})
