// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { actions } from './store'
import { chatDraftFor, forgetChatDrafts } from '@/utils/chatDraft'

vi.mock('../i18n', () => ({
  default: {
    global: {
      locale: {
        value: 'en',
      },
    },
  },
}))

/**
 * The store's sign-in and sign-out and the words written in a conversation and not sent
 * (utils/chatDraft), run together. Each has a spec of its own with the other replaced, so what the
 * one hands the other -- who signs out, and whether by their own word -- is held there by a name
 * on each side. Here the two meet.
 */
describe('the store and what was written in a conversation and not sent', () => {
  const NOW = new Date('2026-10-11T16:00:00Z').getTime()
  const DAY = 24 * 60 * 60 * 1000
  const THREAD = 'home-uuid/lena-id'
  const onDevice = (member = 'user-one') =>
    JSON.parse(window.localStorage.getItem(`chat-drafts:${member}`))
  /** A store as its actions see it: who is signed in, and commits that sign them out. */
  const wallet = (signedIn = 'user-one') => {
    const state = { themeMode: 'dark', gradidoID: signedIn }
    const commit = vi.fn((mutation, value) => {
      if (mutation === 'gradidoID') state.gradidoID = value
    })
    return { state, commit, dispatch: vi.fn() }
  }
  const draftIn = (store) => chatDraftFor(() => store.state.gradidoID, THREAD)
  const picture = () => ({ source: { image: { name: 'photo' } }, edit: { turns: 0 } })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    forgetChatDrafts()
    window.localStorage.clear()
    vi.useRealTimers()
  })

  it('takes the member’s words off the device where they said "Abmelden"', async () => {
    const store = wallet()
    draftIn(store).keep({ text: 'Bis Samstag' })
    expect(onDevice()[THREAD].text).toBe('Bis Samstag')

    // As DashboardLayout tells it: the member's own word, and who said it.
    await actions.logout(store, { byOwnWord: true, member: 'user-one' })

    expect(store.state.gradidoID).toBeNull()
    expect(onDevice()).toBeNull()
  })

  it.each([
    ['the session ran out', { byOwnWord: false, member: 'user-one' }],
    ['nothing is said of the sign-out', undefined],
  ])('leaves them there where %s, and forgets the picture that waited', async (_, how) => {
    const store = wallet()
    draftIn(store).keep({ text: 'Bis Samstag', picture: picture() })

    await actions.logout(store, how)

    expect(onDevice()[THREAD].text).toBe('Bis Samstag')
    // The member signs in again and opens the conversation.
    store.state.gradidoID = 'user-one'
    expect(draftIn(store).read()).toEqual({
      text: 'Bis Samstag',
      picture: null,
      alsoByEmail: null,
    })
  })

  // The layout asks the server before it tells the store. The session's clock ended the session
  // meanwhile: its sign-out came first and left the words, the member's own word comes second.
  it('takes the words of who said "Abmelden", though another sign-out cleared the store first', async () => {
    const store = wallet()
    draftIn(store).keep({ text: 'Bis Samstag' })

    await actions.logout(store, { byOwnWord: false, member: 'user-one' })
    expect(onDevice()[THREAD].text).toBe('Bis Samstag')
    await actions.logout(store, { byOwnWord: true, member: 'user-one' })

    expect(onDevice()).toBeNull()
  })

  it('lets go of words nobody touched for fourteen days with a sign-in, whoever wrote them', () => {
    window.localStorage.setItem(
      'chat-drafts:long-gone',
      JSON.stringify({ [THREAD]: { text: 'sehr alt', at: NOW - 15 * DAY } }),
    )
    window.localStorage.setItem(
      'chat-drafts:user-two',
      JSON.stringify({ [THREAD]: { text: 'jung', at: NOW - DAY } }),
    )

    actions.login(wallet(null), { gradidoID: 'user-one', klickTipp: {} })

    expect(onDevice('long-gone')).toBeNull()
    expect(onDevice('user-two')[THREAD].text).toBe('jung')
  })
})
