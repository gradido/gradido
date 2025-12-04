import { UserInterface } from './UserInterface'
import { RoleNames } from '../../enum'

export const peterLustig: UserInterface = {
  email: 'peter@lustig.de',
  firstName: 'Peter',
  lastName: 'Lustig',
  // description: 'Latzhose und Nickelbrille',
  createdAt: new Date('2020-11-25T10:48:43'),
  emailChecked: true,
  language: 'de',
  role: RoleNames.ADMIN,
}
