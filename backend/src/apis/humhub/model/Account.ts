/* eslint-disable camelcase */
import { User } from '@entity/User'

import { convertGradidoLanguageToHumhub } from '@/apis/humhub/convertLanguage'
import { PublishNameLogic } from '@/data/PublishName.logic'
import { PublishNameType } from '@/graphql/enum/PublishNameType'

export class Account {
  public constructor(user: User) {
    const publishNameLogic = new PublishNameLogic(user)
    this.username = publishNameLogic.getUsername(user.humhubPublishName as PublishNameType)
    this.email = user.emailContact.email
    this.language = convertGradidoLanguageToHumhub(user.language)
    this.status = 1
  }

  username: string
  email: string
  language: string
  status: number
}
