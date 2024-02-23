import { User } from '@entity/User'
import i18n from 'i18n'

import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'
import { LogError } from '@/server/LogError'
import { isLanguage } from '@/util/validate'

import { AbstractUpdateUserRole } from './AbstractUpdateUser.role'

export class UpdateUserLanguageRole extends AbstractUpdateUserRole {
  public update(user: User, { language }: UpdateUserInfosArgs): Promise<void> {
    if (language) {
      if (!isLanguage(language)) {
        throw new LogError('Given language is not a valid language', language)
      }
      user.language = language
      i18n.setLocale(language)
    }
    return Promise.resolve()
  }
}
