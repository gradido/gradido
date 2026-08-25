import { User } from 'database'

import { CONFIG } from '@/config'
import { PublishNameLogic } from '@/data/PublishName.logic'

export class Profile {
  public constructor(user: User) {
    const publishNameLogic = new PublishNameLogic(user)

    // The DISPLAY is the alias (NU-024): what a person reads in HumHub. In humhub the
    // first name is shown if it exists, else the account username; both into first_name
    // keeps it searchable there. The publish-name setting no longer steers this --
    // ⛔ it keeps steering Account.username, the KEY HumHub recognises the user by,
    // which must not change or the login breaks for existing accounts.
    this.firstname = publishNameLogic.getPublicAlias()
    this.lastname = ''

    this.gradido_address = `${CONFIG.COMMUNITY_NAME}/${publishNameLogic.getPublicAlias()}`
  }

  firstname: string
  lastname: string
  gradido_address: string
}
