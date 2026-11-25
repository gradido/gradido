// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, reactive } from 'vue'

const { showAppBadge } = vi.hoisted(() => ({ showAppBadge: vi.fn() }))
vi.mock('@/utils/appBadge', async (importOriginal) => ({
  ...(await importOriginal()),
  showAppBadge,
}))

/** Fresh modules per test: the numbers live in the composables the beat writes into. */
const load = async () => {
  vi.resetModules()
  const badge = await import('./useAppBadge')
  const chat = await import('./useChatUpdates')
  const support = await import('./useSupportTicketsMenu')
  const contributions = await import('./useContributionsInProgress')
  const moderation = await import('./useModerationWaiting')
  return { ...badge, ...chat, ...support, ...contributions, ...moderation }
}

/** An answer of the beat, as useChatUpdates hands it on. */
const give = (m, { support = 0, contributions = 0, creations = 0, tickets = 0 } = {}) => {
  m.setSupportTicketsMenu({ active: true, inProgress: support, unfinished: support })
  m.setContributionsInProgress(contributions)
  m.setModerationWaiting({ creations, supportTickets: tickets })
}

describe('useAppBadge', () => {
  let store

  beforeEach(() => {
    showAppBadge.mockClear()
    store = reactive({ creationAllowed: true, role: 'MODERATOR' })
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('adds up the numbers of the menu', async () => {
    const m = await load()
    give(m, { support: 1, contributions: 2, creations: 3, tickets: 4 })
    expect(m.appBadgeCount(store)).toBe(10)
  })

  it('counts the conversations with something unread, as the beat brings them', async () => {
    const m = await load()
    const query = vi.fn(async () => ({
      data: {
        newChatMessagesSince: { latestId: 1, unreadConversations: 4, messages: [], hasMore: false },
      },
    }))
    m.startChatUpdates({ query })
    try {
      await vi.waitFor(() => expect(m.chatUnreadConversations.value).toBe(4))
      give(m, { support: 1 })
      expect(m.appBadgeCount(store)).toBe(5)
    } finally {
      m.stopChatUpdates()
    }
  })

  it('leaves "Schöpfen" out for a project account, as the menu does', async () => {
    const m = await load()
    give(m, { support: 1, contributions: 2 })
    store.creationAllowed = false
    expect(m.appBadgeCount(store)).toBe(1)
    // not known is a person, as the menu reads it
    store.creationAllowed = null
    expect(m.appBadgeCount(store)).toBe(3)
  })

  it('leaves the numbers at "Admin" out without a role, as the menu does', async () => {
    const m = await load()
    give(m, { support: 1, creations: 2, tickets: 3 })
    store.role = null
    expect(m.appBadgeCount(store)).toBe(1)
  })

  it('takes a stale number off the icon at the start, and follows every answer', async () => {
    const m = await load()
    const layout = effectScope()
    layout.run(() => m.useAppBadge(store))
    expect(showAppBadge).toHaveBeenLastCalledWith(0, undefined, expect.any(Function))

    give(m, { support: 1, creations: 2 })
    await nextTick()
    expect(showAppBadge).toHaveBeenLastCalledWith(3, 0, expect.any(Function))

    give(m, { support: 0, creations: 2 })
    await nextTick()
    expect(showAppBadge).toHaveBeenLastCalledWith(2, 3, expect.any(Function))
    layout.stop()
  })
})
