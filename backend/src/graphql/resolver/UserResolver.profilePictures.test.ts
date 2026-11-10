// AI-GENERATED — not an architecture reference
// The answers that carry a profile picture stay out of the request log: every query that hands
// one out counts it in the request's budget, and plugins.ts reads the count (plugins.test.ts).
// Counted before anything is read, as the other pictures are -- the answer of a request that
// found nothing stays out as well. No database: what is read does not matter here.
import { Context, newRequestBudget } from '@/server/context'
import { UserResolver } from './UserResolver'

const requestOf = (id = 7): Context =>
  ({
    token: null,
    setHeaders: [],
    requestBudget: newRequestBudget(),
    user: { id },
  }) as unknown as Context

describe('UserResolver, the answers that carry a profile picture', () => {
  const resolver = new UserResolver()

  it("counts the member's own picture at full size", async () => {
    const context = requestOf()
    await resolver.avatarFull(context).catch(() => null)
    expect(context.requestBudget.profilePicturesServed).toBe(1)
  })

  it('counts the pictures of other members', async () => {
    const context = requestOf()
    await resolver.memberAvatars({ refs: [] } as never, context).catch(() => null)
    expect(context.requestBudget.profilePicturesServed).toBe(1)
  })

  it("counts the member's own small picture where the answer carries it", () => {
    const context = requestOf()
    expect(resolver.avatar({ id: 7, avatar: 'own-small' } as never, context)).toBe('own-small')
    expect(context.requestBudget.profilePicturesServed).toBe(1)
  })

  it('counts nothing where there is no picture to carry', () => {
    const context = requestOf()
    expect(resolver.avatar({ id: 8, avatar: 'their-small' } as never, context)).toBeNull()
    expect(resolver.avatar({ id: 7, avatar: null } as never, context)).toBeNull()
    expect(context.requestBudget.profilePicturesServed).toBe(0)
  })
})
