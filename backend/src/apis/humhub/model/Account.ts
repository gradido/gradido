import { User } from '@entity/User'

import { convertGradidoLanguageToHumhub } from '@/apis/humhub/convertLanguage'

export class Account {
  public constructor(user: User) {
    if (user.alias && user.alias.length > 2) {
      this.username = user.alias
    } else {
      // Use the replace method to remove the part after '+' and before '@'
      // source: https://people.cs.rutgers.edu/~watrous/plus-signs-in-email-addresses.html
      // email address with + exist but humhub doesn't allow username with +
      this.username = user.emailContact.email.replace(/\+(.*)@/, '@')
    }

    this.email = user.emailContact.email
    this.language = convertGradidoLanguageToHumhub(user.language)
  }

  username: string
  email: string
  tags: string[]
  language: string
}
