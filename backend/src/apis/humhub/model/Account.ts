/* eslint-disable camelcase */
import { User } from '@entity/User'

import { convertGradidoLanguageToHumhub } from '@/apis/humhub/convertLanguage'

export class Account {
  public constructor(user: User) {
    if (user.alias && user.alias.length > 2) {
      this.username = user.alias
    } else {
      this.username = user.gradidoID
    }

    this.email = user.emailContact.email
    this.language = convertGradidoLanguageToHumhub(user.language)
    this.status = 1
  }

  username: string
  email: string
  language: string
  status: number
}
