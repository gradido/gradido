// AI-GENERATED — not an architecture reference
import { describe, expect, it, vi } from 'vitest'
import { routes } from './routes'

// router.test.js replaces the routes with a list of its own, so nothing there reads this file.
vi.mock('@/pages/ChatSettings', () => ({ ChatSettings: { name: 'ChatSettings' } }))
vi.mock('@/pages/Dashboard', () => ({ Dashboard: { name: 'Dashboard' } }))
vi.mock('@/pages/Statistic', () => ({ Statistic: { name: 'Statistic' } }))

const route = (path) => routes.find((candidate) => candidate.path === path)

describe('routes', () => {
  it('opens on the start page', async () => {
    expect((await route('/').component()).name).toBe('Dashboard')
  })

  it('gives the figures a page of their own, open to the whole moderation, and loads it', async () => {
    expect(route('/statistic')).toMatchObject({ name: 'statistic' })
    expect(route('/statistic').meta?.requiresAdmin).toBeUndefined()
    expect((await route('/statistic').component()).name).toBe('Statistic')
  })

  // The menu hides these entries from moderators, but hiding is a convenience: the guard reads
  // `requiresAdmin` from the route (guards.ts), and the backend's rights have the last word.
  it('keeps the chat page for administrators, and loads it', async () => {
    expect(route('/chat')).toMatchObject({ name: 'chat', meta: { requiresAdmin: true } })
    expect((await route('/chat').component()).name).toBe('ChatSettings')
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
