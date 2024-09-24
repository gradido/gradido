import { CONFIG } from '@/config'

import { GetUser } from './model/GetUser'

export function getAvatarUrl(humhubUser: GetUser): string | null {
  if (humhubUser.guid) {
    return CONFIG.HUMHUB_API_URL + '/uploads/profile_image/' + humhubUser.guid + '.jpg'
  }
  return null
}
