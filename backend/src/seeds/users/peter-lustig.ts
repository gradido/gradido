import { RoleNames } from '@enum/RoleNames'

import { UserInterface } from './UserInterface'

export const peterLustig: UserInterface = {
  email: 'peter@lustig.de',
  firstName: 'Peter',
  lastName: 'Lustig',
  // description: 'Latzhose und Nickelbrille',
  createdAt: new Date('2020-11-25T10:48:43'),
  emailChecked: true,
  language: 'de',
  role: RoleNames.ROLE_NAME_ADMIN,
}
