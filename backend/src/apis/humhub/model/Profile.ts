/* eslint-disable camelcase */
import { User } from '@entity/User'

import { CONFIG } from '@/config'
import { PublishNameLogic } from '@/data/PublishName.logic'
import { PublishNameType } from '@/graphql/enum/PublishNameType'

export class Profile {
  public constructor(user: User) {
    const publishNameLogic = new PublishNameLogic(user)
    this.firstname = publishNameLogic.getFirstName(user.humhubPublishName as PublishNameType)
    this.lastname = publishNameLogic.getLastName(user.humhubPublishName as PublishNameType)
    this.gradido_address = CONFIG.COMMUNITY_NAME + '/' + user.gradidoID
  }

  firstname: string
  lastname: string
  gradido_address: string
}
