// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import Overview from './Overview.vue'
import { adminListContributionsCount } from '@/graphql/adminListContributions.graphql'
import { communityFigures } from '@/graphql/communityFigures.graphql'
import { useQuery } from '@vue/apollo-composable'
import { createStore } from 'vuex'
import { useAppToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'

vi.mock('@vue/apollo-composable')
vi.mock('@/composables/useToast')
vi.mock('vue-i18n')

const STORAGE_KEY = 'admin.figures.since'

// The answer of communityFigures as the server gives it: every row of slice 1a.
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
]

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
      throw new Error('a query the page does not send')
    })
    useAppToast.mockReturnValue({ toastError: mockToastError })
    useI18n.mockReturnValue({
      t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
      d: (date, format) => `${format}:${date.toISOString()}`,
      n: (value) => `#${value}`,
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
      expect(wrapper.findAll('tr.figures-group').map((row) => row.text())).toEqual([
        'figures.group.accounts',
        'figures.group.firstCreation',
      ])
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

    it('tells an error of the figures', () => {
      onFiguresError.mock.calls[0][0]({ message: 'Figures error' })
      expect(mockToastError).toHaveBeenCalledWith('Figures error')
    })
  })
})
