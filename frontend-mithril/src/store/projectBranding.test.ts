// AI-GENERATED — not an architecture reference
import { describe, expect, it, mock } from 'bun:test'
import { location } from '../../test/browserStub'

// the answers `request` gives, in the order they are asked for; each resolves when told to
const answers: ((value: unknown) => void)[] = []
const request = mock(() => new Promise((resolve) => answers.push(resolve)))
mock.module('@/graphql/client', () => ({ request }))

const { knownProject } = await import('./projectBranding')

const at = (search: string) => Object.assign(location, { search })

describe('knownProject', () => {
  it('waits for the server, and gives the project only where it knows it', async () => {
    at('?project=known')
    const known = knownProject()
    answers.at(-1)?.({ success: true, value: { projectBrandingBanner: null } })
    expect(await known).toBe('known')

    at('?project=unknown')
    const unknown = knownProject()
    answers.at(-1)?.({ success: false, error: new Error('not found') })
    expect(await unknown).toBeNull()
  })

  it('asks nothing where the address names no project', async () => {
    const asked = request.mock.calls.length
    at('?project=')
    expect(await knownProject()).toBeNull()
    at('')
    expect(await knownProject()).toBeNull()
    expect(request.mock.calls.length).toBe(asked)
  })
})
