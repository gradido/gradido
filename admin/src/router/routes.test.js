// AI-GENERATED — not an architecture reference
import { describe, it, expect, vi } from 'vitest'
import routes from './routes'

// router.test.js replaces the routes with a list of its own, so nothing there reads this file.
vi.mock('@/pages/ChatSettings.vue', () => ({ default: { name: 'ChatSettings' } }))

const route = (path) => routes.find((candidate) => candidate.path === path)

describe('routes', () => {
  // The menu hides these entries from moderators, but hiding is a convenience: the guard reads
  // `requiresAdmin` from the route (guards.js), and the backend's rights have the last word.
  it('keeps the chat page for administrators, and loads it', async () => {
    expect(route('/chat')).toMatchObject({ name: 'chat', meta: { requiresAdmin: true } })
    expect((await route('/chat').component()).default.name).toBe('ChatSettings')
  })

  it('keeps every page of the administrators-only menu entries for administrators', () => {
    for (const path of [
      '/federation',
      '/projectBranding',
      '/creaSettings',
      '/chat',
      '/creation-groups',
    ]) {
      expect(route(path)?.meta?.requiresAdmin, path).toBe(true)
    }
  })
})
