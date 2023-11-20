import { GmsCommunityProfile } from './GmsCommunityProfile'
import { GmsRole } from './GmsRoles'

export class GmsCommunity {
  id: number
  uuid: string
  communityUuid: string
  email: string
  countryCode: string
  mobile: string
  status: number
  createdAt: Date
  updatedAt: Date
  UserProfile: unknown
  communityProfile: GmsCommunityProfile
  roles: GmsRole[]
}
