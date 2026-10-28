// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { setUserRemark } from '@/graphql/userRemark'
import {
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
  let state: UserRemarkState
  let wrapper: ReturnType<typeof mount>
  const member = ref(LEONI)

  // The composable as a card holds it, in a component of its own: it saves when the card goes.
  const mountCard = () => {
    wrapper = mount(
      defineComponent({
        setup() {
          state = useUserRemark(() => member.value, failedUnseen)
          return () => h('div')
        },
      }),
    )
  }

  const sent = () => mutate.mock.calls.map(([options]) => options.variables)

  beforeEach(() => {
    vi.useFakeTimers()
    member.value = LEONI
    mutate = vi.fn(async ({ variables }) => ({
      data: { setUserRemark: answerFor(variables.remark) },
    }))
    failedUnseen = vi.fn()
    vi.mocked(useApolloClient).mockReturnValue({
      resolveClient: () => ({ mutate }),
    } as unknown as ReturnType<typeof useApolloClient>)
    mountCard()
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('takes the remark the server holds, and keeps nothing writable until then', () => {
    expect(state.loaded.value).toBe(false)
    state.toggle()
    expect(state.open.value).toBe(false)

    state.take(BY_BERND)
    expect(state.loaded.value).toBe(true)
    expect(state.saved.value).toEqual(BY_BERND)
    expect(state.draft.value).toBe(BY_BERND.remark)
    state.toggle()
    expect(state.open.value).toBe(true)
  })

  it('saves a pause after the last key, not before', async () => {
    state.take(null)
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
    state.take(null)
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
    state.take(null)
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
    state.take(null)
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
    state.take(null)
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
  })

  it('saves at once when the field is closed', async () => {
    state.take(null)
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
    state.take(BY_BERND)
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

  it('takes the remark away with the words emptied, and then holds none', async () => {
    state.take(BY_BERND)
    state.toggle()
    state.input('  ')
    state.close()
    await vi.runAllTimersAsync()
    expect(sent()).toEqual([{ userId: LEONI, remark: '  ' }])
    expect(state.saved.value).toBeNull()
    // Whitespace is no remark: closing again sends nothing more.
    state.toggle()
    state.close()
    await vi.runAllTimersAsync()
    expect(mutate).toHaveBeenCalledTimes(1)
  })

  it('says so where a save fails in the open field, keeps the words, and tries again', async () => {
    mutate.mockRejectedValueOnce(new Error('Network error'))
    state.take(BY_BERND)
    state.toggle()
    state.input('Tochter von Ramona')
    await vi.advanceTimersByTimeAsync(REMARK_SAVE_PAUSE_MS)
    expect(state.status.value).toBe('failed')
    expect(state.saved.value).toEqual(BY_BERND)
    expect(failedUnseen).not.toHaveBeenCalled()

    // Closed and opened again, the words that were not saved are still there.
    state.close()
    await vi.runAllTimersAsync()
    expect(state.saved.value?.remark).toBe('Tochter von Ramona')
    expect(sent()).toHaveLength(2)
  })

  it('tries again on request', async () => {
    mutate.mockRejectedValueOnce(new Error('Network error'))
    state.take(null)
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
    state.take(BY_BERND)
    state.toggle()
    state.input('Tochter von Ramona')
    state.close()
    await vi.runAllTimersAsync()
    state.toggle()
    expect(state.draft.value).toBe('Tochter von Ramona')
  })

  it('reports a save that fails where nobody sees the field', async () => {
    mutate.mockRejectedValueOnce(new Error('Network error'))
    state.take(null)
    state.toggle()
    state.input('Tochter von Ramona')
    state.close()
    await vi.runAllTimersAsync()
    expect(failedUnseen).toHaveBeenCalledTimes(1)
  })

  it('saves what is not saved yet when the card goes away', async () => {
    state.take(null)
    state.toggle()
    state.input('Rentner seit Januar 25')
    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(0)
    expect(sent()).toEqual([{ userId: LEONI, remark: 'Rentner seit Januar 25' }])
    mountCard()
  })

  it('reports it where that save fails, for nobody sees the card any more', async () => {
    mutate.mockRejectedValueOnce(new Error('Network error'))
    state.take(null)
    state.toggle()
    state.input('Rentner seit Januar 25')
    wrapper.unmount()
    await vi.runAllTimersAsync()
    expect(failedUnseen).toHaveBeenCalledTimes(1)
    mountCard()
  })

  it('saves nothing when a card goes away that holds nothing new', async () => {
    state.take(BY_BERND)
    wrapper.unmount()
    await vi.runAllTimersAsync()
    expect(mutate).not.toHaveBeenCalled()
    mountCard()
  })

  // ⛔ An answer belongs to the member it was written for: the card may show somebody else by now.
  it('drops the answer for a member the card no longer shows', async () => {
    let answer: (value: unknown) => void = () => undefined
    mutate.mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)))
    state.take(null)
    state.toggle()
    state.input('on Leoni')
    await vi.advanceTimersByTimeAsync(REMARK_SAVE_PAUSE_MS)
    member.value = 109
    answer({ data: { setUserRemark: answerFor('on Leoni') } })
    await vi.runAllTimersAsync()
    expect(state.saved.value).toBeNull()
    expect(state.status.value).not.toBe('saved')
  })

  // A colleague may write meanwhile: an open field that nobody touched follows the server, so that
  // closing it does not write the old words over theirs.
  it('lets an untouched open field follow a new answer, and keeps words that were changed', async () => {
    state.take(BY_BERND)
    state.toggle()
    state.take(answerFor('Tochter von Ramona'))
    expect(state.draft.value).toBe('Tochter von Ramona')
    state.close()
    await vi.runAllTimersAsync()
    expect(mutate).not.toHaveBeenCalled()

    state.toggle()
    state.input('Tochter von Ramona, Rentnerin')
    state.take(BY_BERND)
    expect(state.draft.value).toBe('Tochter von Ramona, Rentnerin')
  })
})
