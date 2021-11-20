import { RIGHTS } from './RIGHTS'
import { Role } from './Role'

export const hasRight = (right: RIGHTS, role: Role): boolean => {
  return role.rights.includes(right)
}
