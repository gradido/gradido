// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import Overview from './Overview.vue'
import { adminListContributionsCount } from '@/graphql/adminListContributions.graphql'
import { communityFigures } from '@/graphql/communityFigures.graphql'
import { communityStatistics } from '@/graphql/communityStatistics'
import { useQuery } from '@vue/apollo-composable'
import { createStore } from 'vuex'
import { useAppToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'

vi.mock('@vue/apollo-composable')
vi.mock('@/composables/useToast')
vi.mock('vue-i18n')

const STORAGE_KEY = 'admin.figures.since'

// The answer of communityFigures as the server gives it: every row of slices 1a and 1b.
const ROWS = [
  { key: 'accountsNew', since: 3, week: 2, total: 40 },
  { key: 'accountsViaTableCode', since: 1, week: 1, total: 5 },
  { key: 'accountsViaLink', since: 0, week: 0, total: 6 },
  { key: 'accountsViaAddress', since: 1, week: 0, total: 7 },
  { key: 'accountsViaEvent', since: 4, week: 1, total: 4 },
  { key: 'hostsWithGuest', since: 1, week: 1, total: 4 },
  { key: 'codesShown', since: 9, week: 2, total: 20 },
  { key: 'returners', since: 2, week: null, total: null },
  { key: 'activeAccounts', since: 12, week: 8, total: 15 },
  { key: 'accountsDeleted', since: 0, week: 0, total: 3 },
  { key: 'accountsTotal', since: null, week: null, total: 120 },
  { key: 'firstCreationsDone', since: 2, week: 1, total: 30 },
  { key: 'firstCreationsSkipped', since: 1, week: 0, total: 11 },
  { key: 'firstCreationsReview', since: 0, week: 0, total: 2 },
  { key: 'transfersSent', since: 14, week: 5, total: 300 },
  { key: 'gddSent', since: 260, week: 80, total: 9100 },
  { key: 'creationsBooked', since: 6, week: 2, total: 150 },
  { key: 'gddCreated', since: 600, week: 200, total: 15000 },
  { key: 'homesSet', since: null, week: null, total: 50 },
  { key: 'findableOnMap', since: null, week: null, total: 31 },
  { key: 'entriesInterest', since: 3, week: 1, total: 22 },
  { key: 'entriesOffer', since: 2, week: 0, total: 17 },
  { key: 'entriesNeed', since: 1, week: 1, total: 9 },
  { key: 'entriesActive', since: null, week: null, total: 41 },
  { key: 'membersWithEntry', since: null, week: null, total: 19 },
  { key: 'membersOnMap', since: null, week: null, total: 773 },
  { key: 'conversationsNew', since: 8, week: 3, total: 64 },
  { key: 'groupsNew', since: 1, week: 0, total: 5 },
  { key: 'hellosFromMap', since: 4, week: 2, total: 4 },
  { key: 'videoRoomsCreated', since: 7, week: 3, total: 7 },
]

// The answer of communityStatistics, the totals since the beginning: its sums as GradidoUnit,
// decimal strings.
const STATISTICS = {
  totalUsers: 130,
  deletedUsers: 4,
  totalGradidoCreated: '15000.5',
  totalGradidoDecayed: '-1200.25',
  dynamicStatisticsFields: {
    activeUsers: 90,
    totalGradidoAvailable: '13800.25',
    totalGradidoUnbookedDecayed: '-12.03',
  },
}

const createVuexStore = () =>
  createStore({
    state: { openCreations: 0 },
    mutations: {
      setOpenCreations(state, count) {
        state.openCreations = count
      },
    },
  })

// The router link, as far as the page uses it: where it goes, and its text.
const BLinkStub = {
  props: ['to'],
  setup(props, { slots }) {
    return () => h('a', { 'data-to': props.to }, slots.default?.())
  },
}

describe('Overview', () => {
  let wrapper
  let store
  let creationsResult
  let onCreationsResult
  let onCreationsError
  let figuresResult
  let figuresVariables
  let figuresOptions
  let onFiguresError
  let statisticsResult
  let statisticsArguments
  let onStatisticsError
  const mockToastError = vi.fn()

  const mountPage = () =>
    mount(Overview, {
      global: {
        plugins: [store],
        stubs: { BLink: BLinkStub },
      },
    })

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-18T10:00:00.000Z'))
    localStorage.clear()
    mockToastError.mockClear()
    store = createVuexStore()
    creationsResult = ref(null)
    onCreationsResult = vi.fn()
    onCreationsError = vi.fn()
    figuresResult = ref(null)
    onFiguresError = vi.fn()
    statisticsResult = ref(null)
    onStatisticsError = vi.fn()

    // Each query answers as itself: a page that asked the wrong one would get nothing.
    useQuery.mockImplementation((document, variables, options) => {
      if (document === adminListContributionsCount) {
        return { result: creationsResult, onResult: onCreationsResult, onError: onCreationsError }
      }
      if (document === communityFigures) {
        figuresVariables = variables
        figuresOptions = options
        return { result: figuresResult, onError: onFiguresError }
      }
      if (document === communityStatistics) {
        statisticsArguments = [variables, options]
        return { result: statisticsResult, onError: onStatisticsError }
      }
      throw new Error('a query the page does not send')
    })
    useAppToast.mockReturnValue({ toastError: mockToastError })
    useI18n.mockReturnValue({
      t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
      d: (date, format) => `${format}:${date.toISOString()}`,
      n: (value, format) => (format ? `${format}#${value}` : `#${value}`),
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  const answerFigures = async (rows = ROWS, since = '2026-10-15T00:00:00.000Z') => {
    figuresResult.value = { communityFigures: { since, rows } }
    await nextTick()
  }
  const answerStatistics = async (statistics = STATISTICS) => {
    statisticsResult.value = { communityStatistics: statistics }
    await nextTick()
  }
  const groupHeadings = () => wrapper.findAll('tr.figures-group').map((row) => row.text())
  const cellsOf = (key) =>
    wrapper
      .find(`[data-test="figure-${key}"]`)
      .findAll('th, td')
      .map((cell) => cell.text())

  describe('today', () => {
    beforeEach(() => {
      wrapper = mountPage()
    })

    it('asks for the open creations as before', () => {
      expect(useQuery).toHaveBeenCalledWith(adminListContributionsCount, {
        filter: { statusFilter: ['IN_PROGRESS', 'PENDING'], hideResubmission: true },
      })
    })

    it('passes the open creations on to the badge in the menu', () => {
      const [handler] = onCreationsResult.mock.calls[0]
      handler({ data: { adminListContributions: { contributionCount: 3 } } })
      expect(store.state.openCreations).toBe(3)
    })

    it('says nothing about them before the answer is there', () => {
      expect(wrapper.find('[data-test="open-creations"]').exists()).toBe(false)
    })

    it('shows the open creations of today as a link to them', async () => {
      creationsResult.value = { adminListContributions: { contributionCount: 3 } }
      await nextTick()
      const link = wrapper.find('[data-test="open-creations"]')
      expect(link.text()).toBe('figures.today {"n":3}')
      expect(link.attributes('data-to')).toBe('/creation-confirm')
    })

    it('says "one" and "none" in words', async () => {
      creationsResult.value = { adminListContributions: { contributionCount: 1 } }
      await nextTick()
      expect(wrapper.find('[data-test="open-creations"]').text()).toBe('figures.todayOne')
      creationsResult.value = { adminListContributions: { contributionCount: 0 } }
      await nextTick()
      expect(wrapper.find('[data-test="open-creations"]').text()).toBe('figures.todayNone')
    })

    it('tells an error of the open creations', () => {
      onCreationsError.mock.calls[0][0]({ message: 'Test error' })
      expect(mockToastError).toHaveBeenCalledWith('Test error')
    })
  })

  describe('the chosen day', () => {
    it('counts from four weeks back where this device keeps no day', () => {
      wrapper = mountPage()
      expect(wrapper.find('[data-test="figures-since"]').element.value).toBe('2026-09-20')
      expect(figuresVariables()).toEqual({ since: '2026-09-20T00:00:00.000Z' })
    })

    it('counts from the day this device keeps', () => {
      localStorage.setItem(STORAGE_KEY, '2026-10-15')
      wrapper = mountPage()
      expect(wrapper.find('[data-test="figures-since"]').element.value).toBe('2026-10-15')
      expect(figuresVariables()).toEqual({ since: '2026-10-15T00:00:00.000Z' })
    })

    it('keeps a new day on this device and asks for it', async () => {
      wrapper = mountPage()
      await wrapper.find('[data-test="figures-since"]').setValue('2026-10-01')
      expect(localStorage.getItem(STORAGE_KEY)).toBe('2026-10-01')
      expect(figuresVariables()).toEqual({ since: '2026-10-01T00:00:00.000Z' })
      expect(figuresOptions().enabled).toBe(true)
    })

    it('asks nothing while the field holds no day, and keeps the day it had', async () => {
      localStorage.setItem(STORAGE_KEY, '2026-10-15')
      wrapper = mountPage()
      await wrapper.find('[data-test="figures-since"]').setValue('')
      expect(figuresOptions().enabled).toBe(false)
      expect(localStorage.getItem(STORAGE_KEY)).toBe('2026-10-15')
    })

    it('asks again whenever the figures page is opened, and shows what it had meanwhile', () => {
      wrapper = mountPage()
      expect(figuresOptions().fetchPolicy).toBe('cache-and-network')
    })
  })

  describe('the figures', () => {
    beforeEach(() => {
      wrapper = mountPage()
    })

    it('shows no table before the answer is there', () => {
      expect(wrapper.find('[data-test="figures"]').exists()).toBe(false)
    })

    it('shows every row of the answer in its group, a dash where a column is missing', async () => {
      await answerFigures()
      expect(groupHeadings()).toEqual([
        'figures.group.accounts',
        'figures.group.firstCreation',
        'figures.group.thanks',
        'figures.group.map',
        'figures.group.conversations',
      ])
      // For a screen reader: a group heading names the rows below it, a label its own row.
      expect(wrapper.findAll('tr.figures-group th').map((th) => th.attributes('scope'))).toEqual(
        Array(5).fill('rowgroup'),
      )
      expect(wrapper.find('[data-test="figure-accountsNew"] th').attributes('scope')).toBe('row')
      for (const { key, since, week, total } of ROWS) {
        const shown = (value) => (value === null ? '–' : `#${value}`)
        expect(cellsOf(key)).toEqual([
          `figures.row.${key}`,
          shown(since),
          shown(week),
          shown(total),
        ])
      }
    })

    it('heads the first column with the day of the numbers below it', async () => {
      await answerFigures(ROWS, '2026-10-01T00:00:00.000Z')
      const heading = 'figures.col.since {"date":"short:2026-10-01T00:00:00.000Z"}'
      expect(wrapper.find('thead').text()).toContain(heading)
      // Stacked on a narrow screen, each number carries the heading of its column.
      const [, since, week, total] = wrapper
        .find('[data-test="figure-codesShown"]')
        .findAll('th, td')
      expect(since.attributes('data-label')).toBe(heading)
      expect(week.attributes('data-label')).toBe('figures.col.week')
      expect(total.attributes('data-label')).toBe('figures.col.total')
    })

    it('leaves out a row whose key it does not know, and a group with none it knows', async () => {
      await answerFigures([
        { key: 'accountsNEW', since: 1, week: 1, total: 1 },
        { key: 'codesShown', since: 9, week: 2, total: 20 },
      ])
      expect(wrapper.find('[data-test="figure-accountsNEW"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="figure-accountsNew"]').exists()).toBe(false)
      expect(cellsOf('codesShown')).toEqual(['figures.row.codesShown', '#9', '#2', '#20'])
      expect(wrapper.findAll('tr.figures-group').map((row) => row.text())).toEqual([
        'figures.group.accounts',
      ])
    })

    it('shows each row of a group in the order of the page', async () => {
      await answerFigures([...ROWS].reverse())
      const keysIn = (group) =>
        wrapper
          .findAll('tbody')
          .find((body) => body.find('tr.figures-group').text() === `figures.group.${group}`)
          .findAll('[data-test^="figure-"]')
          .map((row) => row.attributes('data-test').replace('figure-', ''))
      expect(keysIn('thanks')).toEqual([
        'transfersSent',
        'gddSent',
        'creationsBooked',
        'gddCreated',
      ])
      expect(keysIn('map')).toEqual([
        'homesSet',
        'findableOnMap',
        'entriesInterest',
        'entriesOffer',
        'entriesNeed',
        'entriesActive',
        'membersWithEntry',
        'membersOnMap',
      ])
      expect(keysIn('conversations')).toEqual([
        'conversationsNew',
        'groupsNew',
        'hellosFromMap',
        'videoRoomsCreated',
      ])
    })

    it('shows a dash while the GMS has said no number of members on the map', async () => {
      await answerFigures(
        ROWS.map((row) => (row.key === 'membersOnMap' ? { ...row, total: null } : row)),
      )
      expect(cellsOf('membersOnMap')).toEqual(['figures.row.membersOnMap', '–', '–', '–'])
    })

    it('tells an error of the figures', () => {
      onFiguresError.mock.calls[0][0]({ message: 'Figures error' })
      expect(mockToastError).toHaveBeenCalledWith('Figures error')
    })
  })

  describe('the totals', () => {
    beforeEach(() => {
      wrapper = mountPage()
    })

    it('asks for the totals of the former statistic page, once a session as that page did', () => {
      expect(useQuery).toHaveBeenCalledWith(communityStatistics)
      expect(statisticsArguments).toEqual([undefined, undefined])
    })

    it('shows their group only once they are there, below the others', async () => {
      await answerFigures()
      expect(groupHeadings()).not.toContain('figures.group.totals')

      await answerStatistics()
      expect(groupHeadings()).toEqual([
        'figures.group.accounts',
        'figures.group.firstCreation',
        'figures.group.thanks',
        'figures.group.map',
        'figures.group.conversations',
        'figures.group.totals',
      ])
    })

    it('shows the sums with two places and the accounts with a balance, all of it only', async () => {
      await answerFigures()
      await answerStatistics()
      expect(cellsOf('totalGradidoCreated')).toEqual([
        'figures.row.totalGradidoCreated',
        '–',
        '–',
        'decimal#15000.5',
      ])
      expect(cellsOf('totalGradidoDecayed')[3]).toBe('decimal#-1200.25')
      expect(cellsOf('totalGradidoAvailable')[3]).toBe('decimal#13800.25')
      expect(cellsOf('totalGradidoUnbookedDecayed')[3]).toBe('decimal#-12.03')
      expect(cellsOf('activeUsers')).toEqual(['figures.row.activeUsers', '–', '–', '#90'])
      // The account counts of that page are the group "Accounts" here, without foreign rows.
      expect(wrapper.find('[data-test="figure-totalUsers"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="figure-deletedUsers"]').exists()).toBe(false)
    })

    it('tells an error of the totals and leaves the other groups standing', async () => {
      await answerFigures()
      onStatisticsError.mock.calls[0][0]({ message: 'Totals error' })
      expect(mockToastError).toHaveBeenCalledWith('Totals error')
      expect(groupHeadings()).toHaveLength(5)
    })
  })

  describe('the copy for the review', () => {
    let writeText

    const setClipboard = (clipboard) =>
      Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true })
    const copyButton = () => wrapper.find('[data-test="figures-copy"]')
    const copyStatus = () => wrapper.find('[data-test="figures-copy-status"]')
    const copyField = () => wrapper.find('[data-test="figures-copy-text"]')

    // Two rows and the totals: the block is the table as text, in its order.
    const FEW_ROWS = [
      { key: 'accountsNew', since: 3, week: 2, total: 40 },
      { key: 'gddSent', since: 260, week: 80, total: 9100 },
      { key: 'membersOnMap', since: null, week: null, total: null },
    ]
    const BLOCK = [
      'figures.title · short:2026-10-18T10:00:00.000Z',
      'figures.col.since {"date":"short:2026-10-15T00:00:00.000Z"} · figures.col.week · figures.col.total',
      '',
      'figures.group.accounts',
      'figures.row.accountsNew: #3 · #2 · #40',
      '',
      'figures.group.thanks',
      'figures.row.gddSent: #260 · #80 · #9100',
      '',
      'figures.group.map',
      'figures.row.membersOnMap: – · – · –',
      '',
      'figures.group.totals',
      'figures.row.totalGradidoCreated: – · – · decimal#15000.5',
      'figures.row.totalGradidoDecayed: – · – · decimal#-1200.25',
      'figures.row.totalGradidoAvailable: – · – · decimal#13800.25',
      'figures.row.totalGradidoUnbookedDecayed: – · – · decimal#-12.03',
      'figures.row.activeUsers: – · – · #90',
    ].join('\n')

    beforeEach(() => {
      writeText = vi.fn().mockResolvedValue(undefined)
      setClipboard({ writeText })
      wrapper = mountPage()
    })

    afterEach(() => {
      setClipboard(undefined)
    })

    it('stands above the table once the figures are there', async () => {
      expect(copyButton().exists()).toBe(false)
      await answerFigures()
      expect(copyButton().text()).toBe('figures.copy')
      expect(copyButton().element.compareDocumentPosition(wrapper.find('table').element)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      )
    })

    it('writes the table as plain text to the clipboard, and says it did', async () => {
      await answerFigures(FEW_ROWS)
      await answerStatistics()
      await copyButton().trigger('click')
      await flushPromises()

      expect(writeText).toHaveBeenCalledWith(BLOCK)
      expect(copyStatus().text()).toBe('figures.copied')
      expect(copyStatus().attributes('role')).toBe('status')
      // Said once: the button keeps its name, so a screen reader does not hear it twice.
      expect(copyButton().text()).toBe('figures.copy')
      expect(copyField().exists()).toBe(false)
    })

    it('says so for a moment only', async () => {
      // The clock of the file fakes the date alone; this one needs the timers as well.
      vi.useRealTimers()
      vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
      vi.setSystemTime(new Date('2026-10-18T10:00:00.000Z'))
      await answerFigures(FEW_ROWS)
      await copyButton().trigger('click')
      await flushPromises()
      expect(copyStatus().text()).toBe('figures.copied')

      vi.advanceTimersByTime(1999)
      await nextTick()
      expect(copyStatus().text()).toBe('figures.copied')
      vi.advanceTimersByTime(1)
      await nextTick()
      expect(copyStatus().text()).toBe('')
    })

    it('shows the block to mark by hand where there is no clipboard', async () => {
      setClipboard(undefined)
      await answerFigures(FEW_ROWS)
      await answerStatistics()
      await copyButton().trigger('click')
      await flushPromises()

      expect(copyField().element.value).toBe(BLOCK)
      expect(copyStatus().text()).toBe('figures.copyByHand')
    })

    it('shows the block as well where the browser refuses the clipboard', async () => {
      writeText.mockRejectedValue(new Error('not allowed'))
      await answerFigures(FEW_ROWS)
      await copyButton().trigger('click')
      await flushPromises()

      expect(copyField().exists()).toBe(true)
      expect(copyStatus().text()).toBe('figures.copyByHand')
    })

    it('takes the block away when new figures come', async () => {
      setClipboard(undefined)
      await answerFigures(FEW_ROWS)
      await copyButton().trigger('click')
      await flushPromises()
      expect(wrapper.find('[data-test="figures-copy-text"]').exists()).toBe(true)

      await answerFigures()
      expect(copyField().exists()).toBe(false)
      expect(copyStatus().text()).toBe('')
    })

    it('takes "copied" back when new figures come', async () => {
      await answerFigures(FEW_ROWS)
      await copyButton().trigger('click')
      await flushPromises()
      expect(copyStatus().text()).toBe('figures.copied')

      await answerStatistics()
      expect(copyStatus().text()).toBe('')
    })

    // The clipboard answers late; meanwhile the totals have come, and the table says more than
    // the block that was pressed for.
    it.each([
      ['takes it', (answer) => answer.resolve()],
      ['refuses it', (answer) => answer.reject(new Error('not allowed'))],
    ])(
      'neither shows nor calls copied a block of older figures when the clipboard %s',
      async (_, settle) => {
        let answer
        writeText.mockImplementation(
          () => new Promise((resolve, reject) => (answer = { resolve, reject })),
        )
        await answerFigures(FEW_ROWS)
        await copyButton().trigger('click')
        await answerStatistics()
        settle(answer)
        await flushPromises()

        expect(copyField().exists()).toBe(false)
        expect(copyStatus().text()).toBe('')
      },
    )
  })
})
