// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h, ref } from 'vue'
import { provideChatForwardTargets, useChatForwardTargets } from './useChatForwardTargets'
import { CONTACTS_FETCH_MAX } from '@/constants'
import { contactListQuery } from '@/graphql/contacts.graphql'
import { chatGroupsQuery } from '@/graphql/chatGroups.graphql'

/**
 * The contacts and groups a forward dialog chooses from (E-059). Bernd, 01.10.2026: "Weiterleiten"
 * did nothing wherever a conversation was opened outside the contacts page -- only that page held
 * the dialog and its lists. The dialog now stands in the window and finds its lists by itself:
 * the page's where a page hands them down, else asked for at every opening.
 */
const person = (n) => ({ user: { gradidoID: `id-${n}`, alias: `Alias${n}` } })
const group = (n) => ({ groupUuid: `g-${n}`, title: `Gruppe ${n}` })

describe('useChatForwardTargets', () => {
  let wrapper

  /** A dialog reads its targets -- under a page that hands the lists down, or under none. */
  const underPage = (client, page = null) => {
    let targets
    const Dialog = {
      setup() {
        targets = useChatForwardTargets(client)
        return () => h('div')
      },
    }
    const Page = {
      setup() {
        if (page) provideChatForwardTargets(page)
        return () => h(Dialog)
      },
    }
    wrapper = mount(Page)
    return targets
  }

  /** A server that answers each of the two questions as a test says. */
  const server = ({ contacts, groups }) => ({
    query: vi.fn(({ query }) => (query === contactListQuery ? contacts() : groups())),
  })
  const contactsOf = (...people) => ({
    data: { contactList: { count: people.length, contacts: people } },
  })
  const groupsOf = (...groups) => ({ data: { chatGroups: groups } })

  afterEach(() => wrapper?.unmount())

  it('takes the lists of the page that hands them down, and asks the server for none', async () => {
    const client = server({ contacts: vi.fn(), groups: vi.fn() })
    const page = { contacts: ref([person(1), person(2)]), groups: ref([group(1)]) }
    const targets = underPage(client, page)

    await targets.load()

    expect(targets.contacts).toBe(page.contacts)
    expect(targets.groups).toBe(page.groups)
    expect(client.query).not.toHaveBeenCalled()
    expect(targets.loading.value).toBe(false)

    // In step with the page: what it loads next, the dialog sees.
    page.contacts.value = [person(1), person(2), person(3)]
    expect(targets.contacts.value).toHaveLength(3)
  })

  it('takes what the page knows of its lists as well: on their way, or not to be read', async () => {
    const page = {
      contacts: ref([]),
      groups: ref([]),
      loading: ref(true),
      contactsFailed: ref(false),
      groupsFailed: ref(true),
    }
    const targets = underPage(server({ contacts: vi.fn(), groups: vi.fn() }), page)
    await targets.load()
    expect(targets.loading).toBe(page.loading)
    expect(targets.contactsFailed).toBe(page.contactsFailed)
    expect(targets.groupsFailed).toBe(page.groupsFailed)
    // `load` leaves them alone: they are the page's to say.
    expect([targets.loading.value, targets.groupsFailed.value]).toEqual([true, true])
  })

  it('asks for the whole contact list and the groups where no page did, past the store', async () => {
    const client = server({
      contacts: async () => contactsOf(person(1), person(2)),
      groups: async () => groupsOf(group(1)),
    })
    const targets = underPage(client)
    expect(targets.contacts.value).toEqual([])
    expect(targets.groups.value).toEqual([])

    const asked = targets.load()
    expect(targets.loading.value).toBe(true)
    await asked

    expect(client.query.mock.calls.map(([options]) => options)).toEqual([
      {
        query: contactListQuery,
        variables: { currentPage: 1, pageSize: CONTACTS_FETCH_MAX },
        fetchPolicy: 'no-cache',
      },
      { query: chatGroupsQuery, fetchPolicy: 'no-cache' },
    ])
    expect(targets.contacts.value).toEqual([person(1), person(2)])
    expect(targets.groups.value).toEqual([group(1)])
    expect(targets.loading.value).toBe(false)
    expect([targets.contactsFailed.value, targets.groupsFailed.value]).toEqual([false, false])
  })

  it('asks again at every opening', async () => {
    let people = [person(1)]
    const client = server({
      contacts: async () => contactsOf(...people),
      groups: async () => groupsOf(),
    })
    const targets = underPage(client)
    await targets.load()
    people = [person(1), person(2)]
    await targets.load()
    expect(client.query).toHaveBeenCalledTimes(4)
    expect(targets.contacts.value).toHaveLength(2)
  })

  // A failed request is not an empty list: the dialog says which list it could not read.
  it('says which list could not be read, and takes the other', async () => {
    const targets = underPage(
      server({
        contacts: async () => {
          throw new Error('offline')
        },
        groups: async () => groupsOf(group(1)),
      }),
    )
    await targets.load()
    expect([targets.contactsFailed.value, targets.groupsFailed.value]).toEqual([true, false])
    expect(targets.groups.value).toEqual([group(1)])
    expect(targets.loading.value).toBe(false)
    wrapper.unmount()

    const others = underPage(
      server({
        contacts: async () => contactsOf(person(1)),
        groups: async () => ({ data: null }),
      }),
    )
    await others.load()
    expect([others.contactsFailed.value, others.groupsFailed.value]).toEqual([false, true])
    expect(others.contacts.value).toEqual([person(1)])
  })

  it('keeps the last list where asking again fails, and says so until it works again', async () => {
    let online = true
    const client = server({
      contacts: async () => {
        if (!online) throw new Error('offline')
        return contactsOf(person(1))
      },
      groups: async () => groupsOf(group(1)),
    })
    const targets = underPage(client)
    await targets.load()

    online = false
    await targets.load()
    expect(targets.contacts.value).toEqual([person(1)])
    expect(targets.contactsFailed.value).toBe(true)

    online = true
    await targets.load()
    expect(targets.contactsFailed.value).toBe(false)
  })

  it('takes the newest answer only', async () => {
    const answers = []
    const client = server({
      contacts: () => new Promise((resolve) => answers.push(resolve)),
      groups: async () => groupsOf(),
    })
    const targets = underPage(client)
    const first = targets.load()
    const second = targets.load()
    answers[1](contactsOf(person(2)))
    await second
    answers[0](contactsOf(person(1)))
    await first
    await flushPromises()
    expect(targets.contacts.value).toEqual([person(2)])
    expect(targets.loading.value).toBe(false)
  })
})
