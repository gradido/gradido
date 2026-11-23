// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { repeatWhileVisible } from './timer'

// the tab, with its switch
const tab = Object.assign(new EventTarget(), { hidden: false })
globalThis.document = tab as unknown as Document
const show = (seen: boolean) => {
  tab.hidden = !seen
  tab.dispatchEvent(new Event('visibilitychange'))
}
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('repeatWhileVisible', () => {
  it('calls on its clock until stopped', async () => {
    let calls = 0
    const stop = repeatWhileVisible(20, () => calls++)
    await wait(70)
    stop()
    const atStop = calls
    expect(atStop).toBeGreaterThanOrEqual(2)
    await wait(50)
    expect(calls).toBe(atStop)
  })

  it('rests while the tab is hidden and calls at once when it is seen again', async () => {
    let calls = 0
    const stop = repeatWhileVisible(20, () => calls++)
    show(false)
    await wait(70)
    expect(calls).toBe(0)
    show(true)
    expect(calls).toBe(1)
    stop()
    show(true)
    expect(calls).toBe(1)
  })

  it('goes on with its clock after it is seen again', async () => {
    let calls = 0
    const stop = repeatWhileVisible(20, () => calls++)
    show(false)
    show(true)
    await wait(70)
    stop()
    expect(calls).toBeGreaterThanOrEqual(3)
  })

  it('stays stopped where the call at being seen again stops it', async () => {
    let calls = 0
    const stop = repeatWhileVisible(20, () => {
      calls++
      stop()
    })
    show(false)
    show(true)
    expect(calls).toBe(1)
    await wait(70)
    expect(calls).toBe(1)
  })
})
