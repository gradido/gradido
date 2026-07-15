import { getBuildInfo } from './version'

// The source depends on the environment (a git checkout resolves to "git", a
// container without .git falls back to "env"/"unknown"), so we assert the shape and
// the caching, not a specific source — that keeps the test stable across dev and CI.
describe('getBuildInfo', () => {
  it('returns a non-empty commit and a known source', () => {
    const info = getBuildInfo()
    expect(typeof info.commit).toBe('string')
    expect(info.commit.length).toBeGreaterThan(0)
    expect(['git', 'env', 'unknown']).toContain(info.source)
  })

  it('caches the result across calls', () => {
    expect(getBuildInfo()).toBe(getBuildInfo())
  })
})
