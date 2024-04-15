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
  }

  username: string
  email: string
  tags: string[]
  language: string
}
