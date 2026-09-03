// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  contactsPanelState,
  ensureContactsPanel,
  forgetContactsPanel,
  holdContactsPanel,
  refreshContactsPanel,
  releaseContactsPanel,
  searchContactsPanel,
} from './useContactsPanel'
import { CONTACTS_PANEL_PAGE_SIZE } from '@/constants'

vi.mock('@/graphql/contacts.graphql', () => ({
  contactListQuery: 'contactListQuery',
  favoriteListQuery: 'favoriteListQuery',
}))

const contact = (n) => ({
  user: { communityUuid: 'home', gradidoID: `id-${n}`, alias: `Alias${n}` },
  firstAt: '2026-07-01T00:00:00.000Z',
  lastAt: '2026-08-30T00:00:00.000Z',
  bookings: n,
  favorite: false,
  homeCommunity: true,
})

const answering = (contacts, count = contacts.length) =>
  vi.fn().mockResolvedValue({ data: { contactList: { contacts, count } } })

const clientOf = (query) => ({ query })

/** A request whose answer this test releases by hand. */
const held = () => {
  const releases = []
  const query = vi.fn().mockImplementation(
    () =>
      new Promise((resolve) => {
        releases.push(resolve)
      }),
  )
  return {
    query,
    release: (contacts, count = contacts.length, at = 0) =>
      releases[at]({ data: { contactList: { contacts, count } } }),
    outstanding: () => releases.length,
  }
}

/** Lets every settled promise chain run out. */
const settle = async () => {
  for (let i = 0; i < 6; i += 1) await Promise.resolve()
}

describe('useContactsPanel', () => {
  beforeEach(() => {
    forgetContactsPanel()
    vi.clearAllMocks()
  })

  it('asks for one page and keeps what the server said', async () => {
    const query = answering([contact(1), contact(2)], 23)
    await ensureContactsPanel(clientOf(query))

    expect(query).toHaveBeenCalledTimes(1)
    // ⛔ The real constant, not a mocked one: a stubbed `@/constants` would compare the
    // expectation against itself and stay green while the panel asked for another size.
    expect(query.mock.calls[0][0].variables).toEqual({
      currentPage: 1,
      pageSize: CONTACTS_PANEL_PAGE_SIZE,
      search: null,
    })
    // ⛔ `no-cache`, not `network-only`: nothing ever reads these answers back, so writing
    // them to the store would leave one copy per search word until logout.
    expect(query.mock.calls[0][0].fetchPolicy).toBe('no-cache')
    expect(contactsPanelState.page.rows).toHaveLength(2)
    // The count is the server's -- how many PEOPLE, not how many rows arrived.
    expect(contactsPanelState.page.count).toBe(23)
    expect(contactsPanelState.page.loaded).toBe(true)
  })

  it('answers a second panel out of the first one request', async () => {
    const query = answering([contact(1)])
    const client = clientOf(query)

    await Promise.all([ensureContactsPanel(client), ensureContactsPanel(client)])
    await ensureContactsPanel(client)

    expect(query).toHaveBeenCalledTimes(1)
  })

  /**
   * ⛔ An answer belongs to the request that owns the slot. Four things can take that
   * ownership away -- a logout, a newer word, a refresh overtaking, the slot being replaced
   * -- and before this they were two separate guards covering two of the four.
   */
  it('lets no older answer overwrite a newer one', async () => {
    const first = answering([contact(1)], 1)
    holdContactsPanel()
    await ensureContactsPanel(clientOf(first))

    const slow = held()
    // A refresh goes out...
    refreshContactsPanel(clientOf(slow.query))
    // ...and a second one overtakes it.
    const fresh = answering([contact(9)], 9)
    await refreshContactsPanel(clientOf(fresh))
    expect(contactsPanelState.page.rows[0].user.gradidoID).toBe('id-9')

    // The overtaken answer lands last and must change nothing.
    slow.release([contact(1)], 1)
    await settle()

    expect(contactsPanelState.page.rows[0].user.gradidoID).toBe('id-9')
    expect(contactsPanelState.page.count).toBe(9)
    releaseContactsPanel()
  })

  /**
   * ⛔ The transfer that used to be lost. With no panel on screen there is nothing to fetch
   * FOR -- but the slot is due now, so the next mount asks. The version that only counted
   * mounted panels dropped it, and the short-circuit then refused to look again for the
   * rest of the session.
   */
  it('does not lose a refresh made while no panel is on screen', async () => {
    const first = answering([contact(1)], 1)
    const client = clientOf(first)
    holdContactsPanel()
    await ensureContactsPanel(client)
    releaseContactsPanel()

    // A transfer while the column stands on bookings: nothing is mounted.
    await refreshContactsPanel(client)
    expect(first).toHaveBeenCalledTimes(1)

    // The next panel to mount picks it up.
    const later = answering([contact(1), contact(2)], 2)
    holdContactsPanel()
    await ensureContactsPanel(clientOf(later))

    expect(later).toHaveBeenCalledTimes(1)
    expect(contactsPanelState.page.rows).toHaveLength(2)
    releaseContactsPanel()
  })

  it('fetches at once when a panel is watching', async () => {
    const query = answering([contact(1)])
    const client = clientOf(query)
    holdContactsPanel()
    await ensureContactsPanel(client)
    query.mockClear()

    await refreshContactsPanel(client)

    expect(query).toHaveBeenCalledTimes(1)
    releaseContactsPanel()
  })

  it('says it failed, and lets the next panel try again', async () => {
    const failing = vi.fn().mockRejectedValue(new Error('offline'))
    await ensureContactsPanel(clientOf(failing))

    expect(contactsPanelState.page.loaded).toBe(true)
    expect(contactsPanelState.page.failed).toBe(true)

    const query = answering([contact(1)])
    await ensureContactsPanel(clientOf(query))

    expect(query).toHaveBeenCalledTimes(1)
    expect(contactsPanelState.page.failed).toBe(false)
  })

  it('keeps a working list when a refresh fails', async () => {
    const client = clientOf(answering([contact(1), contact(2)], 2))
    holdContactsPanel()
    await ensureContactsPanel(client)

    await refreshContactsPanel(clientOf(vi.fn().mockRejectedValue(new Error('blip'))))

    expect(contactsPanelState.page.rows).toHaveLength(2)
    expect(contactsPanelState.page.failed).toBe(false)
    releaseContactsPanel()
  })

  it('asks the server for a search rather than filtering the page it holds', async () => {
    const query = answering([contact(1)])
    const client = clientOf(query)
    await ensureContactsPanel(client)

    await searchContactsPanel(client, 'car')

    expect(query).toHaveBeenCalledTimes(2)
    expect(query.mock.calls[1][0].variables.search).toBe('car')
  })

  /**
   * ⛔ TWO slots. The strip on the phone has no search box, so a word typed in the column
   * must not reach it.
   */
  it('leaves the page untouched by a search', async () => {
    const client = clientOf(
      vi
        .fn()
        .mockResolvedValueOnce({
          data: { contactList: { contacts: [contact(1), contact(2)], count: 2 } },
        })
        .mockResolvedValue({ data: { contactList: { contacts: [contact(2)], count: 1 } } }),
    )
    await ensureContactsPanel(client)
    await searchContactsPanel(client, 'Alias2')

    expect(contactsPanelState.page.rows).toHaveLength(2)
    expect(contactsPanelState.page.count).toBe(2)
    expect(contactsPanelState.matches.rows).toHaveLength(1)
  })

  it('clears the search without asking the server anything', async () => {
    const query = answering([contact(1)])
    const client = clientOf(query)
    await ensureContactsPanel(client)
    await searchContactsPanel(client, 'car')
    query.mockClear()

    await searchContactsPanel(client, '')

    expect(query).not.toHaveBeenCalled()
    expect(contactsPanelState.search).toBe('')
    expect(contactsPanelState.matches.loaded).toBe(false)
  })

  /**
   * ⛔ An answer for a word that is no longer typed changes nothing a member can see.
   *
   * ⚠️ What this holds is the OUTCOME, not the mechanism: the slot is replaced when the box
   * is cleared, so the settling request writes into an object nothing references. The
   * `owner.matches = null` beside that reset is defensive -- removing it fails no test, and
   * the comment there says so rather than claiming a rescue.
   */
  it('does not let an answer land in a slot that was cleared under it', async () => {
    const slow = held()
    const client = clientOf(slow.query)
    searchContactsPanel(client, 'car')
    await searchContactsPanel(client, '')

    slow.release([contact(1)], 1)
    await settle()

    // Nothing arrived anywhere, and no spinner is left waiting on it.
    expect(contactsPanelState.matches.rows).toEqual([])
    expect(contactsPanelState.matches.loaded).toBe(false)
    expect(contactsPanelState.search).toBe('')
  })

  /**
   * ⛔ `failed` and staleness are part of the short-circuit. Without them a search that
   * failed could never be retried from the box that produced it: the member retypes the
   * same word and the error banner stands for the rest of the session.
   */
  it('lets the same word be searched again after it failed', async () => {
    const failing = vi.fn().mockRejectedValue(new Error('offline'))
    await searchContactsPanel(clientOf(failing), 'car')
    expect(contactsPanelState.matches.failed).toBe(true)

    const query = answering([contact(1)])
    await searchContactsPanel(clientOf(query), 'car')

    expect(query).toHaveBeenCalledTimes(1)
    expect(contactsPanelState.matches.failed).toBe(false)
  })

  /**
   * ⛔ And a remount retries it too. The box already holds the word, so it never changes
   * and the debounce never fires -- flicking the switch away and back, which is the gesture
   * members actually make, was not a retry before this.
   */
  it('retries a failed search when a panel mounts again', async () => {
    const failing = vi.fn().mockRejectedValue(new Error('offline'))
    await searchContactsPanel(clientOf(failing), 'car')

    const query = answering([contact(1)])
    await ensureContactsPanel(clientOf(query))

    expect(query.mock.calls.map((call) => call[0].variables.search)).toContain('car')
    expect(contactsPanelState.matches.failed).toBe(false)
  })

  it('forgets everything on logout', async () => {
    const client = clientOf(answering([contact(1)], 5))
    holdContactsPanel()
    await searchContactsPanel(client, 'car')

    forgetContactsPanel()

    expect(contactsPanelState.page.rows).toEqual([])
    expect(contactsPanelState.matches.rows).toEqual([])
    expect(contactsPanelState.page.loaded).toBe(false)
    expect(contactsPanelState.search).toBe('')
  })

  it('drops an answer that arrives after the member signed out', async () => {
    const slow = held()
    const pending = ensureContactsPanel(clientOf(slow.query))

    forgetContactsPanel()
    slow.release([contact(1)], 1)
    await pending
    await settle()

    expect(contactsPanelState.page.rows).toEqual([])
    expect(contactsPanelState.page.loaded).toBe(false)
  })
})
