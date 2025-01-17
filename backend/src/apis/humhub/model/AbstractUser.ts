import { User } from '@entity/User'

import { PublishNameLogic } from '@/data/PublishName.logic'
import { PublishNameType } from '@/graphql/enum/PublishNameType'

import { Account } from './Account'
import { Profile } from './Profile'

export abstract class AbstractUser {
  public constructor(user: User) {
    this.account = new Account(user)
    this.profile = new Profile(user)
    // temp fix for prevent double usernames in humhub, if the username ist created from initials
    const publishNameLogic = new PublishNameLogic(user)
    if (publishNameLogic.isUsernameFromInitials(user.humhubPublishName as PublishNameType)) {
      this.profile.firstname = this.account.username
      this.account.username = user.gradidoID
    }
  }

  account: Account
  profile: Profile
}
