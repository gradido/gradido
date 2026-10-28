// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { setUserRemark } from '@/graphql/userRemark'
import { useAdminStore } from '@/store/useAdminStore'
import {
  forgetUserRemarks,
  REMARK_SAVE_PAUSE_MS,
  type UserRemark,
  type UserRemarkState,
  useUserRemark,
} from './useUserRemark'

vi.mock('@vue/apollo-composable')

const LEONI = 108
const BY_BERND: UserRemark = {
  remark: 'Bürgermeisterin von Lieblingsstadt',
  updatedAt: '2026-10-28T08:40:00.000Z',
  updatedByName: 'Bernd Hückstädt',
}

/** What the server answers to a save: the words, the time and the moderator who wrote them. */
const answerFor = (remark: string): UserRemark | null =>
  remark.trim() === ''
    ? null
    : { remark, updatedAt: '2026-10-28T09:00:00.000Z', updatedByName: 'Peter Lustig' }

describe('useUserRemark', () => {
  let mutate: ReturnType<typeof vi.fn>
  let failedUnseen: ReturnType<typeof vi.fn>
  let cards: ReturnType<typeof mount>[]

  /** A card as the contributions page holds one: the composable, for the member it shows. */
  const mountCard = (member = ref<number | null>(LEONI)) => {
    let state: UserRemarkState | undefined
    const wrapper = mount(
      defineComponent({
        setup() {
          state = useUserRemark(() => member.value, failedUnseen)
          return () => h('div')
        },
      }),
    )
    cards.push(wrapper)
    return { state: state as UserRemarkState, wrapper, member }
  }

  const sent = () => mutate.mock.calls.map(([options]) => options.variables)

  beforeEach(() => {
    vi.useFakeTimers()
    forgetUserRemarks()
    cards = []
    mutate = vi.fn(async ({ variables }) => ({
      data: { setUserRemark: answerFor(variables.remark) },
    }))
    failedUnseen = vi.fn()
    vi.mocked(useApolloClient).mockReturnValue({
      resolveClient: () => ({ mutate }),
    } as unknown as ReturnType<typeof useApolloClient>)
  })

  afterEach(() => {
    for (const card of cards) {
      card.unmount()
    }
    forgetUserRemarks()
    vi.useRealTimers()
  })

  it('takes the remark the server holds, and keeps nothing writable until then', () => {
    const { state } = mountCard()
    expect(state.loaded.value).toBe(false)
    state.toggle()
    expect(state.open.value).toBe(false)

    state.take(LEONI, BY_BERND)
    expect(state.loaded.value).toBe(true)
    expect(state.saved.value).toEqual(BY_BERND)
    expect(state.draft.value).toBe(BY_BERND.remark)
    state.toggle()
    expect(state.open.value).toBe(true)
  })

  it('saves a pause after the last key, not before', async () => {
    const { state } = mountCard()
    state.take(LEONI, null)
    state.toggle()
    state.input('Tochter von Ramona')
    await vi.advanceTimersByTimeAsync(REMARK_SAVE_PAUSE_MS - 1)
    expect(mutate).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate.mock.calls[0][0].mutation).toBe(setUserRemark)
    expect(sent()).toEqual([{ userId: LEONI, remark: 'Tochter von Ramona' }])
  })

  it('counts the pause from the last key: words typed slowly go out once, whole', async () => {
    const { state } = mountCard()
    state.take(LEONI, null)
    state.toggle()
    state.input('Tochter')
    await vi.advanceTimersByTimeAsync(REMARK_SAVE_PAUSE_MS - 200)
    state.input('Tochter von')
    await vi.advanceTimersByTimeAsync(REMARK_SAVE_PAUSE_MS - 200)
    state.input('Tochter von Ramona')
    await vi.advanceTimersByTimeAsync(REMARK_SAVE_PAUSE_MS)
    expect(sent()).toEqual([{ userId: LEONI, remark: 'Tochter von Ramona' }])
  })

  it('keeps what the server answered, and says it is saved', async () => {
    const { state } = mountCard()
    state.take(LEONI, null)
    state.toggle()
    state.input('Tochter von Ramona')
    expect(state.status.value).toBe('idle')
    await vi.advanceTimersByTimeAsync(REMARK_SAVE_PAUSE_MS)
    expect(state.saved.value).toEqual(answerFor('Tochter von Ramona'))
    expect(state.status.value).toBe('saved')
  })

  it('says it saves while the answer is on its way', async () => {
    let answer: (value: unknown) => void = () => undefined
    mutate.mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)))
    const { state } = mountCard()
    state.take(LEONI, null)
    state.toggle()
    state.input('Tochter von Ramona')
    await vi.advanceTimersByTimeAsync(REMARK_SAVE_PAUSE_MS)
    expect(state.status.value).toBe('saving')
    answer({ data: { setUserRemark: answerFor('Tochter von Ramona') } })
    await vi.runAllTimersAsync()
    expect(state.status.value).toBe('saved')
  })

  // ⛔ One save at a time: two in flight could arrive in the wrong order, and the older words
  // would win.
  it('saves one after the other, the words typed meanwhile with the next', async () => {
    let answerFirst: (value: unknown) => void = () => undefined
    mutate.mockImplementationOnce(() => new Promise((resolve) => (answerFirst = resolve)))
    const { state } = mountCard()
    state.take(LEONI, null)
    state.toggle()
    state.input('Tochter')
    await vi.advanceTimersByTimeAsync(REMARK_SAVE_PAUSE_MS)
    state.input('Tochter von Ramona')
    await vi.advanceTimersByTimeAsync(REMARK_SAVE_PAUSE_MS)
    expect(mutate).toHaveBeenCalledTimes(1)

    answerFirst({ data: { setUserRemark: answerFor('Tochter') } })
    await vi.runAllTimersAsync()
    expect(sent()).toEqual([
      { userId: LEONI, remark: 'Tochter' },
      { userId: LEONI, remark: 'Tochter von Ramona' },
    ])
    expect(state.saved.value?.remark).toBe('Tochter von Ramona')
    expect(state.draft.value).toBe('Tochter von Ramona')
  })

  it('saves at once when the field is closed', async () => {
    const { state } = mountCard()
    state.take(LEONI, null)
    state.toggle()
    state.input('Rentner seit Januar 25')
    state.close()
    expect(state.open.value).toBe(false)
    await vi.advanceTimersByTimeAsync(0)
    expect(sent()).toEqual([{ userId: LEONI, remark: 'Rentner seit Januar 25' }])
    // ... and once only: the pause that was running is over.
    await vi.advanceTimersByTimeAsync(REMARK_SAVE_PAUSE_MS * 2)
    expect(mutate).toHaveBeenCalledTimes(1)
  })

  it('sends nothing where the words are what the server holds', async () => {
    const { state } = mountCard()
    state.take(LEONI, BY_BERND)
    state.toggle()
    state.close()
    state.toggle()
    state.input(`${BY_BERND.remark}!`)
    state.input(BY_BERND.remark)
    await vi.advanceTimersByTimeAsync(REMARK_SAVE_PAUSE_MS)
    state.close()
    await vi.runAllTimersAsync()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('takes the remark away with the words emptied, and the field holds nothing then', async () => {
    const { state } = mountCard()
    state.take(LEONI, BY_BERND)
    state.toggle()
    state.input('  ')
    state.close()
    await vi.runAllTimersAsync()
    expect(sent()).toEqual([{ userId: LEONI, remark: '  ' }])
    expect(state.saved.value).toBeNull()
    expect(state.draft.value).toBe('')
    state.toggle()
    state.close()
    await vi.runAllTimersAsync()
    expect(mutate).toHaveBeenCalledTimes(1)
  })

  // Whitespace alone is no remark: where there is none, there is nothing to take away either.
  it('sends nothing for whitespace where there is no remark', async () => {
    const { state } = mountCard()
    state.take(LEONI, null)
    state.toggle()
    state.input('   ')
    await vi.advanceTimersByTimeAsync(REMARK_SAVE_PAUSE_MS)
    state.close()
    await vi.runAllTimersAsync()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('says so where a save fails in the open field, keeps the words, and tries again on closing', async () => {
    mutate.mockRejectedValueOnce(new Error('Network error'))
    const { state } = mountCard()
    state.take(LEONI, BY_BERND)
    state.toggle()
    state.input('Tochter von Ramona')
    await vi.advanceTimersByTimeAsync(REMARK_SAVE_PAUSE_MS)
    expect(state.status.value).toBe('failed')
    expect(state.saved.value).toEqual(BY_BERND)
    expect(state.draft.value).toBe('Tochter von Ramona')
    expect(failedUnseen).not.toHaveBeenCalled()

    state.close()
    await vi.runAllTimersAsync()
    expect(state.saved.value?.remark).toBe('Tochter von Ramona')
    expect(sent()).toHaveLength(2)
  })

  it('tries again on request', async () => {
    mutate.mockRejectedValueOnce(new Error('Network error'))
    const { state } = mountCard()
    state.take(LEONI, null)
    state.toggle()
    state.input('Tochter von Ramona')
    await vi.advanceTimersByTimeAsync(REMARK_SAVE_PAUSE_MS)
    expect(state.status.value).toBe('failed')
    state.retry()
    await vi.runAllTimersAsync()
    expect(state.status.value).toBe('saved')
    expect(sent()).toHaveLength(2)
  })

  it('keeps unsaved words in the field when it is opened again', async () => {
    mutate.mockRejectedValue(new Error('Network error'))
    const { state } = mountCard()
    state.take(LEONI, BY_BERND)
    state.toggle()
    state.input('Tochter von Ramona')
    state.close()
    await vi.runAllTimersAsync()
    state.toggle()
    expect(state.draft.value).toBe('Tochter von Ramona')
    expect(state.status.value).toBe('failed')
  })

  // coderabbit (#4220): a save that failed before its first await ran `finally` before
  // `entry.saving` held its promise -- the lock stayed, and nothing was ever sent again.
  it('stays free for the next save where one fails before it reaches the server', async () => {
    vi.mocked(useApolloClient).mockReturnValueOnce({
      resolveClient: () => {
        throw new Error('no client')
      },
    } as unknown as ReturnType<typeof useApolloClient>)
    const first = mountCard()
    first.state.take(LEONI, null)
    first.state.toggle()
    first.state.input('Tochter von Ramona')
    await vi.advanceTimersByTimeAsync(REMARK_SAVE_PAUSE_MS)
    expect(first.state.status.value).toBe('failed')
    expect(mutate).not.toHaveBeenCalled()

    // The next card of the member reaches the server again.
    const next = mountCard()
    next.state.retry()
    await vi.runAllTimersAsync()
    expect(sent()).toEqual([{ userId: LEONI, remark: 'Tochter von Ramona' }])
    expect(next.state.status.value).toBe('saved')
  })

  it('reports a save that fails where nobody sees the field', async () => {
    mutate.mockRejectedValueOnce(new Error('Network error'))
    const { state } = mountCard()
    state.take(LEONI, null)
    state.toggle()
    state.input('Tochter von Ramona')
    state.close()
    await vi.runAllTimersAsync()
    expect(failedUnseen).toHaveBeenCalledTimes(1)
  })

  // The second reader's case A (28.10.2026): a failed save, then a message sent in the same card
  // -- its answer brings the remark again and must not take the words that wait.
  it('takes only the first answer: a later one leaves the words that wait to be saved', async () => {
    mutate.mockRejectedValueOnce(new Error('Network error'))
    const { state } = mountCard()
    state.take(LEONI, BY_BERND)
    state.toggle()
    state.input('Tochter von Ramona')
    state.close()
    await vi.runAllTimersAsync()
    expect(state.status.value).toBe('failed')

    state.take(LEONI, BY_BERND)
    expect(state.draft.value).toBe('Tochter von Ramona')
    state.toggle()
    state.retry()
    await vi.runAllTimersAsync()
    expect(sent()).toEqual([
      { userId: LEONI, remark: 'Tochter von Ramona' },
      { userId: LEONI, remark: 'Tochter von Ramona' },
    ])
    expect(state.saved.value?.remark).toBe('Tochter von Ramona')
  })

  // Case B: an answer read before a save went through comes after it was sent.
  it('does not bring an older remark back while a save is on its way', async () => {
    let answer: (value: unknown) => void = () => undefined
    mutate.mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)))
    const { state } = mountCard()
    state.take(LEONI, BY_BERND)
    state.toggle()
    state.input('Tochter von Ramona')
    state.close()
    await vi.advanceTimersByTimeAsync(0)
    state.take(LEONI, BY_BERND)
    answer({ data: { setUserRemark: answerFor('Tochter von Ramona') } })
    await vi.runAllTimersAsync()
    expect(state.saved.value?.remark).toBe('Tochter von Ramona')
    expect(state.draft.value).toBe('Tochter von Ramona')
    expect(mutate).toHaveBeenCalledTimes(1)
  })

  // The second reader's case 2: opening another contribution of the same member closes the first
  // one in the same moment. The next card shows the words just typed, and its own answer -- read
  // before they were saved -- does not replace them.
  it('shows the next card of the member the words the last one typed and has not saved', async () => {
    let answer: (value: unknown) => void = () => undefined
    mutate.mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)))
    const first = mountCard()
    first.state.take(LEONI, BY_BERND)
    first.state.toggle()
    first.state.input('Tochter von Ramona')

    const next = mountCard()
    first.wrapper.unmount()
    expect(next.state.loaded.value).toBe(true)
    expect(next.state.draft.value).toBe('Tochter von Ramona')
    expect(next.state.status.value).toBe('saving')

    next.state.take(LEONI, BY_BERND)
    expect(next.state.draft.value).toBe('Tochter von Ramona')
    // The save leaves a tick after it was started (it yields before anything can fail).
    await vi.advanceTimersByTimeAsync(0)
    answer({ data: { setUserRemark: answerFor('Tochter von Ramona') } })
    await vi.runAllTimersAsync()
    expect(next.state.saved.value?.remark).toBe('Tochter von Ramona')
    expect(sent()).toEqual([{ userId: LEONI, remark: 'Tochter von Ramona' }])
  })

  it('saves what is not saved yet when the card goes away', async () => {
    const { state, wrapper } = mountCard()
    state.take(LEONI, null)
    state.toggle()
    state.input('Rentner seit Januar 25')
    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(0)
    expect(sent()).toEqual([{ userId: LEONI, remark: 'Rentner seit Januar 25' }])
  })

  it('reports it where that save fails, and the words wait for the next card of the member', async () => {
    mutate.mockRejectedValueOnce(new Error('Network error'))
    const { state, wrapper } = mountCard()
    state.take(LEONI, null)
    state.toggle()
    state.input('Rentner seit Januar 25')
    wrapper.unmount()
    await vi.runAllTimersAsync()
    expect(failedUnseen).toHaveBeenCalledTimes(1)

    const next = mountCard()
    next.state.take(LEONI, null)
    expect(next.state.draft.value).toBe('Rentner seit Januar 25')
    expect(next.state.status.value).toBe('failed')
    next.state.toggle()
    next.state.retry()
    await vi.runAllTimersAsync()
    expect(next.state.saved.value?.remark).toBe('Rentner seit Januar 25')
  })

  it('saves nothing when a card goes away that holds nothing new', async () => {
    const { state, wrapper } = mountCard()
    state.take(LEONI, BY_BERND)
    wrapper.unmount()
    await vi.runAllTimersAsync()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('forgets the member once no card shows them and nothing waits: the next card reads anew', async () => {
    const { state, wrapper } = mountCard()
    state.take(LEONI, BY_BERND)
    wrapper.unmount()
    await vi.runAllTimersAsync()

    const next = mountCard()
    expect(next.state.loaded.value).toBe(false)
    next.state.take(LEONI, answerFor('Tochter von Ramona'))
    expect(next.state.saved.value?.remark).toBe('Tochter von Ramona')
  })

  // A browser is used by more than one moderator: what one could not save is not the next one's.
  it('shows another moderator nothing of the words the last one could not save', async () => {
    const store = useAdminStore()
    store.setModerator({ gradidoID: 'aaaa', communityUuid: 'home' } as never)
    mutate.mockRejectedValueOnce(new Error('Network error'))
    const { state, wrapper } = mountCard()
    state.take(LEONI, BY_BERND)
    state.toggle()
    state.input('Tochter von Ramona')
    wrapper.unmount()
    await vi.runAllTimersAsync()

    store.setModerator({ gradidoID: 'bbbb', communityUuid: 'home' } as never)
    const next = mountCard()
    expect(next.state.loaded.value).toBe(false)
    next.state.take(LEONI, BY_BERND)
    expect(next.state.draft.value).toBe(BY_BERND.remark)
    expect(next.state.status.value).toBe('idle')
  })

  // An answer belongs to the member it was asked about: a card that came to show somebody else by
  // then changes nothing it shows.
  it('takes an answer for the member it was asked about, not for the one the card shows now', async () => {
    const member = ref(LEONI)
    const { state } = mountCard(member)
    member.value = 109
    await vi.advanceTimersByTimeAsync(0)
    state.take(LEONI, BY_BERND)
    expect(state.loaded.value).toBe(false)
    expect(state.saved.value).toBeNull()
    state.take(109, answerFor('on Marta'))
    expect(state.saved.value?.remark).toBe('on Marta')
  })

  // Crea's window holds the member only while it is open (Bernd, 28.10.2026): the composable is
  // told "nobody" in between.
  it('holds nothing while the card shows nobody: no field, nothing to save', async () => {
    const { state } = mountCard(ref<number | null>(null))
    state.take(LEONI, BY_BERND)
    state.toggle()
    state.input('Rentnerin seit Januar 2025')
    await state.flush()
    expect(state.loaded.value).toBe(false)
    expect(state.saved.value).toBeNull()
    expect(state.open.value).toBe(false)
    expect(state.draft.value).toBe('')
    expect(mutate).not.toHaveBeenCalled()
  })

  it('takes the member up when the window opens, and lets them go with the words when it closes', async () => {
    const member = ref<number | null>(null)
    const { state } = mountCard(member)
    member.value = LEONI
    await vi.advanceTimersByTimeAsync(0)
    state.take(LEONI, BY_BERND)
    expect(state.saved.value).toEqual(BY_BERND)
    state.toggle()
    state.input('Rentnerin seit Januar 2025')
    member.value = null
    await vi.advanceTimersByTimeAsync(0)
    expect(sent()).toEqual([{ userId: LEONI, remark: 'Rentnerin seit Januar 2025' }])
    expect(state.open.value).toBe(false)
    expect(state.loaded.value).toBe(false)
  })

  it('saves at once on flush, before the pause is over, and answers once the server did', async () => {
    const { state } = mountCard()
    state.take(LEONI, BY_BERND)
    state.toggle()
    state.input('Rentnerin seit Januar 2025')
    let answered = false
    const flushed = state.flush().then(() => {
      answered = true
    })
    expect(answered).toBe(false)
    await flushed
    expect(sent()).toEqual([{ userId: LEONI, remark: 'Rentnerin seit Januar 2025' }])
    expect(state.saved.value?.remark).toBe('Rentnerin seit Januar 2025')
    await vi.advanceTimersByTimeAsync(REMARK_SAVE_PAUSE_MS)
    expect(mutate).toHaveBeenCalledTimes(1)
  })

  it('waits on flush for a save on its way and the words typed after it', async () => {
    let release: () => void = () => undefined
    mutate.mockImplementationOnce(
      ({ variables }) =>
        new Promise((resolve) => {
          release = () => resolve({ data: { setUserRemark: answerFor(variables.remark) } })
        }),
    )
    const { state } = mountCard()
    state.take(LEONI, BY_BERND)
    state.toggle()
    state.input('Rentnerin')
    await vi.advanceTimersByTimeAsync(REMARK_SAVE_PAUSE_MS)
    state.input('Rentnerin seit Januar 2025')
    let answered = false
    const flushed = state.flush().then(() => {
      answered = true
    })
    await vi.advanceTimersByTimeAsync(0)
    expect(answered).toBe(false)
    release()
    await flushed
    expect(sent()).toEqual([
      { userId: LEONI, remark: 'Rentnerin' },
      { userId: LEONI, remark: 'Rentnerin seit Januar 2025' },
    ])
    expect(state.saved.value?.remark).toBe('Rentnerin seit Januar 2025')
  })

  it('sends nothing on flush where nothing waits', async () => {
    const { state } = mountCard()
    state.take(LEONI, BY_BERND)
    await state.flush()
    expect(mutate).not.toHaveBeenCalled()
  })
})
