import { useApolloClient, useMutation, useQuery } from '@vue/apollo-composable'
import { flushPromises, mount } from '@vue/test-utils'
import { BPagination, BTabs, createBootstrap } from 'bootstrap-vue-next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { useAdminStore } from '@/store/useAdminStore'
import { adminStore } from '../../test/adminStore'
import { adminDeleteContribution } from '../graphql/adminDeleteContribution'
import { adminListContributions } from '../graphql/adminListContributions.graphql'
import { confirmContribution } from '../graphql/confirmContribution'
import { denyContribution } from '../graphql/denyContribution'
import { CreationConfirm } from './CreationConfirm'

vi.mock('@vue/apollo-composable')

// The page asks for the faces of the members it shows, once per answer. The client comes
// from the composable, and the automock above hands back undefined for it -- so it is given
// here, and the fetching itself is mocked away: what it does has its own tests.
const { mockFetchMemberAvatars } = vi.hoisted(() => ({ mockFetchMemberAvatars: vi.fn() }))
vi.mock('@/composables/useMemberAvatars', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchMemberAvatars: mockFetchMemberAvatars,
}))
vi.mock('vue-i18n')
vi.mock('@/composables/useToast')

// Which side of the phone boundary the window is on, set per test. jsdom has no matchMedia, so
// the real composable would answer `unknown` everywhere.
const { viewport } = await vi.hoisted(async () => {
  const { ref } = await import('vue')
  return { viewport: ref('unknown') }
})
vi.mock('@/composables/useViewport', () => ({ useViewport: () => viewport }))

const createAdminStore = () => adminStore({ openCreations: 0 })

// The group filter: what it offers and what it shows, and a way to pick.
const themedSelect = {
  name: 'ThemedSelect',
  props: { modelValue: String, options: Array },
  render() {
    return h('div', { class: 'themed-select-stub' })
  },
}

// The bulk resubmission question: whether it is open, and its OK.
const modal = {
  name: 'BModal',
  props: { modelValue: Boolean },
  emits: ['ok'],
  render() {
    return h('div', { class: 'modal-stub' }, this.$slots.default?.())
  },
}

const stubs = {
  UserQuery: true,
  BButton: true,
  OpenCreationsTable: true,
  DecisionModal: true,
  CreaEvaluationModal: true,
  ThemedSelect: themedSelect,
  BModal: modal,
}

describe('CreationConfirm', () => {
  let wrapper
  let store
  let mockResult
  let mockRefetch
  let mockOnResultCallback
  let mockMutate
  const mockToastError = vi.fn()
  const mockToastSuccess = vi.fn()
  const mockToastWarning = vi.fn()
  const mockT = vi.fn((key) => key)
  const mockD = vi.fn((date) => date.toISOString())

  beforeEach(() => {
    viewport.value = 'unknown'
    store = createAdminStore()
    vi.spyOn(useAdminStore(store), 'setOpenCreations')

    mockResult = ref(null)
    mockRefetch = vi.fn()
    mockOnResultCallback = null

    useApolloClient.mockReturnValue({ client: { query: vi.fn() } })
    useQuery.mockReturnValue({
      onResult: (callback) => {
        mockOnResultCallback = callback
      },
      onError: vi.fn(),
      result: mockResult,
      refetch: mockRefetch,
    })

    mockMutate = vi.fn().mockResolvedValue({})
    useMutation.mockReturnValue({
      mutate: mockMutate,
      onDone: vi.fn(),
      onError: vi.fn(),
    })

    useI18n.mockReturnValue({
      t: mockT,
      d: mockD,
    })

    useAppToast.mockReturnValue({
      toastError: mockToastError,
      toastSuccess: mockToastSuccess,
      toastWarning: mockToastWarning,
    })

    wrapper = mount(CreationConfirm, {
      global: {
        plugins: [store, createBootstrap()],
        stubs,
      },
    })
  })

  const table = () => wrapper.findComponent({ name: 'OpenCreationsTable' })
  const pagination = () => wrapper.findComponent(BPagination)
  const search = () => wrapper.findComponent({ name: 'UserQuery' })
  const groupFilter = (page = wrapper) => page.findComponent({ name: 'ThemedSelect' })
  const bulkModal = () => wrapper.findComponent({ name: 'BModal' })
  // By position: the tabs carry their data-test in `title-link-attributes`, which BTab does not
  // know -- it lands on the tab pane, not on the link.
  const TABS = ['open', 'confirmed', 'denied', 'deleted', 'all']
  const openTab = (name) => wrapper.findAll('.nav-link')[TABS.indexOf(name)].trigger('click')
  // What the page asked the list for when it was set up.
  const firstListQuery = () =>
    useQuery.mock.calls.findLast(([document]) => document === adminListContributions)[1]

  const simulateQueryResult = async (data) => {
    mockResult.value = data
    if (mockOnResultCallback) {
      mockOnResultCallback({ data })
    }
    await nextTick()
  }

  it('initializes with correct default values', () => {
    expect(firstListQuery()).toEqual({
      filter: {
        statusFilter: ['IN_PROGRESS', 'PENDING'],
        query: '',
        hideResubmission: true,
        creationGroup: '',
      },
      paginated: { currentPage: 1, pageSize: 25, order: 'DESC' },
    })
    expect(wrapper.findComponent(BTabs).props('modelValue')).toBe(0)
    expect(pagination().props('modelValue')).toBe(1)
    expect(pagination().props('perPage')).toBe(25)
    expect(search().props('modelValue')).toBe('')
    expect(wrapper.find('input.hideResubmission').element.checked).toBe(true)
  })

  it('updates store and component state when open creations are fetched', async () => {
    const mockData = {
      adminListContributions: {
        contributionCount: 5,
        contributionList: new Array(5).fill({}).map((_, i) => ({ id: i + 1 })),
      },
    }

    await simulateQueryResult(mockData)

    expect(useAdminStore(store).setOpenCreations).toHaveBeenCalledWith(5)
    expect(pagination().props('totalRows')).toBe(5)
    expect(table().props('items')).toEqual(mockData.adminListContributions.contributionList)
  })

  /**
   * ⛔ ONE round trip for the page, with the members whose contributions are on it -- not one
   * per row, and not one per opened thread. Rows without a member (the list can carry them)
   * are left out rather than sent as holes.
   */
  it('asks for the faces of the members on this page', async () => {
    mockFetchMemberAvatars.mockClear()
    const margret = {
      id: 42,
      alias: 'margret',
      gradidoID: 'g-margret',
      communityUuid: 'home',
      avatarUpdatedAt: '2026-09-12T04:00:00.000Z',
    }

    await simulateQueryResult({
      adminListContributions: {
        contributionCount: 2,
        contributionList: [{ id: 1, user: margret }, { id: 2 }],
      },
    })

    expect(mockFetchMemberAvatars).toHaveBeenCalledTimes(1)
    expect(mockFetchMemberAvatars.mock.calls[0][1]).toEqual([margret])
  })

  it('does not update store when not on the open tab', async () => {
    await openTab('confirmed')

    const mockData = {
      adminListContributions: {
        contributionCount: 10,
        contributionList: new Array(10).fill({}).map((_, i) => ({ id: i + 1 })),
      },
    }

    await simulateQueryResult(mockData)

    expect(useAdminStore(store).setOpenCreations).not.toHaveBeenCalledWith(10)
    expect(pagination().props('totalRows')).toBe(10)
    expect(table().props('items')).toEqual(mockData.adminListContributions.contributionList)
  })

  it('refetches data when filters change', async () => {
    await search().vm.$emit('update:modelValue', 'test query')

    expect(mockRefetch).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          query: 'test query',
        }),
      }),
    )

    // The group filter replaced the old "hide #hashtags" switch: it asks which group a
    // contribution belongs to, not whether its text happens to contain a '#'.
    await groupFilter().vm.$emit('update:modelValue', '*untagged')

    expect(mockRefetch).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          creationGroup: '*untagged',
        }),
      }),
    )
  })

  // Bernd, 25.10.2026: the search and the group's choice side by side, the choice without a
  // word before it; each of its texts names the group, "(alle)" became "(mit und ohne Gruppe)".
  it('sets the group beside the search, without a word before it', () => {
    const row = wrapper.find('.creation-filters')
    expect(row.findComponent({ name: 'UserQuery' }).exists()).toBe(true)
    expect(row.findComponent({ name: 'ThemedSelect' }).exists()).toBe(true)
    expect(wrapper.text()).not.toContain('creationGroupFilter.label')
  })

  it('offers all, all groups and no group before the real groups', () => {
    // The real groups follow behind; here the query is mocked away, so only the three
    // fixed entries remain -- which is exactly what this asserts.
    expect(
      groupFilter()
        .props('options')
        .map((option) => option.value),
    ).toEqual(['', '*grouped', '*untagged'])
  })

  // A scoped moderator may only work in their own groups, so the filter offers only those.
  // The backend enforces the boundary; this keeps the dropdown from offering choices that
  // would return nothing (no "all", no "no group", no group outside the scope).
  describe('group filter for a scoped moderator', () => {
    const GROUPS = [
      { tag: 'firefighter', name: 'Feuerwehr' },
      { tag: 'garden', name: 'Garten' },
      { tag: 'other', name: 'Andere' },
    ]

    const mountWithModerator = (moderator) => {
      const scopedStore = adminStore({ openCreations: 0, moderator })
      return mount(CreationConfirm, {
        global: {
          plugins: [scopedStore, createBootstrap()],
          stubs,
        },
      })
    }

    beforeEach(() => {
      // Both queries share the mocked useQuery; this feeds the group list to the dropdown.
      mockResult.value = { creationGroups: GROUPS }
    })

    it('offers only "all my groups" and the moderator\'s own groups', () => {
      const scoped = mountWithModerator({
        role: 'MODERATOR',
        seesAllCreationGroups: false,
        visibleCreationGroups: ['firefighter', 'garden'],
      })
      expect(
        groupFilter(scoped)
          .props('options')
          .map((option) => option.value),
      ).toEqual(['*grouped', 'firefighter', 'garden'])
    })

    it('defaults the selection to "all my groups"', () => {
      const scoped = mountWithModerator({
        role: 'MODERATOR',
        seesAllCreationGroups: false,
        visibleCreationGroups: ['firefighter', 'garden'],
      })
      expect(groupFilter(scoped).props('modelValue')).toBe('*grouped')
    })

    // ⚠️ A session that predates the rename. The whole store is persisted to localStorage and
    // verifyLogin only runs again at /authenticate, so a moderator who was signed in when
    // this deploys still carries the OLD field names in their browser. Reading only the new
    // ones leaves both undefined, and `?? true` then promotes them to the administrator's
    // view: every group in the community offered, and the ones they do not moderate
    // answering with an empty table. This is the test that says the fallback has to stay
    // until no such session can exist any more.
    it('still respects a scope stored under the pre-rename field names', () => {
      const scoped = mountWithModerator({
        role: 'MODERATOR',
        seesAllGroups: false,
        visibleGroupTags: ['firefighter', 'garden'],
      })
      expect(
        groupFilter(scoped)
          .props('options')
          .map((option) => option.value),
      ).toEqual(['*grouped', 'firefighter', 'garden'])
      expect(groupFilter(scoped).props('modelValue')).toBe('*grouped')
    })

    it('offers only "no group" to a moderator scoped to untagged contributions', () => {
      const scoped = mountWithModerator({
        role: 'MODERATOR',
        seesAllCreationGroups: false,
        visibleCreationGroups: [],
      })
      expect(
        groupFilter(scoped)
          .props('options')
          .map((option) => option.value),
      ).toEqual(['*untagged'])
      expect(groupFilter(scoped).props('modelValue')).toBe('*untagged')
    })

    // "No group" is not a group, so it never appears in visibleCreationGroups. Deciding from that
    // list alone would leave this moderator with '*grouped' and their group -- and
    // '*grouped' is the exact complement of "no group", so the ungrouped contributions they
    // are assigned to would have no reachable filter at all.
    it('offers "no group" too when the scope covers the ungrouped contributions', () => {
      const scoped = mountWithModerator({
        role: 'MODERATOR',
        seesAllCreationGroups: false,
        seesUntagged: true,
        visibleCreationGroups: ['firefighter'],
      })
      expect(
        groupFilter(scoped)
          .props('options')
          .map((option) => option.value),
      ).toEqual(['*grouped', '*untagged', 'firefighter'])
    })

    it('leaves an administrator the full set', () => {
      const scoped = mountWithModerator({
        role: 'ADMIN',
        seesAllCreationGroups: true,
        visibleCreationGroups: [],
      })
      expect(
        groupFilter(scoped)
          .props('options')
          .map((option) => option.value),
      ).toEqual(['', '*grouped', '*untagged', 'firefighter', 'garden', 'other'])
    })
  })

  it('updates tabIndex and refetches when changing tabs', async () => {
    // Enough rows for a second page, or the real BPagination clamps it away (see below).
    await simulateQueryResult({
      adminListContributions: { contributionCount: 75, contributionList: openItems(75, 7) },
    })
    await pagination().vm.$emit('update:modelValue', 2)
    expect(pagination().props('modelValue')).toBe(2)

    await openTab('denied')

    expect(pagination().props('modelValue')).toBe(1)
    expect(mockRefetch).toHaveBeenCalledWith(
      expect.objectContaining({
        paginated: expect.objectContaining({
          currentPage: 1,
        }),
        filter: expect.objectContaining({
          statusFilter: ['DENIED'],
        }),
      }),
    )
  })

  it('handles pagination changes', async () => {
    await pagination().vm.$emit('update:modelValue', 2)

    expect(mockRefetch).toHaveBeenCalledWith(
      expect.objectContaining({
        paginated: expect.objectContaining({
          currentPage: 2,
        }),
      }),
    )
  })

  it('starts over at page one when the search narrows the list', async () => {
    // A narrowed list is shorter than the one being looked at, so keeping the page
    // asks for a page the result does not have and the table reads as empty. Both
    // writers of `query` are covered: the search field and the magnifier in the row.
    //
    // The real BPagination is mounted here, and it clamps the page to what the row
    // count allows -- with no result loaded, page 3 would silently become 0. So the
    // list gets enough rows for three pages first.
    await simulateQueryResult({
      adminListContributions: { contributionCount: 75, contributionList: openItems(75, 7) },
    })

    await pagination().vm.$emit('update:modelValue', 3)
    expect(pagination().props('modelValue')).toBe(3)

    await search().vm.$emit('update:modelValue', 'someone@example.org')

    expect(pagination().props('modelValue')).toBe(1)
    expect(mockRefetch).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ query: 'someone@example.org' }),
        paginated: expect.objectContaining({ currentPage: 1 }),
      }),
    )
  })

  const openItems = (count, userId) =>
    Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      userId,
      contributionStatus: 'IN_PROGRESS',
      user: { firstName: 'Anna', lastName: 'Muster' },
    }))

  it('excludes the just-saved contribution from the bulk resubmission loop', async () => {
    await simulateQueryResult({
      adminListContributions: { contributionCount: 3, contributionList: openItems(3, 7) },
    })

    await table().vm.$emit('resubmission-saved', { id: 1, resubmissionAt: '2026-08-01T08:46:00' })
    expect(bulkModal().props('modelValue')).toBe(true)

    mockMutate.mockClear()
    await bulkModal().vm.$emit('ok')
    await flushPromises()

    const ids = mockMutate.mock.calls.map((call) => call[0].id)
    expect(ids).toEqual([2, 3])
    expect(mockToastSuccess).toHaveBeenCalled()
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it('does not offer bulk resubmission for a mixed participant list', async () => {
    await simulateQueryResult({
      adminListContributions: {
        contributionCount: 2,
        contributionList: [...openItems(1, 7), { ...openItems(1, 8)[0], id: 2 }],
      },
    })

    await table().vm.$emit('resubmission-saved', { id: 1, resubmissionAt: '2026-08-01T08:46:00' })
    expect(bulkModal().props('modelValue')).toBe(false)
  })

  it('shows a neutral notice when an unchanged save has no group to propagate to', async () => {
    await simulateQueryResult({
      adminListContributions: { contributionCount: 1, contributionList: openItems(1, 7) },
    })

    await table().vm.$emit('resubmission-saved', {
      id: 1,
      resubmissionAt: '2026-08-01T08:46:00',
      unchanged: true,
    })

    expect(bulkModal().props('modelValue')).toBe(false)
    expect(mockToastWarning).toHaveBeenCalled()
  })

  it('shows a neutral notice for a no-reminder no-op even within a group', async () => {
    await simulateQueryResult({
      adminListContributions: { contributionCount: 3, contributionList: openItems(3, 7) },
    })

    await table().vm.$emit('resubmission-saved', { id: 1, resubmissionAt: null, unchanged: true })

    expect(bulkModal().props('modelValue')).toBe(false)
    expect(mockToastWarning).toHaveBeenCalled()
  })

  // A phone below the boundary where the tables stack, the desk above it. `unknown` -- no
  // matchMedia -- has to behave as the desk.
  describe('on a phone and at the desk', () => {
    const fieldKeys = () =>
      table()
        .props('fields')
        .map((field) => field.key)

    // BTabs draws its tab buttons once its tabs have registered, a tick after mounting.
    const mountAs = async (moderator) => {
      wrapper = mount(CreationConfirm, {
        global: {
          plugins: [adminStore({ openCreations: 0, moderator }), createBootstrap()],
          stubs,
        },
      })
      await nextTick()
    }

    it('on a phone the table gets head, text and actions as its fields', async () => {
      viewport.value = 'mobile'
      await nextTick()
      for (const name of TABS) {
        await openTab(name)
        expect(fieldKeys(), name).toEqual(['phoneHead', 'phoneMemo', 'phoneActions'])
      }
    })

    // The columns of before, tab by tab, held so that the desk cannot change unnoticed: once for
    // a moderator who has no Crea, once for an administrator, who has it on every tab.
    const DESK_WITHOUT_CREA = {
      open: [
        'bookmark',
        'deny',
        'searchUser',
        'name',
        'amount',
        'memo',
        'contributionDate',
        'editCreation',
        'confirm',
      ],
      confirmed: [
        'searchUser',
        'name',
        'amount',
        'memo',
        'contributionDate',
        'createdAt',
        'closedAt',
        'chatCreation',
      ],
      all: [
        'contributionStatus',
        'searchUser',
        'name',
        'amount',
        'memo',
        'contributionDate',
        'createdAt',
        'closedAt',
        'chatCreation',
      ],
    }
    DESK_WITHOUT_CREA.denied = DESK_WITHOUT_CREA.confirmed
    DESK_WITHOUT_CREA.deleted = DESK_WITHOUT_CREA.confirmed

    const withCrea = (keys, before) => {
      const at = keys.indexOf(before)
      return [...keys.slice(0, at), 'creaEvaluate', ...keys.slice(at)]
    }
    const DESK_ADMIN = {
      open: withCrea(DESK_WITHOUT_CREA.open, 'editCreation'),
      confirmed: withCrea(DESK_WITHOUT_CREA.confirmed, 'chatCreation'),
      denied: withCrea(DESK_WITHOUT_CREA.denied, 'chatCreation'),
      deleted: withCrea(DESK_WITHOUT_CREA.deleted, 'chatCreation'),
      all: withCrea(DESK_WITHOUT_CREA.all, 'chatCreation'),
    }

    it.each(['unknown', 'desktop'])(
      'at the desk the fields are the ones of before, tab by tab (%s)',
      async (side) => {
        viewport.value = side
        await nextTick()
        for (const name of TABS) {
          await openTab(name)
          expect(fieldKeys(), name).toEqual(DESK_WITHOUT_CREA[name])
        }

        await mountAs({ role: 'ADMIN' })
        for (const name of TABS) {
          await openTab(name)
          expect(fieldKeys(), name).toEqual(DESK_ADMIN[name])
        }
      },
    )

    // At the desk the page leaves the Crea column out where the tab or the role offers none; a
    // card has no columns and has to be told.
    it('tells the table whether this tab offers Crea to this moderator', async () => {
      expect(table().props('showCrea')).toBe(false)

      await mountAs({ role: 'MODERATOR_AI' })
      const offered = []
      for (const name of TABS) {
        await openTab(name)
        offered.push(table().props('showCrea'))
      }
      expect(offered).toEqual([true, false, false, false, true])

      await mountAs({ role: 'ADMIN' })
      await openTab('denied')
      expect(table().props('showCrea')).toBe(true)
    })

    it('the all tab tells the table to show the status', async () => {
      expect(table().props('showStatus')).toBe(false)
      await openTab('all')
      expect(table().props('showStatus')).toBe(true)
      await openTab('deleted')
      expect(table().props('showStatus')).toBe(false)
    })

    // The real pager, counted by what it draws: names of props are the library's to give.
    it('the pager shows three numbers and no end buttons on a phone, five places and the end buttons at the desk', async () => {
      const drawn = () =>
        pagination()
          .findAll('li')
          .map((item) => item.text())
      await simulateQueryResult({
        adminListContributions: { contributionCount: 300, contributionList: openItems(25, 7) },
      })

      expect(drawn()).toEqual(['«', '‹', '1', '2', '3', '4', '…', '›', '»'])

      viewport.value = 'mobile'
      await nextTick()
      expect(drawn()).toEqual(['‹', '1', '2', '3', '›'])
      // ... and all three stay in sight below 576px, where the library hides one (App.css).
      expect(pagination().classes()).toContain('phone-pager')
    })

    // The word and the number in elements of their own, so a phone can set the symbol above
    // the word and the number at the corner. The symbols take Bootstrap's colours as classes.
    it('each tab title carries its word in a span of its own', async () => {
      useAdminStore(store).$patch({ openCreations: 3 })
      await nextTick()
      // The page's own tabs carry a class of their own: the phone rules for them must not reach
      // the tabs of the form in an opened row.
      expect(wrapper.find('.creation-tabs .nav-tabs').exists()).toBe(true)
      const links = wrapper.findAll('.creation-tabs .nav-link')

      expect(links.map((link) => link.find('.tab-word').text())).toEqual([
        'contributions.open',
        'contributions.confirms',
        'contributions.denied',
        'contributions.deleted',
        'contributions.all',
      ])
      expect(links[0].find('.tab-badge').text()).toBe('3')
      expect(links.map((link) => link.find('svg').classes())).toEqual([
        ['text-primary'],
        ['text-success'],
        ['text-warning'],
        ['text-danger'],
        [],
      ])
      for (const link of links) {
        expect(link.find('svg').attributes('style')).toBeUndefined()
      }
    })

    it('the checkbox has a label that names it', async () => {
      // jsdom fires the box's change only where it hangs in the document.
      wrapper = mount(CreationConfirm, {
        global: { plugins: [store, createBootstrap()], stubs },
        attachTo: document.body,
      })
      const box = wrapper.find('input#hide-resubmission')
      const label = wrapper.find('label[for="hide-resubmission"]')
      expect(label.text()).toBe('hide_resubmission')
      expect(box.element.checked).toBe(true)

      // A tap on the word ticks the box.
      await label.trigger('click')
      expect(box.element.checked).toBe(false)
      expect(mockRefetch).toHaveBeenLastCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ hideResubmission: false }),
        }),
      )
      wrapper.unmount()
    })
  })

  describe('the decision dialog', () => {
    const contribution = { id: 7, amount: '100', memo: 'x', user: { firstName: 'Anna' } }
    const another = { id: 8, amount: '50', memo: 'y', user: { firstName: 'Ben' } }
    const dialog = () => wrapper.findComponent({ name: 'DecisionModal' })

    // The dialog with its slots drawn, and a button that can be pressed.
    const pressable = {
      ...stubs,
      BButton: {
        name: 'BButton',
        render() {
          return h('button', this.$slots.default?.())
        },
      },
      DecisionModal: {
        name: 'DecisionModal',
        props: { modelValue: Boolean, item: Object },
        render() {
          return h('div', { class: 'decision-stub' }, [
            this.$slots.title?.(),
            this.$slots['submit-btn']?.(),
          ])
        },
      },
    }
    const mountPressable = () =>
      mount(CreationConfirm, { global: { plugins: [store, createBootstrap()], stubs: pressable } })
    const press = () => wrapper.find('.decision-stub button').trigger('click')
    const listed = () =>
      table()
        .props('items')
        .map((row) => row.id)

    // Every decision the page sends, held until the test answers it. (The group change still
    // listens through onDone and onError.)
    const answersOnHold = () => {
      const sent = []
      useMutation.mockImplementation((mutation) => ({
        mutate: (variables) =>
          new Promise((resolve, reject) => {
            sent.push({ mutation, variables, resolve, reject })
          }),
        onDone: vi.fn(),
        onError: vi.fn(),
      }))
      return sent
    }
    const withTwoOpen = async () => {
      mockToastSuccess.mockClear()
      mockToastError.mockClear()
      const sent = answersOnHold()
      wrapper = mountPressable()
      await simulateQueryResult({
        adminListContributions: { contributionCount: 2, contributionList: [contribution, another] },
      })
      return sent
    }

    it('confirming opens the decision modal with the contribution and closes it on cancel', async () => {
      expect(dialog().props('modelValue')).toBe(false)

      await table().vm.$emit('show-overlay', contribution, 'confirm')
      expect(dialog().props('modelValue')).toBe(true)
      expect(dialog().props('item')).toEqual(contribution)

      await dialog().vm.$emit('overlay-cancel')
      expect(dialog().props('modelValue')).toBe(false)
    })

    // Escape, the × and the backdrop close it through the v-model.
    it('closes when the dialog says it was closed, and sends nothing', async () => {
      await table().vm.$emit('show-overlay', contribution, 'deny')
      await dialog().vm.$emit('update:modelValue', false)
      expect(dialog().props('modelValue')).toBe(false)
      expect(mockMutate).not.toHaveBeenCalled()
    })

    // The dialog with its slots drawn, and a button that can be pressed: the button of the
    // dialog carries out the decision it was opened for, on the contribution it was opened for.
    it.each([
      ['confirm', confirmContribution],
      ['deny', denyContribution],
      ['delete', adminDeleteContribution],
    ])(
      'the button in the dialog carries out "%s" for its contribution',
      async (decision, document) => {
        const sent = answersOnHold()
        wrapper = mountPressable()

        await table().vm.$emit('show-overlay', contribution, decision)
        await press()

        expect(sent.map(({ mutation, variables }) => [mutation, variables])).toEqual([
          [document, { id: 7 }],
        ])
        expect(wrapper.find('.decision-stub').text()).toContain(`overlay.${decision}.title`)
        // A refusal comes back to the page as an error, whoever else listens for one.
        expect(useMutation).toHaveBeenCalledWith(document, { throws: 'always' })
      },
    )

    /**
     * ⛔ The answer belongs to the contribution the decision was sent for. The dialog can be
     * closed while the answer is on its way, and opened for another contribution; the answer
     * then took THAT one out of the list and closed its dialog, while the decided one stayed.
     */
    it('takes a late answer back to its own contribution, not to the dialog open by then', async () => {
      const sent = await withTwoOpen()
      await table().vm.$emit('show-overlay', contribution, 'confirm')
      await press()
      // Closed while the answer is on its way, and opened for Ben.
      await dialog().vm.$emit('update:modelValue', false)
      await table().vm.$emit('show-overlay', another, 'delete')

      sent[0].resolve({})
      await flushPromises()

      expect(listed()).toEqual([8])
      expect(mockToastSuccess).toHaveBeenCalledWith('creation_form.toasted_created')
      expect(dialog().props('modelValue')).toBe(true)
      expect(dialog().props('item')).toEqual(another)
    })

    it('closes the dialog when the answer comes for the contribution it shows', async () => {
      const sent = await withTwoOpen()
      await table().vm.$emit('show-overlay', contribution, 'deny')
      await press()
      expect(dialog().props('modelValue')).toBe(true)

      sent[0].resolve({})
      await flushPromises()

      expect(listed()).toEqual([8])
      expect(mockToastSuccess).toHaveBeenCalledWith('creation_form.toasted_denied')
      expect(dialog().props('modelValue')).toBe(false)
    })

    it('sends a decision once, however often the button is pressed while it is on its way', async () => {
      const sent = await withTwoOpen()
      await table().vm.$emit('show-overlay', contribution, 'delete')
      await press()
      await press()

      expect(sent).toHaveLength(1)
      sent[0].resolve({})
      await flushPromises()
      expect(listed()).toEqual([8])
      expect(mockToastSuccess.mock.calls).toEqual([['creation_form.toasted_delete']])
    })

    it('keeps a refused contribution, says why, and lets it be decided again', async () => {
      const sent = await withTwoOpen()
      await table().vm.$emit('show-overlay', contribution, 'confirm')
      await press()

      sent[0].reject(new Error('already confirmed'))
      await flushPromises()

      expect(mockToastError).toHaveBeenCalledWith('already confirmed')
      expect(mockToastSuccess).not.toHaveBeenCalled()
      expect(listed()).toEqual([7, 8])
      expect(dialog().props('modelValue')).toBe(false)

      await table().vm.$emit('show-overlay', contribution, 'confirm')
      await press()
      expect(sent).toHaveLength(2)
    })

    it('leaves the dialog of another contribution open when a late answer is a refusal', async () => {
      const sent = await withTwoOpen()
      await table().vm.$emit('show-overlay', contribution, 'confirm')
      await press()
      await dialog().vm.$emit('update:modelValue', false)
      await table().vm.$emit('show-overlay', another, 'deny')

      sent[0].reject(new Error('already confirmed'))
      await flushPromises()

      expect(mockToastError).toHaveBeenCalledWith('already confirmed')
      expect(listed()).toEqual([7, 8])
      expect(dialog().props('modelValue')).toBe(true)
      expect(dialog().props('item')).toEqual(another)
    })
  })
})
