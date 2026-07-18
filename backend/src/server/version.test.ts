import { getBuildInfo } from './version'

// The concrete commit/source is baked in at build time by esbuild.config.ts; under the
// ts-node test run no bundling happens, so getBuildInfo returns the ./buildInfo dev
// placeholder. We assert the shape (not a specific value) so the test is stable across
// dev and the various build paths.
describe('getBuildInfo', () => {
  it('returns a non-empty commit and a known source', () => {
    const info = getBuildInfo()
    expect(typeof info.commit).toBe('string')
    expect(info.commit.length).toBeGreaterThan(0)
    expect(['git', 'env', 'unknown']).toContain(info.source)
  })

  it('returns a stable reference', () => {
    expect(getBuildInfo()).toBe(getBuildInfo())
  })
})
