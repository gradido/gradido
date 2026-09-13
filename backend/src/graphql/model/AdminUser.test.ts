// AI-GENERATED — not an architecture reference

import { AdminUser } from '@model/AdminUser'
import { User } from 'database'

// searchAdminUsers only lists members with an assignable role (see AdminUserGroups.test.ts),
// so a member without one here is a caller's bug. It fails loudly instead of answering an
// empty role the schema would pass on as a real value.
describe('AdminUser', () => {
  it('refuses a member without a role', () => {
    const member = { id: 7, userRole: null } as User
    expect(() => new AdminUser(member)).toThrow('AdminUser without a role: user 7')
  })
})
