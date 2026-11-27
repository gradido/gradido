// AI-GENERATED — not an architecture reference
import { describe, expect, it, mock } from 'bun:test'

// the answers `request` gives, in the order they are asked for; each resolves when told to
const answers: ((value: unknown) => void)[] = []
const request = mock(() => new Promise((resolve) => answers.push(resolve)))
mock.module('@/graphql/client', () => ({ request }))

const { askProjectBranding, projectBranding, projectBrandingKnown } = await import(
  './projectBranding'
)

const banner = (name: string) => ({ success: true, value: { projectBrandingBanner: name } })

describe('askProjectBranding', () => {
  it('keeps the project asked for last, also where an earlier answer comes after it', async () => {
    const first = askProjectBranding('a')
    askProjectBranding(undefined)
    answers[0](banner('of a'))
    await first
    expect(projectBranding).toEqual({ project: undefined, banner: undefined, asking: false })
  })

  it('lets a sign-in wait until the project is known', async () => {
    let known = false
    askProjectBranding('b')
    const waiting = projectBrandingKnown().then(() => {
      known = true
    })
    expect(projectBranding.asking).toBe(true)
    await Promise.resolve()
    expect(known).toBe(false)
    answers.at(-1)?.(banner('of b'))
    await waiting
    expect(projectBranding).toEqual({ project: 'b', banner: 'of b', asking: false })
  })
})
