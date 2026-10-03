// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach } from 'vitest'
import {
  firstLoginWindow,
  firstLoginWindowOnScreen,
  forgetFirstLoginWindows,
  setFirstLoginWindowWanted,
} from './useFirstLoginWindow'

/**
 * Which of the windows of the first logins has the screen: one at a time, in a fixed order --
 * and none of them while the conversation an address opened is on screen (ZE-017 F5).
 * AliasFirstChoice.spec.js and FirstCreation.spec.js hold what each window does with it.
 */
describe('useFirstLoginWindow', () => {
  const wants = (...names) => names.forEach((name) => setFirstLoginWindowWanted(name, true))

  beforeEach(() => {
    forgetFirstLoginWindows()
  })

  it('shows none where none would show', () => {
    expect(firstLoginWindow.value).toBeNull()
  })

  it('shows one at a time, in the order address, name, first creation', () => {
    wants('firstCreation', 'alias', 'email')

    expect(firstLoginWindow.value).toBe('email')

    setFirstLoginWindowWanted('email', false)
    expect(firstLoginWindow.value).toBe('alias')

    setFirstLoginWindowWanted('alias', false)
    expect(firstLoginWindow.value).toBe('firstCreation')

    setFirstLoginWindowWanted('firstCreation', false)
    expect(firstLoginWindow.value).toBeNull()
  })

  // The conversation is none of the three and binds to nothing here. It takes part in the
  // same rule, so "only one at a time" stands in one line.
  it('shows none of the three while the conversation an address opened is on screen', () => {
    const onScreen = ['email', 'alias', 'firstCreation'].map(firstLoginWindowOnScreen)
    wants('email', 'alias', 'firstCreation')
    expect(onScreen.map((window) => window.value)).toEqual([true, false, false])

    wants('contact')

    expect(firstLoginWindow.value).toBe('contact')
    expect(onScreen.map((window) => window.value)).toEqual([false, false, false])
  })

  it('lets the three come in their order once the conversation is closed', () => {
    wants('contact', 'alias', 'email')

    setFirstLoginWindowWanted('contact', false)

    expect(firstLoginWindow.value).toBe('email')
    expect(firstLoginWindowOnScreen('email').value).toBe(true)
    expect(firstLoginWindowOnScreen('alias').value).toBe(false)
  })

  it('takes the screen from a window that had it', () => {
    const email = firstLoginWindowOnScreen('email')
    wants('email')
    expect(email.value).toBe(true)

    wants('contact')

    expect(email.value).toBe(false)
  })

  // Logging out does not reload the page: the next member on this browser meets their own.
  it('forgets all four on logout', () => {
    wants('contact', 'email', 'alias', 'firstCreation')

    forgetFirstLoginWindows()

    expect(firstLoginWindow.value).toBeNull()
    wants('alias')
    expect(firstLoginWindow.value).toBe('alias')
  })
})
