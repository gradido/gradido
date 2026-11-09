// AI-GENERATED — not an architecture reference
import { moderator } from './signIn'

const COMMUNITY = moderator.communityUuid

/** A member as searchUsers lists them; `id` makes the names, the rest is set by `more`. */
export const member = (id: number, more: Record<string, unknown> = {}) => ({
  userId: id,
  firstName: `First${id}`,
  lastName: `Last${id}`,
  alias: `member${id}`,
  email: `member${id}@example.org`,
  // GradidoUnit: the server sends amounts as strings
  creation: ['1000', '1000', '1000'],
  emailChecked: true,
  emailConfirmationSend: null,
  deletedAt: null,
  createdAt: '2026-01-15T10:00:00.000Z',
  role: null,
  creationAllowed: true,
  gradidoID: `00000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
  communityUuid: COMMUNITY,
  findableOnMap: false,
  ...more,
})

export const searchUsers = (
  userList: ReturnType<typeof member>[],
  userCount = userList.length,
) => ({
  userCount,
  userList,
})
