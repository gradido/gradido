import { GmsRole } from './GmsRoles'
import { GmsUserAccount } from './GmsUserAccount'
import { GmsUserProfile } from './GmsUserProfile'

export class GmsUser {
  id: number
  uuid: string
  communityUuid: string
  email: string
  countryCode: string
  mobile: string
  status: number
  createdAt: Date
  updatedAt: Date
  userProfile: GmsUserProfile
  userAccounts: GmsUserAccount[]
  roles: GmsRole[]
}
