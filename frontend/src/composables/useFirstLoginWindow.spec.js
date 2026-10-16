// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach } from 'vitest'
import {
  firstLoginWindow,
  firstLoginWindowOnScreen,
  forgetFirstLoginWindows,
  setFirstLoginWindowUndecided,
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
    // No invitation onto the map in this session: then the first creation follows the name.
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
  it('forgets all five on logout', () => {
    wants('contact', 'email', 'alias', 'home', 'firstCreation')

    forgetFirstLoginWindows()

    expect(firstLoginWindow.value).toBeNull()
    wants('alias')
    expect(firstLoginWindow.value).toBe('alias')
  })

  /**
   * The invitation onto the map after an event link (KA-015): right after the name, before the
   * first creation -- and once it was due, the first creation waits for the next start.
   */
  describe('the invitation onto the map', () => {
    it('comes after the address and the name, and before the first creation', () => {
      wants('firstCreation', 'home', 'alias', 'email')

      expect(firstLoginWindow.value).toBe('email')
      setFirstLoginWindowWanted('email', false)
      expect(firstLoginWindow.value).toBe('alias')
      setFirstLoginWindowWanted('alias', false)
      expect(firstLoginWindow.value).toBe('home')
      expect(firstLoginWindowOnScreen('home').value).toBe(true)
      expect(firstLoginWindowOnScreen('firstCreation').value).toBe(false)
    })

    it('waits behind the conversation an address opened, like the others', () => {
      wants('contact', 'home')

      expect(firstLoginWindow.value).toBe('contact')
      setFirstLoginWindowWanted('contact', false)
      expect(firstLoginWindow.value).toBe('home')
    })

    // "Erst beim nächsten Neustart": answered or not, the first creation does not come in the
    // session the invitation was due in.
    it('lets the first creation wait for the rest of the session once it was due', () => {
      wants('home', 'firstCreation')
      expect(firstLoginWindow.value).toBe('home')

      // "Later", or "show me on the map": the invitation is done.
      setFirstLoginWindowWanted('home', false)

      expect(firstLoginWindow.value).toBeNull()
      expect(firstLoginWindowOnScreen('firstCreation').value).toBe(false)
    })

    it('holds the first creation back also where it was wanted before the invitation came', () => {
      wants('firstCreation')
      expect(firstLoginWindow.value).toBe('firstCreation')

      wants('home')
      setFirstLoginWindowWanted('home', false)

      expect(firstLoginWindow.value).toBeNull()
    })

    it('holds nothing before it: the address and the name still come', () => {
      wants('home')
      setFirstLoginWindowWanted('home', false)

      wants('email', 'alias')

      expect(firstLoginWindow.value).toBe('email')
      setFirstLoginWindowWanted('email', false)
      expect(firstLoginWindow.value).toBe('alias')
    })

    // The next start is a new sign-in, or the page loaded anew -- this module then starts empty.
    it('lets the first creation come again after the logout', () => {
      wants('home')
      setFirstLoginWindowWanted('home', false)

      forgetFirstLoginWindows()
      wants('firstCreation')

      expect(firstLoginWindow.value).toBe('firstCreation')
    })

    it('lets the first creation come in a session in which the invitation was never due', () => {
      setFirstLoginWindowWanted('home', false)
      wants('firstCreation')

      expect(firstLoginWindow.value).toBe('firstCreation')
    })

    /**
     * While its answer is on its way, nobody knows whether the invitation comes: the windows
     * after it wait, so that the first creation does not flash in and away. The ones before it
     * come first anyway.
     */
    describe('while it cannot say yet', () => {
      it('gives the screen to none of the windows after it', () => {
        wants('firstCreation')
        setFirstLoginWindowUndecided('home', true)

        expect(firstLoginWindow.value).toBeNull()
        expect(firstLoginWindowOnScreen('firstCreation').value).toBe(false)
      })

      it('lets the first creation come once the answer says "nobody to invite"', () => {
        wants('firstCreation')
        setFirstLoginWindowUndecided('home', true)

        setFirstLoginWindowUndecided('home', false)

        expect(firstLoginWindow.value).toBe('firstCreation')
      })

      it('holds back none of the windows before it', () => {
        wants('email', 'alias', 'firstCreation')
        setFirstLoginWindowUndecided('home', true)

        expect(firstLoginWindow.value).toBe('email')
        setFirstLoginWindowWanted('email', false)
        expect(firstLoginWindow.value).toBe('alias')
        setFirstLoginWindowWanted('alias', false)
        expect(firstLoginWindow.value).toBeNull()
      })

      it('is forgotten on logout', () => {
        setFirstLoginWindowUndecided('home', true)

        forgetFirstLoginWindows()
        wants('firstCreation')

        expect(firstLoginWindow.value).toBe('firstCreation')
      })
    })
  })
})
