// AI-GENERATED — not an architecture reference

import { useQuery } from '@vue/apollo-composable'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { adminListContributionsCount } from '@/graphql/adminListContributions.graphql'
import { communityFigureSeries } from '@/graphql/communityFigureSeries.graphql'
import { communityFigures } from '@/graphql/communityFigures.graphql'
import { communityStatistics } from '@/graphql/communityStatistics'
import { useAdminStore } from '@/store/useAdminStore'
import { adminStore } from '../../test/adminStore'
import { Overview } from './Overview'

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

// The answer of communityFigureSeries: three weeks, the last one running, and a few flows of the
// page -- one in a group each but the first -- and one of a newer server.
const WEEKS = ['2026-09-28T00:00:00.000Z', '2026-10-05T00:00:00.000Z', '2026-10-12T00:00:00.000Z']
const SERIES_ROWS = [
  { key: 'accountsNew', counts: [3, 0, 2] },
  { key: 'activeAccounts', counts: [9, 7, 8] },
  { key: 'gddSent', counts: [100, 0, 160] },
  { key: 'entriesNeed', counts: [0, 1, 0] },
  { key: 'videoRoomsCreated', counts: [2, 3, 0] },
  { key: 'accountsNEW', counts: [1, 1, 1] },
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

const createAdminStore = () => adminStore({ openCreations: 0 })

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
  let statisticsLoading
  let statisticsArguments
  let onStatisticsError
  let seriesResult
  let seriesVariables
  let seriesOptions
  let onSeriesError
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
    store = createAdminStore()
    creationsResult = ref(null)
    onCreationsResult = vi.fn()
    onCreationsError = vi.fn()
    figuresResult = ref(null)
    onFiguresError = vi.fn()
    statisticsResult = ref(null)
    statisticsLoading = ref(false)
    onStatisticsError = vi.fn()
    seriesResult = ref(null)
    onSeriesError = vi.fn()

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
        return { result: statisticsResult, loading: statisticsLoading, onError: onStatisticsError }
      }
      if (document === communityFigureSeries) {
        seriesVariables = variables
        seriesOptions = options
        return { result: seriesResult, onError: onSeriesError }
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
  const answerSeries = async (rows = SERIES_ROWS, weeks = WEEKS) => {
    seriesResult.value = {
      communityFigureSeries: { since: '2026-10-01T00:00:00.000Z', weeks, rows },
    }
    await nextTick()
  }
  const groupHeadings = () =>
    wrapper
      .find('[data-test="figures"]')
      .findAll('tr.figures-group')
      .map((row) => row.text())
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
      expect(useAdminStore(store).openCreations).toBe(3)
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
        new Array(5).fill('rowgroup'),
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

  describe('the weeks', () => {
    const weeksTable = () => wrapper.find('[data-test="figures-weeks"]')
    const weekHeadings = () =>
      weeksTable()
        .findAll('th[data-test^="week-2"]')
        .map((th) => th.text())
    const weekCellsOf = (key) =>
      weeksTable()
        .find(`[data-test="week-figure-${key}"]`)
        .findAll('th, td')
        .map((cell) => cell.text())

    it('asks for the weeks of the chosen day, by its date at 00:00 UTC, whenever the page opens', async () => {
      localStorage.setItem(STORAGE_KEY, '2026-10-15')
      wrapper = mountPage()
      expect(seriesVariables()).toEqual({ since: '2026-10-15T00:00:00.000Z' })
      expect(seriesOptions()).toEqual({ enabled: true, fetchPolicy: 'cache-and-network' })

      await wrapper.find('[data-test="figures-since"]').setValue('2026-10-01')
      expect(seriesVariables()).toEqual({ since: '2026-10-01T00:00:00.000Z' })
      await wrapper.find('[data-test="figures-since"]').setValue('')
      expect(seriesOptions().enabled).toBe(false)
    })

    it('asks for the week of a Monday chosen east of Greenwich, not for the week before it', () => {
      // In Berlin the first moment of Monday 12 October is 22:00 UTC on the Sunday before: the
      // figures count from that moment, the weeks begin with the Monday's own week.
      const ClockDate = Date
      class BerlinDate extends ClockDate {
        constructor(...args) {
          const localMoment =
            args.length === 1 && typeof args[0] === 'string' && /T\d\d:\d\d:\d\d$/.test(args[0])
          if (localMoment) {
            super(new ClockDate(`${args[0]}Z`).getTime() - 2 * 60 * 60 * 1000)
          } else {
            super(...args)
          }
        }
      }
      vi.stubGlobal('Date', BerlinDate)
      try {
        localStorage.setItem(STORAGE_KEY, '2026-10-12')
        wrapper = mountPage()
        expect(figuresVariables()).toEqual({ since: '2026-10-11T22:00:00.000Z' })
        expect(seriesVariables()).toEqual({ since: '2026-10-12T00:00:00.000Z' })
      } finally {
        vi.unstubAllGlobals()
      }
    })

    describe('once the page stands', () => {
      beforeEach(() => {
        wrapper = mountPage()
      })

      it('shows no weeks before their answer, and the table above stands without them', async () => {
        await answerFigures()
        expect(weeksTable().exists()).toBe(false)
        expect(wrapper.find('[data-test="figures"]').exists()).toBe(true)
      })

      it('shows the weeks only once the table above stands, not before it', async () => {
        await answerSeries()
        expect(weeksTable().exists()).toBe(false)

        await answerFigures()
        expect(weeksTable().exists()).toBe(true)
      })

      it('waits for the totals before showing the weeks, and shows them when the totals fail', async () => {
        statisticsLoading.value = true
        await answerFigures()
        await answerSeries()
        expect(weeksTable().exists()).toBe(false)

        // An error ends the waiting as an answer does.
        statisticsLoading.value = false
        await nextTick()
        expect(weeksTable().exists()).toBe(true)
      })

      it('stands below the table, under a heading of its own', async () => {
        await answerFigures()
        await answerSeries()
        expect(
          wrapper
            .find('[data-test="figures"]')
            .element.compareDocumentPosition(weeksTable().element),
        ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
        expect(weeksTable().find('h3').text()).toBe('figures.weeks')
      })

      it('heads a column with each Monday on its own date, in their order, and marks the running week', async () => {
        await answerFigures()
        await answerSeries()
        // Each Monday read as noon of its date where the admin sits: never the day before.
        expect(weekHeadings()).toEqual([
          'short:2026-09-28T12:00:00.000Z',
          'short:2026-10-05T12:00:00.000Z',
          'short:2026-10-12T12:00:00.000Z figures.weekCurrent',
        ])
      })

      it('shows the rows of the answer in the groups of the page, a number for every week, 0 too', async () => {
        await answerFigures()
        await answerSeries()
        expect(
          weeksTable()
            .findAll('tr.figures-group')
            .map((row) => row.text()),
        ).toEqual([
          'figures.group.accounts',
          'figures.group.thanks',
          'figures.group.map',
          'figures.group.conversations',
        ])
        expect(weekCellsOf('accountsNew')).toEqual(['figures.row.accountsNew', '#3', '#0', '#2'])
        expect(weekCellsOf('gddSent')).toEqual(['figures.row.gddSent', '#100', '#0', '#160'])
        expect(weekCellsOf('entriesNeed')).toEqual(['figures.row.entriesNeed', '#0', '#1', '#0'])
        expect(weekCellsOf('videoRoomsCreated')).toEqual([
          'figures.row.videoRoomsCreated',
          '#2',
          '#3',
          '#0',
        ])
        // A row of a newer server waits for its label here.
        expect(weeksTable().find('[data-test="week-figure-accountsNEW"]').exists()).toBe(false)
      })

      it('calls the active accounts by week what they are: the accounts with a sign-in that week', async () => {
        await answerFigures()
        await answerSeries()
        expect(weekCellsOf('activeAccounts')).toEqual([
          'figures.row.activeAccountsWeekly',
          '#9',
          '#7',
          '#8',
        ])
      })

      it('is a region of its own that rolls sideways and the keyboard can reach, not stacked', async () => {
        await answerFigures()
        await answerSeries()
        const region = weeksTable().find('[role="region"]')
        expect(region.classes()).toContain('table-responsive')
        expect(region.attributes('tabindex')).toBe('0')
        const heading = weeksTable().find('h3')
        expect(region.attributes('aria-labelledby')).toBe(heading.attributes('id'))
        expect(region.find('table').classes().join(' ')).not.toMatch(/stacked/)
        // The labels stand still while the weeks roll: they name their rows and groups, and carry
        // what the head of their column carries.
        const labelClasses = region.find('thead th').classes()
        expect(labelClasses.length).toBeGreaterThan(0)
        expect(
          region
            .findAll('tbody th')
            .every((th) => labelClasses.every((labelClass) => th.classes().includes(labelClass))),
        ).toBe(true)
      })

      it('tells an error of the weeks and leaves the table above standing', async () => {
        await answerFigures()
        onSeriesError.mock.calls[0][0]({ message: 'Weeks error' })
        expect(mockToastError).toHaveBeenCalledWith('Weeks error')
        expect(wrapper.find('[data-test="figures"]').exists()).toBe(true)
        expect(weeksTable().exists()).toBe(false)
      })
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

    it('carries the weeks below the table, once they are there', async () => {
      await answerFigures(FEW_ROWS)
      await answerStatistics()
      await answerSeries()
      await copyButton().trigger('click')
      await flushPromises()

      expect(writeText).toHaveBeenCalledWith(
        [
          BLOCK,
          '',
          'figures.weeks',
          'short:2026-09-28T12:00:00.000Z · short:2026-10-05T12:00:00.000Z · short:2026-10-12T12:00:00.000Z (figures.weekCurrent)',
          '',
          'figures.group.accounts',
          'figures.row.accountsNew: #3 · #0 · #2',
          'figures.row.activeAccountsWeekly: #9 · #7 · #8',
          '',
          'figures.group.thanks',
          'figures.row.gddSent: #100 · #0 · #160',
          '',
          'figures.group.map',
          'figures.row.entriesNeed: #0 · #1 · #0',
          '',
          'figures.group.conversations',
          'figures.row.videoRoomsCreated: #2 · #3 · #0',
        ].join('\n'),
      )
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

    it('leaves the weeks out of the block while they are not shown', async () => {
      statisticsLoading.value = true
      await answerFigures(FEW_ROWS)
      await answerSeries()
      await copyButton().trigger('click')
      await flushPromises()

      expect(writeText).toHaveBeenCalledTimes(1)
      expect(writeText.mock.calls[0][0]).not.toContain('figures.weeks')
    })

    it('takes "copied" back when the weeks show up', async () => {
      statisticsLoading.value = true
      await answerFigures(FEW_ROWS)
      await answerSeries()
      await copyButton().trigger('click')
      await flushPromises()
      expect(copyStatus().text()).toBe('figures.copied')

      // The totals failed: no new numbers, but the weeks appear below the table.
      statisticsLoading.value = false
      await nextTick()
      expect(copyStatus().text()).toBe('')
    })

    it('takes "copied" back when new weeks come', async () => {
      // The weeks already stand: only the new answer can end the press.
      await answerFigures(FEW_ROWS)
      await answerSeries()
      await copyButton().trigger('click')
      await flushPromises()
      expect(copyStatus().text()).toBe('figures.copied')

      await answerSeries(SERIES_ROWS.slice(0, 2))
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
