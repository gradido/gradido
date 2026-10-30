// AI-GENERATED — not an architecture reference

import { useQuery } from '@vue/apollo-composable'
import { mount } from '@vue/test-utils'
import { print } from 'graphql'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { adminOpenCreationCounts } from '@/graphql/adminListContributions.graphql'
import { useAdminStore } from '@/store/useAdminStore'
import { adminStore } from '../../test/adminStore'
import { Dashboard } from './Dashboard'

vi.mock('@vue/apollo-composable')
vi.mock('@/composables/useToast')
vi.mock('vue-i18n')

// The router link, as far as the page uses it: where it goes, and its text.
const BLinkStub = {
  props: ['to'],
  setup(props, { slots }) {
    return () => h('a', { 'data-to': props.to }, slots.default?.())
  },
}

describe('Dashboard', () => {
  let wrapper
  let store
  let creationsResult
  let onCreationsResult
  let onCreationsError
  const mockToastError = vi.fn()

  beforeEach(() => {
    vi.mocked(useQuery).mockClear()
    mockToastError.mockClear()
    store = adminStore({ openCreations: 0 })
    creationsResult = ref(null)
    onCreationsResult = vi.fn()
    onCreationsError = vi.fn()

    // Each query answers as itself: a page that asked the wrong one would get nothing.
    useQuery.mockImplementation((document) => {
      if (document === adminOpenCreationCounts) {
        return { result: creationsResult, onResult: onCreationsResult, onError: onCreationsError }
      }
      throw new Error('a query the page does not send')
    })
    useAppToast.mockReturnValue({ toastError: mockToastError })
    useI18n.mockReturnValue({
      t: (key, values, plural) =>
        [key, values && JSON.stringify(values), plural !== undefined && `#${plural}`]
          .filter(Boolean)
          .join(' '),
    })
    wrapper = mount(Dashboard, {
      global: {
        plugins: [store],
        stubs: { BLink: BLinkStub },
      },
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  const counts = (forModeration, forMember, onResubmission = 0) => ({
    waitingForModeration: { contributionCount: forModeration },
    waitingForMember: { contributionCount: forMember },
    allOpen: { contributionCount: forModeration + forMember + onResubmission },
  })
  const answer = async (...numbers) => {
    creationsResult.value = counts(...numbers)
    await nextTick()
  }
  const line = (name) => wrapper.find(`[data-test="${name}"]`)

  it('welcomes whoever comes in', () => {
    expect(wrapper.find('h2').text()).toBe('dashboard.welcome')
  })

  // Every moderator opens this page every time. What takes the server seconds has a page of its
  // own, so a second query here is a decision to take, not a line to add.
  it('asks the server one question, each time anew', () => {
    expect(useQuery).toHaveBeenCalledTimes(1)
    expect(useQuery).toHaveBeenCalledWith(
      adminOpenCreationCounts,
      {},
      { fetchPolicy: 'network-only' },
    )
  })

  // The answer in these tests is made up, so nothing above sees what the question asks. The tab
  // "open" of the creation page asks IN_PROGRESS and PENDING and hides what is put off.
  it('asks what the tab "open" shows, by its two halves, and what it hides', () => {
    const operation = adminOpenCreationCounts.definitions.find(
      ({ kind }) => kind === 'OperationDefinition',
    )
    const asked = Object.fromEntries(
      operation.selectionSet.selections.map(({ alias, name, arguments: [filter] }) => [
        alias.value,
        `${name.value} ${print(filter.value)}`,
      ]),
    )
    expect(asked).toEqual({
      waitingForModeration:
        'adminListContributions {statusFilter: [PENDING], hideResubmission: true}',
      waitingForMember:
        'adminListContributions {statusFilter: [IN_PROGRESS], hideResubmission: true}',
      allOpen:
        'adminListContributions {statusFilter: [IN_PROGRESS, PENDING], hideResubmission: false}',
    })
  })

  it('puts what the tab "open" shows on the badge, not what is put off', () => {
    const [handler] = onCreationsResult.mock.calls[0]
    handler({ data: counts(3, 2, 4) })
    expect(useAdminStore(store).openCreations).toBe(5)
  })

  it('leaves the badge as it is without an answer', () => {
    useAdminStore(store).setOpenCreations(7)
    const [handler] = onCreationsResult.mock.calls[0]
    handler({ data: undefined })
    expect(useAdminStore(store).openCreations).toBe(7)
  })

  it('says nothing about them before the answer is there', () => {
    expect(line('open-creations').exists()).toBe(false)
    expect(line('open-creations-waiting').exists()).toBe(false)
    expect(line('on-resubmission').exists()).toBe(false)
  })

  it('shows the open creations of today as a link to them', async () => {
    await answer(3, 2)
    expect(line('open-creations').text()).toBe('dashboard.today {"n":5}')
    expect(line('open-creations').attributes('data-to')).toBe('/creation-confirm')
  })

  it('says "one" and "none" in words', async () => {
    await answer(1, 0)
    expect(line('open-creations').text()).toBe('dashboard.todayOne')
    await answer(0, 0)
    expect(line('open-creations').text()).toBe('dashboard.todayNone')
  })

  it('says what they wait for, each with the number that chooses its plural', async () => {
    await answer(3, 2)
    expect(line('waiting-for-moderation').text()).toBe('dashboard.waitingForModeration {"n":3} #3')
    expect(line('waiting-for-member').text()).toBe('dashboard.waitingForMember {"n":2} #2')
  })

  it('keeps both lines where one of them is 0', async () => {
    await answer(0, 2)
    expect(line('waiting-for-moderation').text()).toBe('dashboard.waitingForModeration {"n":0} #0')
    expect(line('waiting-for-member').text()).toBe('dashboard.waitingForMember {"n":2} #2')
  })

  it('has no such lines where nothing is open', async () => {
    await answer(0, 0)
    expect(line('open-creations-waiting').exists()).toBe(false)
  })

  it('says what is put off, on a line of its own, also where nothing else is open', async () => {
    await answer(3, 2, 4)
    expect(line('on-resubmission').text()).toBe('dashboard.resubmission {"n":4}')
    await answer(0, 0, 1)
    expect(line('open-creations').text()).toBe('dashboard.todayNone')
    expect(line('on-resubmission').text()).toBe('dashboard.resubmission {"n":1}')
  })

  it('has no such line where nothing is put off', async () => {
    await answer(3, 2)
    expect(line('on-resubmission').exists()).toBe(false)
  })

  // Three statements: a creation that changes between them can make the rest less than nothing.
  it('has no such line where the rest comes out below nothing', async () => {
    creationsResult.value = {
      waitingForModeration: { contributionCount: 3 },
      waitingForMember: { contributionCount: 2 },
      allOpen: { contributionCount: 4 },
    }
    await nextTick()
    expect(line('on-resubmission').exists()).toBe(false)
  })

  it('tells an error of the open creations', () => {
    onCreationsError.mock.calls[0][0]({ message: 'Test error' })
    expect(mockToastError).toHaveBeenCalledWith('Test error')
  })
})
