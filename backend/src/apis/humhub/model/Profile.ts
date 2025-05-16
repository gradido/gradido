import { User } from 'database'

import { CONFIG } from '@/config'
import { PublishNameLogic } from '@/data/PublishName.logic'
import { PublishNameType } from '@/graphql/enum/PublishNameType'

export class Profile {
  public constructor(user: User) {
    const publishNameLogic = new PublishNameLogic(user)
    this.firstname = publishNameLogic.getFirstName(user.humhubPublishName as PublishNameType)
    this.lastname = publishNameLogic.getLastName(user.humhubPublishName as PublishNameType)

    this.gradido_address = `${CONFIG.COMMUNITY_NAME}/${
      publishNameLogic.hasAlias() ? user.alias : user.gradidoID
    }`

    // we need to get our public name to humhub, but the public name isn't always unique,
    // so in some cases we must cheat and put the public name into first_name, if it isn't unique,
    // to let the username to be unique either alias or gradido id
    // in humhub first name is shown if exist else username
    // if it shows first_name it will also show last_name if exist
    // if we have public name from alias, we have only 2 character for first name and 2 for last name,
    // but this isn't searchable in humhub, so we put both into first_name
    if (publishNameLogic.isUsernameFromInitials(user.humhubPublishName as PublishNameType)) {
      this.firstname = publishNameLogic.getUsernameFromInitials()
      this.lastname = ''
    }
  }

  firstname: string
  lastname: string
  gradido_address: string
}
